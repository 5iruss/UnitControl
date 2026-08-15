import { test, expect, type Page } from "@playwright/test";
import {
  countStudentCourses,
  getCurriculumByName,
  getStudentProfileByUserId,
  getUserByStudentNumber,
  seedAdmin,
  seedCourse,
  seedStudent,
  seedStudentCourse,
  uniqueId,
} from "./db-helper";

async function selectOption(page: Page, triggerLabel: string, optionText: string) {
  await page.getByLabel(triggerLabel).click();
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

function randomPhoneNumber(): string {
  return `09${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("")}`;
}

async function registerStudent(page: Page) {
  const studentNumber = uniqueId("e2e-profile");
  await page.goto("/register");
  await page.getByLabel("Student number").fill(studentNumber);
  await page.getByLabel("Password").fill("CorrectPass123!");
  await page.getByLabel("First name").fill("Sara");
  await page.getByLabel("Last name").fill("Ahmadi");
  await page.getByLabel("Phone number").fill(randomPhoneNumber());
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/profile/setup");
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

// Since Phase 5, profile creation lands on /academic-setup rather than
// /dashboard directly (docs/02_User_Flow.md §2, §5). Tests that need actual
// dashboard UI (logout, "Manage academic profile" link) must complete the
// one-time academic setup step first; Simple Mode with no statuses entered
// is sufficient to unlock it.
async function completeAcademicSetup(page: Page) {
  await expect(page).toHaveURL("/academic-setup");
  await page.getByRole("link", { name: "Start Simple Mode" }).click();
  await expect(page).toHaveURL("/academic-status");
  await page.getByRole("button", { name: "Continue to dashboard" }).click();
  await expect(page).toHaveURL("/dashboard");
}

test.describe("academic profile creation", () => {
  test("student is routed to profile setup after registration, then to the dashboard", async ({
    page,
  }) => {
    await registerStudent(page);

    await fillProfileForm(page, {
      entryYear: 1401,
      major: "Computer Engineering",
      orientation: "Software Engineering",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();

    await completeAcademicSetup(page);
    // getByRole scopes to the page's own <h1>, not Next.js's route
    // announcer (a hidden aria-live region that also mirrors the h1 text
    // for screen readers on navigation).
    await expect(page.getByRole("heading", { name: "Welcome, Sara Ahmadi." })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("correctly identifies the curriculum from entry year + orientation", async ({ page }) => {
    const { studentNumber } = await registerStudent(page);

    await fillProfileForm(page, {
      entryYear: 1404,
      major: "Computer Engineering",
      orientation: "Unified",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/academic-setup");

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const unified = await getCurriculumByName("Computer Engineering — Unified");

    expect(profile.curriculum_id).toBe(unified.id);
  });

  test("shows a clear error when required fields are missing", async ({ page }) => {
    await registerStudent(page);

    await page.getByLabel("Entry year").fill("1401");
    // Major auto-selects (only one option currently exists); leave
    // Orientation/Study type unselected to trigger required-field validation.
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Orientation is required.")).toBeVisible();
    await expect(page).toHaveURL("/profile/setup");
  });

  test("rejects an entry year / orientation combination with no matching curriculum", async ({
    page,
  }) => {
    await registerStudent(page);

    // 1403 is Unified-only; Software Engineering doesn't exist for 1403+.
    await fillProfileForm(page, {
      entryYear: 1403,
      major: "Computer Engineering",
      orientation: "Software Engineering",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText(/No curriculum matches the provided entry year/)).toBeVisible();
    await expect(page).toHaveURL("/profile/setup");
  });

  test("a student with an existing profile is redirected away from profile setup", async ({
    page,
  }) => {
    await registerStudent(page);
    await fillProfileForm(page, {
      entryYear: 1401,
      major: "Computer Engineering",
      orientation: "Software Engineering",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/academic-setup");

    await page.goto("/profile/setup");
    await expect(page).toHaveURL("/profile");
  });
});

test.describe("academic profile updates", () => {
  test("changing study type only does not trigger a reset warning", async ({ page }) => {
    await registerStudent(page);
    await fillProfileForm(page, {
      entryYear: 1401,
      major: "Computer Engineering",
      orientation: "Software Engineering",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await completeAcademicSetup(page);

    await page.getByRole("link", { name: "Manage academic profile" }).click();
    await expect(page).toHaveURL("/profile");

    await selectOption(page, "Study type", "Part-time");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Profile saved.")).toBeVisible();
    await expect(page.getByText(/will reset your existing academic/)).not.toBeVisible();
  });

  test("a curriculum-changing update requires explicit confirmation and can be cancelled", async ({
    page,
  }) => {
    const { studentNumber } = await registerStudent(page);
    await fillProfileForm(page, {
      entryYear: 1401,
      major: "Computer Engineering",
      orientation: "Software Engineering",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await completeAcademicSetup(page);

    await page.goto("/profile");
    await fillProfileForm(page, {
      entryYear: 1404,
      major: "Computer Engineering",
      orientation: "Unified",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText(/will reset your existing academic course-status data/)).toBeVisible();

    // Cancel: nothing should be persisted.
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByText(/will reset your existing academic course-status data/),
    ).not.toBeVisible();

    const user = await getUserByStudentNumber(studentNumber);
    const profile = await getStudentProfileByUserId(user.id);
    const se = await getCurriculumByName("Computer Engineering — Software Engineering");
    expect(profile.curriculum_id).toBe(se.id);
  });

  test("confirming a curriculum-changing update resets course-status data", async ({ page }) => {
    const { studentNumber, password, id: userId } = await seedStudent();
    const course = await seedCourse();

    await loginAsSeededStudent(page, { studentNumber, password });
    await expect(page).toHaveURL("/profile/setup");

    await fillProfileForm(page, {
      entryYear: 1401,
      major: "Computer Engineering",
      orientation: "Software Engineering",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/academic-setup");

    const profileBefore = await getStudentProfileByUserId(userId);
    await seedStudentCourse(profileBefore.id, course.id);
    expect(await countStudentCourses(profileBefore.id)).toBe(1);

    await page.goto("/profile");
    await fillProfileForm(page, {
      entryYear: 1404,
      major: "Computer Engineering",
      orientation: "Unified",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/will reset your existing academic/)).toBeVisible();

    await page.getByRole("button", { name: "Yes, reset and continue" }).click();
    await expect(page.getByText("Profile saved.")).toBeVisible();

    expect(await countStudentCourses(profileBefore.id)).toBe(0);

    const profileAfter = await getStudentProfileByUserId(userId);
    const unified = await getCurriculumByName("Computer Engineering — Unified");
    expect(profileAfter.curriculum_id).toBe(unified.id);
  });
});

test.describe("access control", () => {
  test("unauthenticated visitors are redirected away from profile setup and edit", async ({
    page,
  }) => {
    await page.goto("/profile/setup");
    await expect(page).toHaveURL("/login");

    await page.goto("/profile");
    await expect(page).toHaveURL("/login");
  });

  test("an admin account is redirected away from student profile pages", async ({ page }) => {
    const admin = await seedAdmin("SUPPORT");
    await page.goto("/admin/login");
    await page.getByLabel("Student number or phone number").fill(admin.studentNumber);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/admin");

    await page.goto("/profile/setup");
    await expect(page).toHaveURL("/admin");
  });

  test("one student cannot see or modify another student's profile", async ({ page }) => {
    // Student A creates a profile.
    const { studentNumber: studentA } = await registerStudent(page);
    await fillProfileForm(page, {
      entryYear: 1401,
      major: "Computer Engineering",
      orientation: "Software Engineering",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await completeAcademicSetup(page);

    const userA = await getUserByStudentNumber(studentA);
    const profileABefore = await getStudentProfileByUserId(userA.id);

    // Log out, then register/onboard a completely separate Student B in the
    // same browser context and change B's profile to a different curriculum.
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");

    await registerStudent(page);
    await fillProfileForm(page, {
      entryYear: 1404,
      major: "Computer Engineering",
      orientation: "Unified",
      studyType: "Full-time",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await completeAcademicSetup(page);

    // Student A's profile must be completely unaffected by Student B's action.
    const profileAAfter = await getStudentProfileByUserId(userA.id);
    expect(profileAAfter.curriculum_id).toBe(profileABefore.curriculum_id);
    expect(profileAAfter.entry_year).toBe(profileABefore.entry_year);
    expect(profileAAfter.orientation).toBe(profileABefore.orientation);
  });
});
