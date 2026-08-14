import { test, expect, type Page } from "@playwright/test";
import {
  uniqueId,
  seedStudent,
  seedCourse,
  getUserByStudentNumber,
  getStudentProfileByUserId,
  getCourseInCurriculum,
  getStudentCourse,
  getStudentCourseAttempts,
  getStudentSemesterByTermCode,
} from "./db-helper";

const UNIFIED_CURRICULUM_NAME = "Computer Engineering — Unified";
const SE_CURRICULUM_NAME = "Computer Engineering — Software Engineering";

function randomPhoneNumber(): string {
  return `09${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("")}`;
}

async function selectOption(page: Page, triggerLabel: string, optionText: string) {
  // exact: true avoids ambiguity between e.g. "Status for X" and the
  // "Save status for X" button, whose accessible name contains it as a substring.
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

const UNIFIED_PROFILE = {
  entryYear: 1404,
  major: "Computer Engineering",
  orientation: "Unified",
  studyType: "Full-time",
};

async function registerAndOnboard(
  page: Page,
  profileValues: typeof UNIFIED_PROFILE,
): Promise<{ studentNumber: string }> {
  const studentNumber = uniqueId("e2e-status");
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

  return { studentNumber };
}

async function loginAsSeededStudent(
  page: Page,
  credentials: { studentNumber: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("Student number or phone number").fill(credentials.studentNumber);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

test.describe("Simple Mode", () => {
  test("student can create academic status data (mark a course passed)", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Simple Mode" }).click();
    await expect(page).toHaveURL("/academic-status");

    await selectOption(page, `Status for ${course.name}`, "Passed");
    await page.getByLabel(`Save status for ${course.name}`).click();
    await expect(page.getByText("Course status updated.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PASSED");
  });

  test("student can mark a course as planned with an intended term", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Simple Mode" }).click();
    await selectOption(page, `Status for ${course.name}`, "Planned");
    await page.getByLabel(`Intended term for ${course.name}`).fill("4051");
    await page.getByLabel(`Save status for ${course.name}`).click();
    await expect(page.getByText("Course status updated.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PLANNED");
    expect(studentCourse.academic_term_id).not.toBeNull();
  });

  test("student can update an existing course status (Passed -> Failed)", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Simple Mode" }).click();
    await selectOption(page, `Status for ${course.name}`, "Passed");
    await page.getByLabel(`Save status for ${course.name}`).click();
    await expect(page.getByText("Course status updated.")).toBeVisible();

    await selectOption(page, `Status for ${course.name}`, "Failed");
    await page.getByLabel(`Save status for ${course.name}`).click();
    await expect(page.getByText("Course status updated.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("FAILED");
  });

  test("a course reference outside the student's curriculum is rejected by the server", async ({
    page,
  }) => {
    // The UI only ever lists courses from the student's own curriculum, so
    // this simulates a tampered client request (docs/09_Technical_Requirements.md
    // §18/§28 — the server, not the client UI, is authoritative) by writing
    // an out-of-curriculum course id directly into the hidden form field.
    const outsideCourse = await getCourseInCurriculum(SE_CURRICULUM_NAME);
    const anyCourse = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Simple Mode" }).click();

    const row = page.locator("form", { hasText: anyCourse.name });
    // Select first: the Select's onValueChange re-renders this row, which
    // would reset a controlled hidden input back to its original prop value
    // if tampered beforehand. Tamper last, right before submitting.
    await selectOption(page, `Status for ${anyCourse.name}`, "Passed");
    await row.locator('input[name="courseId"]').evaluate((el: HTMLInputElement, value: string) => {
      el.value = value;
    }, outsideCourse.id);
    await row.getByRole("button", { name: /Save status/ }).click();

    await expect(page.getByText("That course is not part of your curriculum.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, outsideCourse.id);
    expect(studentCourse).toBeNull();
  });
});

test.describe("Advanced Mode", () => {
  test("student can create a semester record with GPA", async ({ page }) => {
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Advanced Mode" }).click();
    await expect(page).toHaveURL("/academic-setup/advanced");

    await page.getByLabel("Academic term code").fill("4051");
    await page.getByLabel("Semester GPA").fill("17.25");
    await page.getByRole("button", { name: "Add / update semester" }).click();
    await expect(page.getByText("Semester 4051 saved.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const semester = await getStudentSemesterByTermCode(profile.id, "4051");
    expect(semester).not.toBeNull();
    expect(Number(semester.semester_gpa)).toBeCloseTo(17.25);
  });

  test("student can associate a course result with a semester", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Advanced Mode" }).click();
    await page.getByLabel("Academic term code").fill("4052");
    await page.getByLabel("Semester GPA").fill("15");
    await page.getByRole("button", { name: "Add / update semester" }).click();
    await expect(page.getByText("Semester 4052 saved.")).toBeVisible();

    await selectOption(page, "Course for term 4052", course.name);
    await selectOption(page, "Result for term 4052", "Passed");
    await page.getByLabel("Add result for term 4052").click();
    await expect(page.getByText("Course result recorded.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const attempts = await getStudentCourseAttempts(profile.id, course.id);
    expect(attempts).toHaveLength(1);
    expect(attempts[0].result).toBe("PASSED");
    expect(attempts[0].term_code).toBe("4052");

    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PASSED");
  });

  test("academic term code validation rejects a malformed code", async ({ page }) => {
    await registerAndOnboard(page, UNIFIED_PROFILE);
    await page.getByRole("link", { name: "Start Advanced Mode" }).click();

    await page.getByLabel("Academic term code").fill("bad-code");
    await page.getByLabel("Semester GPA").fill("15");
    await page.getByRole("button", { name: "Add / update semester" }).click();

    await expect(
      page.getByText("Enter a valid academic term code (e.g. 4051)."),
    ).toBeVisible();
  });

  test("a failed course's attempt preserves its original semester when later retaken", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Advanced Mode" }).click();

    // First attempt: failed in term 4051.
    await page.getByLabel("Academic term code").fill("4051");
    await page.getByLabel("Semester GPA").fill("12");
    await page.getByRole("button", { name: "Add / update semester" }).click();
    await expect(page.getByText("Semester 4051 saved.")).toBeVisible();
    await selectOption(page, "Course for term 4051", course.name);
    await selectOption(page, "Result for term 4051", "Failed");
    await page.getByLabel("Add result for term 4051").click();
    await expect(page.getByText("Course result recorded.")).toBeVisible();

    // Retake: passed in term 4052.
    await page.getByLabel("Academic term code").fill("4052");
    await page.getByLabel("Semester GPA").fill("16");
    await page.getByRole("button", { name: "Add / update semester" }).click();
    await expect(page.getByText("Semester 4052 saved.")).toBeVisible();
    await selectOption(page, "Course for term 4052", course.name);
    await selectOption(page, "Result for term 4052", "Passed");
    await page.getByLabel("Add result for term 4052").click();
    await expect(page.getByText("Course result recorded.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const attempts = await getStudentCourseAttempts(profile.id, course.id);
    expect(attempts).toHaveLength(2);
    const byTerm = new Map(attempts.map((a) => [a.term_code, a.result]));
    expect(byTerm.get("4051")).toBe("FAILED");
    expect(byTerm.get("4052")).toBe("PASSED");

    // Current status reflects the latest recorded attempt.
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PASSED");
  });
});

test.describe("access control", () => {
  test("unauthenticated visitors are redirected away from all academic-status routes", async ({
    page,
  }) => {
    await page.goto("/academic-setup");
    await expect(page).toHaveURL("/login");

    await page.goto("/academic-status");
    await expect(page).toHaveURL("/login");

    await page.goto("/academic-setup/advanced");
    await expect(page).toHaveURL("/login");
  });

  test("one student cannot see or affect another student's academic status data", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);

    const studentA = await registerAndOnboard(page, UNIFIED_PROFILE);
    await page.getByRole("link", { name: "Start Simple Mode" }).click();
    await selectOption(page, `Status for ${course.name}`, "Passed");
    await page.getByLabel(`Save status for ${course.name}`).click();
    await expect(page.getByText("Course status updated.")).toBeVisible();

    const userA = await getUserByStudentNumber(studentA.studentNumber);
    const profileA = await getStudentProfileByUserId(userA.id);
    const studentCourseA = await getStudentCourse(profileA.id, course.id);
    expect(studentCourseA.status).toBe("PASSED");

    // The logout control lives on the dashboard, not on /academic-status.
    await page.getByRole("button", { name: "Continue to dashboard" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");

    // Student B never touches this course; A's row must remain untouched.
    await registerAndOnboard(page, UNIFIED_PROFILE);
    await page.getByRole("link", { name: "Start Simple Mode" }).click();

    const studentCourseAAfter = await getStudentCourse(profileA.id, course.id);
    expect(studentCourseAAfter.status).toBe("PASSED");
    expect(studentCourseAAfter.id).toBe(studentCourseA.id);
  });
});

test.describe("integrity", () => {
  test("a course from a different curriculum is rejected (curriculum mismatch)", async ({
    page,
  }) => {
    const seCourse = await getCourseInCurriculum(SE_CURRICULUM_NAME);
    await registerAndOnboard(page, UNIFIED_PROFILE); // student is Unified, not SE
    const anyCourse = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);

    await page.getByRole("link", { name: "Start Simple Mode" }).click();
    const row = page.locator("form", { hasText: anyCourse.name });
    // Select first: the Select's onValueChange re-renders this row, which
    // would reset a controlled hidden input back to its original prop value
    // if tampered beforehand. Tamper last, right before submitting.
    await selectOption(page, `Status for ${anyCourse.name}`, "Passed");
    await row.locator('input[name="courseId"]').evaluate((el: HTMLInputElement, value: string) => {
      el.value = value;
    }, seCourse.id);
    await row.getByRole("button", { name: /Save status/ }).click();

    await expect(page.getByText("That course is not part of your curriculum.")).toBeVisible();
  });

  test("submitting a duplicate course attempt for the same term updates rather than duplicates", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Advanced Mode" }).click();
    await page.getByLabel("Academic term code").fill("4053");
    await page.getByLabel("Semester GPA").fill("14");
    await page.getByRole("button", { name: "Add / update semester" }).click();
    await expect(page.getByText("Semester 4053 saved.")).toBeVisible();

    await selectOption(page, "Course for term 4053", course.name);
    await selectOption(page, "Result for term 4053", "Failed");
    await page.getByLabel("Add result for term 4053").click();
    await expect(page.getByText("Course result recorded.")).toBeVisible();

    // Same course, same term, different result.
    await selectOption(page, "Course for term 4053", course.name);
    await selectOption(page, "Result for term 4053", "Passed");
    await page.getByLabel("Add result for term 4053").click();
    await expect(page.getByText("Course result recorded.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const attempts = await getStudentCourseAttempts(profile.id, course.id);
    expect(attempts).toHaveLength(1);
    expect(attempts[0].result).toBe("PASSED");
  });

  test("a negative semester GPA is rejected", async ({ page }) => {
    await registerAndOnboard(page, UNIFIED_PROFILE);
    await page.getByRole("link", { name: "Start Advanced Mode" }).click();

    await page.getByLabel("Academic term code").fill("4061");
    await page.getByLabel("Semester GPA").fill("-5");
    await page.getByRole("button", { name: "Add / update semester" }).click();

    await expect(page.getByText("Semester GPA cannot be negative.")).toBeVisible();
  });

  test("existing profile data remains intact after academic-status actions", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndOnboard(page, UNIFIED_PROFILE);

    await page.getByRole("link", { name: "Start Simple Mode" }).click();
    await selectOption(page, `Status for ${course.name}`, "Passed");
    await page.getByLabel(`Save status for ${course.name}`).click();
    await expect(page.getByText("Course status updated.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    expect(profile.entry_year).toBe(UNIFIED_PROFILE.entryYear);
    expect(profile.major).toBe(UNIFIED_PROFILE.major);
    expect(profile.orientation).toBe(UNIFIED_PROFILE.orientation);
  });
});

test.describe("regression", () => {
  test("a seeded student with no profile is still routed through profile setup first", async ({
    page,
  }) => {
    const { studentNumber, password } = await seedStudent();
    await loginAsSeededStudent(page, { studentNumber, password });
    await expect(page).toHaveURL("/profile/setup");
  });

  test("unrelated throwaway courses (e2e fixtures) never appear in a student's curriculum course list", async ({
    page,
  }) => {
    const fixtureCourse = await seedCourse();
    await registerAndOnboard(page, UNIFIED_PROFILE);
    await page.getByRole("link", { name: "Start Simple Mode" }).click();

    await expect(page.getByText(fixtureCourse.courseCode)).not.toBeVisible();
  });
});
