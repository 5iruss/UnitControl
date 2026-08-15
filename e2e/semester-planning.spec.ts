import { test, expect, type Page } from "@playwright/test";
import {
  uniqueId,
  getCourseInCurriculum,
  getAnotherCourseInCurriculum,
  getStudentCourse,
  getUserByStudentNumber,
  getStudentProfileByUserId,
  getStudentSemesterByTermCode,
  seedCourseRelationship,
  deleteCourseRelationship,
} from "./db-helper";

const UNIFIED_CURRICULUM_NAME = "Computer Engineering — Unified";

const UNIFIED_PROFILE = {
  entryYear: 1404,
  major: "Computer Engineering",
  orientation: "Unified",
  studyType: "Full-time",
};

function randomPhoneNumber(): string {
  return `09${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("")}`;
}

async function selectOption(page: Page, triggerLabel: string, optionText: string) {
  await page.getByLabel(triggerLabel, { exact: true }).click();
  await page.getByRole("option", { name: optionText }).click();
}

async function fillProfileForm(
  page: Page,
  values: { entryYear: number; major: string; orientation: string; studyType: string },
) {
  await page.getByLabel("Entry year").fill(String(values.entryYear));
  await selectOption(page, "Major", values.major);
  await selectOption(page, "Orientation", values.orientation);
  await selectOption(page, "Study type", values.studyType);
}

async function registerAndReachDashboard(
  page: Page,
  profileValues: typeof UNIFIED_PROFILE = UNIFIED_PROFILE,
): Promise<{ studentNumber: string }> {
  const studentNumber = uniqueId("e2e-plan");
  await page.goto("/register");
  await page.getByLabel("Student number").fill(studentNumber);
  await page.getByLabel("Password").fill("CorrectPass123!");
  await page.getByLabel("First name").fill("Sara");
  await page.getByLabel("Last name").fill("Ahmadi");
  await page.getByLabel("Phone number").fill(randomPhoneNumber());
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/profile/setup");

  await fillProfileForm(page, profileValues);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/academic-setup");

  await page.getByRole("link", { name: "Start Simple Mode" }).click();
  await expect(page).toHaveURL("/academic-status");
  await page.getByRole("button", { name: "Continue to dashboard" }).click();
  await expect(page).toHaveURL("/dashboard");

  return { studentNumber };
}

async function addToPlan(page: Page, courseName: string, termCode: string) {
  await selectOption(page, "Course to plan", courseName);
  await page.getByLabel("Intended term", { exact: true }).fill(termCode);
  await page.getByRole("button", { name: "Add to plan" }).click();
}

function semesterHeading(page: Page, termLabel: string) {
  return page.getByRole("heading", { name: termLabel });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapCourseButton(page: Page, course: { name: string; course_code: string }) {
  return page.getByRole("button", {
    name: new RegExp(`^${escapeRegExp(course.name)} \\(${escapeRegExp(course.course_code)}\\)`),
  });
}

test.describe("semester", () => {
  test("creates a new semester group by planning a course into a new term", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();
    await expect(page.getByText("1 course", { exact: true })).toBeVisible();
  });

  test("groups multiple courses planned into the same term under one semester", async ({ page }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    await registerAndReachDashboard(page);

    await addToPlan(page, courseA.name, "4051");
    await addToPlan(page, courseB.name, "4051");

    await expect(page.getByRole("heading", { name: "Mehr 1405" })).toHaveCount(1);
    await expect(page.getByText("2 courses", { exact: true })).toBeVisible();
  });

  test("orders semesters chronologically, not by insertion order", async ({ page }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    await registerAndReachDashboard(page);

    // Plan the LATER term first, then the earlier one.
    await addToPlan(page, courseA.name, "4053");
    await addToPlan(page, courseB.name, "4051");

    const headings = page.getByRole("heading", { name: /Mehr 1405|Summer 1405/ });
    await expect(headings).toHaveCount(2);
    await expect(headings.first()).toContainText("Mehr 1405");
    await expect(headings.last()).toContainText("Summer 1405");
  });

  test("rejects an invalid term code and does not create a semester", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await selectOption(page, "Course to plan", course.name);
    await page.getByLabel("Intended term", { exact: true }).fill("not-a-term");
    await page.getByRole("button", { name: "Add to plan" }).click();

    await expect(page.getByText("Enter a valid academic term code")).toBeVisible();
    await expect(page.getByText("No courses planned yet.")).toBeVisible();
  });
});

