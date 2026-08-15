import { test, expect, type Page } from "@playwright/test";
import {
  uniqueId,
  getCourseInCurriculum,
  getAnotherCourseInCurriculum,
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
  const studentNumber = uniqueId("e2e-rec");
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapCourseButton(page: Page, course: { name: string; course_code: string }) {
  return page.getByRole("button", {
    name: new RegExp(`^${escapeRegExp(course.name)} \\(${escapeRegExp(course.course_code)}\\)`),
  });
}

function recommendationsCard(page: Page) {
  return page.getByText("Recommended courses", { exact: true }).locator("..").locator("..");
}

function warningsCard(page: Page) {
  return page.getByText("Academic warnings", { exact: true }).locator("..").locator("..");
}

function recommendedCourseItem(page: Page, courseName: string) {
  return recommendationsCard(page).locator("li", { hasText: courseName });
}

function warningItem(page: Page, courseName: string) {
  return warningsCard(page).locator("li", { hasText: courseName });
}

test.describe("recommendations", () => {
  test("shows an eligible, not-yet-completed course as a recommendation", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await expect(recommendedCourseItem(page, course.name)).toBeVisible();
    await expect(
      recommendedCourseItem(page, course.name).getByText(
        "No prerequisite or corequisite restriction currently blocks this course.",
      ),
    ).toBeVisible();
  });

  test("excludes an already-passed course from recommendations", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await mapCourseButton(page, course).click();
    await selectOption(page, "Status", "Passed");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(recommendedCourseItem(page, course.name)).toHaveCount(0);
  });

  test("excludes a blocked course from recommendations (unmet prerequisite)", async ({ page }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    const relationship = await seedCourseRelationship(courseA.id, courseB.id, "PREREQUISITE");

    try {
      await registerAndReachDashboard(page);
      await expect(recommendedCourseItem(page, courseB.name)).toHaveCount(0);
    } finally {
      await deleteCourseRelationship(relationship.id);
    }
  });

  test("shows a data-limitation notice about unverified prerequisite/corequisite coverage", async ({
    page,
  }) => {
    await registerAndReachDashboard(page);
    await expect(
      page.getByText("Prerequisite and corequisite validation currently has no verified relationships"),
    ).toBeVisible();
  });
});

test.describe("academic warnings", () => {
  test("shows no academic warnings for a fresh student", async ({ page }) => {
    await registerAndReachDashboard(page);
    await expect(page.getByText("No academic warnings right now.")).toBeVisible();
  });

  test("surfaces a FAILED_COURSE_RISK warning for a failed course", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await mapCourseButton(page, course).click();
    await selectOption(page, "Status", "Failed");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(warningItem(page, course.name)).toBeVisible();
    await expect(warningItem(page, course.name).getByText("Suggested action: Retake the course")).toBeVisible();
  });

  test("does not block a failed course — it remains a recommendation candidate", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await mapCourseButton(page, course).click();
    await selectOption(page, "Status", "Failed");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(recommendedCourseItem(page, course.name)).toBeVisible();
  });

  test("surfaces an alert for a planned course whose eligibility drifted to blocked after planning", async ({
    page,
  }) => {
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);
    await registerAndReachDashboard(page);

    // Plan courseB while it is still AVAILABLE (no relationship yet).
    await addToPlan(page, courseB.name, "4051");
    await expect(page.getByRole("heading", { name: "Mehr 1405" })).toBeVisible();

    // Now retroactively make courseA a prerequisite of courseB. courseB was
    // already planned; its eligibility should now re-evaluate to BLOCKED.
    const relationship = await seedCourseRelationship(courseA.id, courseB.id, "PREREQUISITE");
    try {
      await page.reload();
      await expect(warningItem(page, courseB.name)).toBeVisible();
      await expect(
        warningItem(page, courseB.name).getByText("Prerequisite has not been previously attempted."),
      ).toBeVisible();

      // Still planned — the alert does not remove it from the plan.
      await expect(page.getByRole("heading", { name: "Mehr 1405" })).toBeVisible();
    } finally {
      await deleteCourseRelationship(relationship.id);
    }
  });
});

test.describe("security", () => {
  test("one student's academic warnings are isolated from another student's", async ({ page }) => {
    const course = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    await registerAndReachDashboard(page);

    await mapCourseButton(page, course).click();
    await selectOption(page, "Status", "Failed");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(warningItem(page, course.name)).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");

    await registerAndReachDashboard(page);
    await expect(page.getByText("No academic warnings right now.")).toBeVisible();
  });
});
