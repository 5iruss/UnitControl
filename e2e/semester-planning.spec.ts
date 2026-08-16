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
  studyType: "تمام‌وقت",
};

function randomPhoneNumber(): string {
  return `09${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("")}`;
}

async function selectOption(page: Page, triggerLabel: string, optionText: string) {
  await page.getByLabel(triggerLabel, { exact: true }).click();
  await page.getByRole("option", { name: optionText, exact: true }).click();
}

async function fillProfileForm(
  page: Page,
  values: { entryYear: number; major: string; orientation: string; studyType: string },
) {
  await page.getByLabel("سال ورود").fill(String(values.entryYear));
  await selectOption(page, "رشته", values.major);
  await selectOption(page, "گرایش", values.orientation);
  await selectOption(page, "نوع تحصیل", values.studyType);
}

async function registerAndReachDashboard(
  page: Page,
  profileValues: typeof UNIFIED_PROFILE = UNIFIED_PROFILE,
): Promise<{ studentNumber: string }> {
  const studentNumber = uniqueId("e2e-plan");
  await page.goto("/register");
  await page.getByLabel("شماره دانشجویی").fill(studentNumber);
  await page.getByLabel("رمز عبور").fill("CorrectPass123!");
  await page.getByLabel("نام", { exact: true }).fill("Sara");
  await page.getByLabel("نام خانوادگی").fill("Ahmadi");
  await page.getByLabel("شماره تلفن").fill(randomPhoneNumber());
  await page.getByRole("button", { name: "ساخت حساب" }).click();
  await expect(page).toHaveURL("/profile/setup");

  await fillProfileForm(page, profileValues);
  await page.getByRole("button", { name: "ادامه" }).click();
  await expect(page).toHaveURL("/academic-setup");

  await page.getByRole("link", { name: "شروع حالت ساده" }).click();
  await expect(page).toHaveURL("/academic-status");
  await page.getByRole("button", { name: "ادامه به داشبورد" }).click();
  await expect(page).toHaveURL("/dashboard");

  return { studentNumber };
}

async function addToPlan(page: Page, courseName: string, termCode: string) {
  await selectOption(page, "درس مورد نظر برای برنامه‌ریزی", courseName);
  await page.getByLabel("ترم مدنظر", { exact: true }).fill(termCode);
  await page.getByRole("button", { name: "افزودن به برنامه" }).click();
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
    await expect(semesterHeading(page, "مهر 1405")).toBeVisible();
    await expect(page.getByText("1 درس", { exact: true })).toBeVisible();
  });

  test("groups multiple courses planned into the same term under one semester", async ({ page }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    await registerAndReachDashboard(page);

    await addToPlan(page, courseA.name, "4051");
    await addToPlan(page, courseB.name, "4051");

    await expect(page.getByRole("heading", { name: "مهر 1405" })).toHaveCount(1);
    await expect(page.getByText("2 درس", { exact: true })).toBeVisible();
  });

  test("orders semesters chronologically, not by insertion order", async ({ page }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    await registerAndReachDashboard(page);

    // Plan the LATER term first, then the earlier one.
    await addToPlan(page, courseA.name, "4053");
    await addToPlan(page, courseB.name, "4051");

    const headings = page.getByRole("heading", { name: /مهر 1405|تابستان 1405/ });
    await expect(headings).toHaveCount(2);
    await expect(headings.first()).toContainText("مهر 1405");
    await expect(headings.last()).toContainText("تابستان 1405");
  });

  test("rejects an invalid term code and does not create a semester", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await selectOption(page, "درس مورد نظر برای برنامه‌ریزی", course.name);
    await page.getByLabel("ترم مدنظر", { exact: true }).fill("not-a-term");
    await page.getByRole("button", { name: "افزودن به برنامه" }).click();

    await expect(page.getByText("کد ترم معتبر وارد کنید")).toBeVisible();
    await expect(page.getByText("هنوز درسی برنامه‌ریزی نشده است.")).toBeVisible();
  });
});

test.describe("planning", () => {
  test("adds an eligible course to the plan", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "مهر 1405")).toBeVisible();

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
      await expect(semesterHeading(page, "مهر 1405")).toBeVisible();
      // Scoped to the "Planned semesters" section itself: Phase 9 also
      // surfaces this same Rules Engine warning elsewhere (the
      // recommendations/warnings panel), which is expected — this assertion
      // only cares that the planner row shows it.
      const plannedSemestersCard = page
        .getByText("برنامه ترم‌ها", { exact: true })
        .locator("..")
        .locator("..");
      await expect(
        plannedSemestersCard.locator("li", { hasText: courseB.name }).getByText("تأیید نشده"),
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

      await expect(page.getByText("پیش‌نیاز این درس تاکنون اخذ نشده است.")).toBeVisible();
      await expect(page.getByText("هنوز درسی برنامه‌ریزی نشده است.")).toBeVisible();
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
    await expect(semesterHeading(page, "مهر 1405")).toBeVisible();

    await page.getByRole("button", { name: `حذف ${course.name} از برنامه` }).click();
    await expect(semesterHeading(page, "مهر 1405")).not.toBeVisible();
    await expect(page.getByText("هنوز درسی برنامه‌ریزی نشده است.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("NOT_COMPLETED");
  });

  test("moves a planned course to a different semester", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "مهر 1405")).toBeVisible();

    await page.getByRole("button", { name: "جابه‌جایی", exact: true }).click();
    await page.getByLabel(`ترم جدید برای ${course.name}`).fill("4052");
    await page.getByRole("button", { name: "ذخیره ترم جدید" }).click();

    await expect(semesterHeading(page, "مهر 1405")).not.toBeVisible();
    await expect(semesterHeading(page, "بهمن 1405")).toBeVisible();

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

    await expect(semesterHeading(page, "مهر 1405")).not.toBeVisible();
    await expect(semesterHeading(page, "بهمن 1405")).toBeVisible();
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
    await selectOption(page, "وضعیت", "گذرانده");
    await page.getByRole("button", { name: "ذخیره وضعیت" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Passed courses are excluded from the "add to plan" picker entirely.
    await page.getByLabel("درس مورد نظر برای برنامه‌ریزی", { exact: true }).click();
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
    await page.getByLabel("کد ترم تحصیلی").fill("4053");
    await page.getByLabel("معدل ترم").fill("17.5");
    await page.getByRole("button", { name: "افزودن / به‌روزرسانی ترم" }).click();
    await expect(page.getByText("ترم 4053 ذخیره شد.")).toBeVisible();

    // Now do planning actions unrelated to that term.
    await page.goto("/dashboard");
    await addToPlan(page, planCourse.name, "4051");
    await expect(semesterHeading(page, "مهر 1405")).toBeVisible();

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
    await expect(semesterHeading(page, "مهر 1405")).toBeVisible();

    await expect(mapCourseButton(page, course)).toContainText("برنامه‌ریزی‌شده");
  });
});

test.describe("security", () => {
  test("one student's semester plan is isolated from another student's", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);

    await registerAndReachDashboard(page);
    await addToPlan(page, course.name, "4051");
    await expect(semesterHeading(page, "مهر 1405")).toBeVisible();

    await page.getByRole("button", { name: "خروج" }).click();
    await expect(page).toHaveURL("/login");

    await registerAndReachDashboard(page);
    await expect(page.getByText("هنوز درسی برنامه‌ریزی نشده است.")).toBeVisible();
    await expect(semesterHeading(page, "مهر 1405")).not.toBeVisible();
  });
});
