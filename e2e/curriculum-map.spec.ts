import { test, expect, type Page } from "@playwright/test";
import {
  uniqueId,
  getCourseInCurriculum,
  getAnotherCourseInCurriculum,
  getStudentCourse,
  getUserByStudentNumber,
  getStudentProfileByUserId,
  seedCourseRelationship,
  deleteCourseRelationship,
} from "./db-helper";

const UNIFIED_CURRICULUM_NAME = "Computer Engineering — Unified";
const SE_CURRICULUM_NAME = "Computer Engineering — Software Engineering";

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
  const studentNumber = uniqueId("e2e-map");
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Matched by name AND course code: two different courses across curricula
// can share the exact same display name (e.g. "کارآموزی" exists, with
// different codes, in both the Software Engineering and Unified curricula —
// see docs/06_Curriculum_Dataset.md §3.5 and §4.6), so name alone is not a
// reliable locator.
function courseButton(page: Page, course: { name: string; course_code?: string; courseCode?: string }) {
  const code = course.course_code ?? course.courseCode ?? "";
  return page.getByRole("button", {
    name: new RegExp(`^${escapeRegExp(course.name)} \\(${escapeRegExp(code)}\\)`),
  });
}

test.describe("access", () => {
  test("unauthenticated visitors are redirected away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("a student only sees courses from their own assigned curriculum", async ({ page }) => {
    const seCourse = await getCourseInCurriculum(SE_CURRICULUM_NAME);
    await registerAndReachDashboard(page, UNIFIED_PROFILE);

    await expect(page.getByText(UNIFIED_CURRICULUM_NAME, { exact: true })).toBeVisible();
    await expect(courseButton(page, seCourse)).not.toBeVisible();
  });
});

test.describe("curriculum and categories", () => {
  test("shows a real course from the student's curriculum with its category in the detail dialog", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await courseButton(page, course).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: course.name })).toBeVisible();
    await expect(page.getByRole("dialog").getByText(course.course_code, { exact: true })).toBeVisible();
  });
});

test.describe("status and eligibility", () => {
  test("a not-completed course is shown as available with no reasons or warnings", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await courseButton(page, course).click();
    await expect(page.getByRole("dialog").getByText("قابل انتخاب", { exact: true })).toBeVisible();
  });

  test("marking a course passed shows it as Passed and then Blocked (already passed) on reopen", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    await courseButton(page, course).click();
    await selectOption(page, "وضعیت", "گذرانده");
    await page.getByRole("button", { name: "ذخیره وضعیت" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(courseButton(page, course)).toContainText("گذرانده");

    await courseButton(page, course).click();
    await expect(page.getByRole("dialog").getByText("غیرقابل انتخاب", { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog").getByText("این درس قبلاً گذرانده شده است.")).toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse.status).toBe("PASSED");
  });

  test("marking a course failed shows an available-with-warning risk with no recorded term", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await courseButton(page, course).click();
    await selectOption(page, "وضعیت", "مردود");
    await page.getByRole("button", { name: "ذخیره وضعیت" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await courseButton(page, course).click();
    await expect(page.getByRole("dialog").getByText("قابل انتخاب با هشدار", { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog").getByText("ترمی برای این تلاش ثبت نشده است")).toBeVisible();
  });

  test("the status toolbar pre-fills the detail dialog rather than applying instantly", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await page.getByRole("button", { name: "اعمال وضعیت: در حال تحصیل", exact: true }).click();
    await courseButton(page, course).click();

    // Preset into the dialog's status field, not applied yet — the toolbar
    // never mutates data on the click that opens the dialog.
    await expect(page.getByLabel("وضعیت", { exact: true })).toContainText("در حال تحصیل");
    await page.getByRole("button", { name: "ذخیره وضعیت" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(courseButton(page, course)).toContainText("در حال تحصیل");
  });
});

test.describe("filters", () => {
  test("toggling a status filter chip changes its pressed state without altering academic data", async ({
    page,
  }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const { studentNumber } = await registerAndReachDashboard(page);

    const filterButton = page.getByRole("button", { name: "گذرانده", exact: true });
    await expect(filterButton).toHaveAttribute("aria-pressed", "false");
    await filterButton.click();
    await expect(filterButton).toHaveAttribute("aria-pressed", "true");

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const studentCourse = await getStudentCourse(profile.id, course.id);
    expect(studentCourse).toBeNull();
  });
});

test.describe("relationships", () => {
  test("zero verified relationships produce zero edges on the map", async ({ page }) => {
    await registerAndReachDashboard(page);
    await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  });

  test("a verified prerequisite relationship renders an edge and is shown in the dependent course's detail", async ({
    page,
  }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    const relationship = await seedCourseRelationship(courseA.id, courseB.id, "PREREQUISITE");

    try {
      await registerAndReachDashboard(page);
      await expect(page.locator(".react-flow__edge")).toHaveCount(1);

      await courseButton(page, courseB).click();
      await expect(page.getByRole("dialog").getByText(`نیازمند پیش‌نیاز: ${courseA.name}`)).toBeVisible();
    } finally {
      await deleteCourseRelationship(relationship.id);
    }
  });
});

test.describe("security", () => {
  test("one student's map and status changes are isolated from another student's", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);

    await registerAndReachDashboard(page);
    await courseButton(page, course).click();
    await selectOption(page, "وضعیت", "گذرانده");
    await page.getByRole("button", { name: "ذخیره وضعیت" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByRole("button", { name: "خروج" }).click();
    await expect(page).toHaveURL("/login");

    await registerAndReachDashboard(page);
    // A fresh student must see the same course as NOT_COMPLETED, not PASSED.
    await expect(courseButton(page, course)).toContainText("گذرانده نشده");
  });
});