test.describe("planning", () => {
  test("adds an eligible course to the plan", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PLANNED");
  });

  test("adds an eligible-with-warning course and shows the warning (insufficient/uncertain data is never silently eligible or blocked)", async ({
    page,
  }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    const relationship = await seedCourseRelationship(courseA.id, courseB.id, "COREQUISITE");

    try {
      await registerAndReachDashboard(page);
      await addToPlan(page, courseB.name, "4051");

      // Allowed (added), not blocked — the semester group must exist.
      await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();
      // Scoped to the "Planned semesters" section itself: Phase 9 also
      // surfaces this same Rules Engine warning elsewhere (the
      // recommendations/warnings panel), which is expected — this assertion
      // only cares that the planner row shows it.
      const plannedSemestersCard = page
        .getByText("Planned semesters", { exact: true })
        .locator("..")
        .locator("..");
      await expect(
        plannedSemestersCard.locator("li", { hasText: courseB.name }).getByText("unverified"),
      ).toBeVisible();
    } finally {
      await deleteCourseRelationship(relationship.id);
    }
  });

  test("blocks an ineligible course (unmet prerequisite) and does not add it", async ({ page }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    const relationship = await seedCourseRelationship(courseA.id, courseB.id, "PREREQUISITE");

    try {
      await registerAndReachDashboard(page);
      await addToPlan(page, courseB.name, "4051");

      await expect(page.getByText("Prerequisite has not been previously attempted.")).toBeVisible();
      await expect(page.getByText("No courses planned yet.")).toBeVisible();
    } finally {
      await deleteCourseRelationship(relationship.id);
    }
  });

  test("removes a planned course and the semester group disappears when it was the only course", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();

    await page.getByRole("button", { name: `Remove ${course.name} from plan` }).click();
    await expect(semesterHeading(page, "Mehr 1405")).not.toBeVisible();
    await expect(page.getByText("No courses planned yet.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("NOT_COMPLETED");
  });

  test("moves a planned course to a different semester", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();

    await page.getByRole("button", { name: "Move", exact: true }).click();
    await page.getByLabel(`New intended term for ${course.name}`).fill("4052");
    await page.getByRole("button", { name: "Save new term" }).click();

    await expect(semesterHeading(page, "Mehr 1405")).not.toBeVisible();
    await expect(semesterHeading(page, "Bahman 1405")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PLANNED");
  });

  test("re-planning an already-planned course moves it rather than duplicating it", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await addToPlan(page, course.name, "4052");

    await expect(semesterHeading(page, "Mehr 1405")).not.toBeVisible();
    await expect(semesterHeading(page, "Bahman 1405")).toBeVisible();
    await expect(page.locator("li", { hasText: course.name })).toHaveCount(1);

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    expect(await getStudentCourse(profile.id, course.id)).not.toBeNull();
  });
});

test.describe("academic integrity", () => {
  test("a passed course cannot be added to a plan (never silently converted)", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    // Mark it passed via the curriculum map first.
    await mapCourseButton(page, course).click();
    await selectOption(page, "Status", "Passed");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Passed courses are excluded from the "add to plan" picker entirely.
    await page.getByLabel("Course to plan", { exact: true }).click();
    await expect(page.getByRole("option", { name: course.name })).not.toBeVisible();
    await page.keyboard.press("Escape");

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PASSED");
  });

  test("planning actions never change an existing semester GPA record", async ({ page }) => {
    const planCourse = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    // Record a semester GPA via Advanced Mode.
    await page.goto("/academic-setup/advanced");
    await page.getByLabel("Academic term code").fill("4053");
    await page.getByLabel("Semester GPA").fill("17.5");
    await page.getByRole("button", { name: "Add / update semester" }).click();
    await expect(page.getByText("Semester 4053 saved.")).toBeVisible();

    // Now do planning actions unrelated to that term.
    await page.goto("/dashboard");
    await addToPlan(page, planCourse.name, "4051");
    await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const semester = await getStudentSemesterByTermCode(profile.id, "4053");
    expect(Number(semester.semester_gpa)).toBe(17.5);
  });
});

test.describe("map integration", () => {
  test("a planned course shows as Planned on the curriculum map, in sync with the planner", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();

    await expect(mapCourseButton(page, course)).toContainText("Planned");
  });
});

test.describe("security", () => {
  test("one student's semester plan is isolated from another student's", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);

    await registerAndReachDashboard(page);
    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "Mehr 1405")).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");

    await registerAndReachDashboard(page);
    await expect(page.getByText("No courses planned yet.")).toBeVisible();
    await expect(semesterHeading(page, "Mehr 1405")).not.toBeVisible();
  });
});
