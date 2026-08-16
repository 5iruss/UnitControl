import { test, expect, type Page } from "@playwright/test";
import {
  uniqueId,
  seedAdmin,
  seedStudent,
  getCourseInCurriculum,
  getAnotherCourseInCurriculum,
  getAllCourseRelationships,
  deleteCourseRelationship,
  deleteCurriculum,
  deleteCourse,
} from "./db-helper";

const UNIFIED_CURRICULUM_NAME = "Computer Engineering — Unified";

async function loginAsAdmin(
  page: Page,
  credentials: { studentNumber: string; password: string },
): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Student number or phone number").fill(credentials.studentNumber);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/admin");
}

async function selectOption(page: Page, triggerLabel: string, optionText: string) {
  await page.getByLabel(triggerLabel, { exact: true }).click();
  // Not exact: several admin dropdowns render "name (code)" while callers
  // pass just the name (course pickers) — unlike the student status dropdown
  // (student specs' selectOption), the Admin Panel never renders the
  // گذرانده/گذرانده نشده pair that motivated exact matching there.
  await page.getByRole("option", { name: optionText }).click();
}

function randomPhoneNumber(): string {
  return `09${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("")}`;
}

// docs Phase 10 pre-coding report — the Admin Panel deliberately has no
// curriculum/course delete action (archive only). Tests that create
// throwaway curricula/courses clean them up directly via db-helper so they
// don't accumulate and trip curriculum-data.spec.ts's live-data integrity
// check (e.g. UNBOUNDED_CURRICULUM_ENTRY_YEARS for a test curriculum with no
// entry-year bounds filled in).
function idFromUrl(url: string): string {
  return new URL(url).pathname.split("/").filter(Boolean).pop()!;
}

test.describe("role-based access", () => {
  test("unauthenticated visitors are redirected to /admin/login from every protected area", async ({
    page,
  }) => {
    for (const path of ["/admin", "/admin/curricula", "/admin/courses", "/admin/students", "/admin/admins", "/admin/audit-log"]) {
      await page.goto(path);
      await expect(page).toHaveURL("/admin/login");
    }
  });

  test("support cannot access curriculum or course management", async ({ page }) => {
    const support = await seedAdmin("SUPPORT");
    await loginAsAdmin(page, support);

    await page.goto("/admin/curricula");
    await expect(page).toHaveURL("/admin");

    await page.goto("/admin/courses");
    await expect(page).toHaveURL("/admin");
  });

  test("support does not see curricula/courses/admins links in the nav", async ({ page }) => {
    const support = await seedAdmin("SUPPORT");
    await loginAsAdmin(page, support);

    await expect(page.getByRole("link", { name: "Curricula" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Courses", exact: true })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Administrators" })).not.toBeVisible();
  });

  test("academic group manager can access curriculum and course management, but not admin management", async ({
    page,
  }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    await page.goto("/admin/curricula");
    await expect(page).toHaveURL("/admin/curricula");

    await page.goto("/admin/courses");
    await expect(page).toHaveURL("/admin/courses");

    await page.goto("/admin/admins");
    await expect(page).toHaveURL("/admin");
  });

  test("academic group manager cannot create an administrator via the server action", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    await page.goto("/admin/admins/new");
    await expect(page).toHaveURL("/admin");
  });

  test("super admin can access every management area", async ({ page }) => {
    const superAdmin = await seedAdmin("SUPER_ADMIN");
    await loginAsAdmin(page, superAdmin);

    for (const path of ["/admin/curricula", "/admin/courses", "/admin/students", "/admin/admins", "/admin/audit-log"]) {
      await page.goto(path);
      await expect(page).toHaveURL(path);
    }
  });

  test("a student cannot reach the admin area at all", async ({ page }) => {
    const { studentNumber, password } = await seedStudent();
    await page.goto("/login");
    await page.getByLabel("شماره دانشجویی یا شماره تلفن").fill(studentNumber);
    await page.getByLabel("رمز عبور").fill(password);
    await page.getByRole("button", { name: "ورود" }).click();

    await page.goto("/admin/curricula");
    await expect(page).toHaveURL("/admin/login");
  });
});

test.describe("curriculum management", () => {
  test("academic group manager creates a curriculum and it is audit-logged", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const name = uniqueId("e2e-curriculum");
    await page.goto("/admin/curricula/new");
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByRole("button", { name: "Create curriculum" }).click();

    await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    const curriculumId = idFromUrl(page.url());

    try {
      await page.goto("/admin/audit-log");
      const auditRow = page.locator("tr", { hasText: name });
      await expect(auditRow).toBeVisible();
      await expect(auditRow.getByText("CURRICULUM_CREATED")).toBeVisible();
    } finally {
      await deleteCurriculum(curriculumId);
    }
  });

  test("rejects a duplicate curriculum name", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const name = uniqueId("e2e-dup-curriculum");
    await page.goto("/admin/curricula/new");
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByRole("button", { name: "Create curriculum" }).click();
    await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+$/);
    const curriculumId = idFromUrl(page.url());

    try {
      await page.goto("/admin/curricula/new");
      await page.getByLabel("Name").fill(name);
      await page.getByLabel("Major").fill("Computer Engineering");
      await page.getByLabel("Orientation").fill("Test Orientation");
      await page.getByRole("button", { name: "Create curriculum" }).click();

      await expect(page.getByText("A curriculum with this name already exists.")).toBeVisible();
    } finally {
      await deleteCurriculum(curriculumId);
    }
  });

  test("rejects an entry-year range where from is after to", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    await page.goto("/admin/curricula/new");
    await page.getByLabel("Name").fill(uniqueId("e2e-badyear"));
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByLabel("Entry year from").fill("1405");
    await page.getByLabel("Entry year to").fill("1400");
    await page.getByRole("button", { name: "Create curriculum" }).click();

    await expect(page.getByText("Entry year from must not be after entry year to.")).toBeVisible();
  });

  test("archives a curriculum via status update", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    await page.goto("/admin/curricula/new");
    await page.getByLabel("Name").fill(uniqueId("e2e-archive-curriculum"));
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByRole("button", { name: "Create curriculum" }).click();
    await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+$/);
    const curriculumId = idFromUrl(page.url());

    try {
      await selectOption(page, "Status", "Archived");
      await page.getByRole("button", { name: "Save changes" }).click();

      // Scoped to the header row (h1 + status badge): the edit form's own
      // Status select also displays "Archived" as its current value, so an
      // unscoped getByText would match both.
      const headerRow = page.locator("h1").locator("..");
      await expect(headerRow.getByText("Archived", { exact: true })).toBeVisible();
    } finally {
      await deleteCurriculum(curriculumId);
    }
  });

  test("adds and removes a course from a curriculum without erroring", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const courseCode = uniqueId("course-e2e-course");
    const courseName = uniqueId("Test Membership Course");
    await page.goto("/admin/courses/new");
    await page.getByLabel("Course code").fill(courseCode);
    await page.getByLabel("Name").fill(courseName);
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/(?!new)[a-z0-9]+$/);
    const courseId = idFromUrl(page.url());

    await page.goto("/admin/curricula/new");
    const curriculumName = uniqueId("e2e-membership-curriculum");
    await page.getByLabel("Name").fill(curriculumName);
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByRole("button", { name: "Create curriculum" }).click();
    await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+$/);
    const curriculumId = idFromUrl(page.url());

    try {
      await selectOption(page, "Course", courseName);
      await page.getByRole("button", { name: "Add to curriculum" }).click();
      await expect(page.locator("li", { hasText: courseName })).toBeVisible();

      await page.getByRole("button", { name: "Remove" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await expect(page.getByText("No courses linked yet.")).toBeVisible();
    } finally {
      await deleteCurriculum(curriculumId);
      await deleteCourse(courseId);
    }
  });
});

test.describe("course management", () => {
  test("creates a course without inventing credits or practical classification", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const courseCode = uniqueId("course-e2e-newcourse");
    await page.goto("/admin/courses/new");
    await page.getByLabel("Course code").fill(courseCode);
    await page.getByLabel("Name").fill("Unverified Data Course");
    await page.getByRole("button", { name: "Create course" }).click();

    await expect(page).toHaveURL(/\/admin\/courses\/(?!new)[a-z0-9]+$/);
    await expect(page.getByLabel("Credits (leave blank if unverified)")).toHaveValue("");
    await deleteCourse(idFromUrl(page.url()));
  });

  test("archives a course and it is no longer offered as active", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const courseCode = uniqueId("course-e2e-archivecourse");
    await page.goto("/admin/courses/new");
    await page.getByLabel("Course code").fill(courseCode);
    await page.getByLabel("Name").fill("Archivable Course");
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/(?!new)[a-z0-9]+$/);
    const courseId = idFromUrl(page.url());

    await selectOption(page, "Status", "Archived");
    await page.getByRole("button", { name: "Save changes" }).click();
    // Scoped to the header row: the edit form's own Status select also
    // displays "Archived" as its current value.
    const headerRow = page.locator("h1").locator("..");
    await expect(headerRow.getByText("Archived", { exact: true })).toBeVisible();
    await deleteCourse(courseId);
  });

  test("search filters the course list by name", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const uniqueName = uniqueId("SearchableCourseName");
    await page.goto("/admin/courses/new");
    await page.getByLabel("Course code").fill(uniqueId("course-e2e-searchcourse"));
    await page.getByLabel("Name").fill(uniqueName);
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/(?!new)[a-z0-9]+$/);
    const courseId = idFromUrl(page.url());

    await page.goto(`/admin/courses?q=${encodeURIComponent(uniqueName)}`);
    await expect(page.getByText(uniqueName)).toBeVisible();
    await expect(page.getByText("1 course", { exact: true })).toBeVisible();
    await deleteCourse(courseId);
  });
});

test.describe("course relationships", () => {
  test("creates a relationship, rejects self-reference and duplicates, then deletes it", async ({
    page,
  }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const codeA = uniqueId("course-e2e-rel-a");
    const codeB = uniqueId("course-e2e-rel-b");
    const nameA = uniqueId("Relationship Course A");
    const nameB = uniqueId("Relationship Course B");
    await page.goto("/admin/courses/new");
    await page.getByLabel("Course code").fill(codeA);
    await page.getByLabel("Name").fill(nameA);
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/(?!new)[a-z0-9]+$/);
    const courseAUrl = page.url();

    await page.goto("/admin/courses/new");
    await page.getByLabel("Course code").fill(codeB);
    await page.getByLabel("Name").fill(nameB);
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/(?!new)[a-z0-9]+$/);
    const courseBUrl = page.url();

    try {
      // Self-reference: same course selected as "other" on its own page is
      // not offered (excluded from the picker), so this is proven at the
      // domain layer (src/domain/admin/relationship-validation.test.ts)
      // rather than re-tested here through an unreachable UI path.

      // Create A -> requires B as prerequisite (A is target, B is source).
      await page.goto(courseAUrl);
      await selectOption(page, "Direction", "This course requires (as)");
      await selectOption(page, "Relationship type", "Prerequisite");
      await selectOption(page, "Other course", nameB);
      await page.getByRole("button", { name: "Add relationship" }).click();

      await expect(page.getByText(`Requires ${nameB} as prerequisite`)).toBeVisible();

      // Duplicate rejected.
      await selectOption(page, "Direction", "This course requires (as)");
      await selectOption(page, "Relationship type", "Prerequisite");
      await selectOption(page, "Other course", nameB);
      await page.getByRole("button", { name: "Add relationship" }).click();
      await expect(page.getByText("This relationship already exists.")).toBeVisible();

      // Delete it.
      await page.getByRole("button", { name: "Remove" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await expect(page.getByText("No relationships recorded for this course.")).toBeVisible();
    } finally {
      await deleteCourse(idFromUrl(courseAUrl));
      await deleteCourse(idFromUrl(courseBUrl));
    }
  });

  test("a relationship created via the admin UI is consumed by the student-facing Rules Engine", async ({
    page,
  }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    const courseA = await getCourseInCurriculum(UNIFIED_CURRICULUM_NAME);
    const courseB = await getAnotherCourseInCurriculum(UNIFIED_CURRICULUM_NAME, courseA.id);

    // Self-heal against a leftover relationship from a previously
    // interrupted run of this same test (this pair is reused deterministically
    // across several spec files' tests, matching existing convention).
    const preexisting = (await getAllCourseRelationships()).filter(
      (r) => r.source_course_id === courseA.id && r.target_course_id === courseB.id,
    );
    for (const stray of preexisting) await deleteCourseRelationship(stray.id);

    await loginAsAdmin(page, manager);
    await page.goto(`/admin/courses/${courseB.id}`);
    await selectOption(page, "Direction", "This course requires (as)");
    await selectOption(page, "Relationship type", "Prerequisite");
    await selectOption(page, "Other course", courseA.name);
    await page.getByRole("button", { name: "Add relationship" }).click();
    await expect(page.getByText(`Requires ${courseA.name} as prerequisite`)).toBeVisible();

    const relationshipsAfter = await getAllCourseRelationships();
    const created = relationshipsAfter.find(
      (r) => r.source_course_id === courseA.id && r.target_course_id === courseB.id,
    );
    expect(created).toBeTruthy();

    try {
      // Log out of the admin session and register a fresh student in the
      // same curriculum — their eligibility for courseB should now reflect
      // the newly created PREREQUISITE (docs/04_Academic_Rules_Engine.md §3:
      // courseA has never been attempted -> courseB is BLOCKED).
      await page.getByRole("button", { name: "Log out" }).click();
      await expect(page).toHaveURL("/admin/login");

      const studentNumber = uniqueId("e2e-relconsume");
      await page.goto("/register");
      await page.getByLabel("شماره دانشجویی").fill(studentNumber);
      await page.getByLabel("رمز عبور").fill("CorrectPass123!");
      await page.getByLabel("نام", { exact: true }).fill("Sara");
      await page.getByLabel("نام خانوادگی").fill("Ahmadi");
      await page.getByLabel("شماره تلفن").fill(randomPhoneNumber());
      await page.getByRole("button", { name: "ساخت حساب" }).click();
      await expect(page).toHaveURL("/profile/setup");

      await page.getByLabel("سال ورود").fill("1404");
      await selectOption(page, "رشته", "Computer Engineering");
      await selectOption(page, "گرایش", "Unified");
      await selectOption(page, "نوع تحصیل", "تمام‌وقت");
      await page.getByRole("button", { name: "ادامه" }).click();
      await expect(page).toHaveURL("/academic-setup");

      await page.getByRole("link", { name: "شروع حالت ساده" }).click();
      await expect(page).toHaveURL("/academic-status");
      await page.getByRole("button", { name: "ادامه به داشبورد" }).click();
      await expect(page).toHaveURL("/dashboard");

      const courseBButton = page.getByRole("button", {
        name: new RegExp(`^${courseB.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      });
      // "Blocked" is conveyed via the node's accessible name/icon/border, not
      // visible text (docs/03_UX_UI_Specification.md §10 — student status
      // and Rules Engine availability are both shown, but availability isn't
      // rendered as a plain-text label on the card itself).
      await expect(courseBButton).toHaveAccessibleName(/غیرقابل انتخاب/);
    } finally {
      // Cleanup via direct deletion (not the UI) so it's reliable regardless
      // of what state the browser session ended up in, and doesn't leak into
      // other tests relying on the real dataset's documented 0-relationship
      // baseline.
      if (created) await deleteCourseRelationship(created.id);
    }
  });
});

test.describe("course groups", () => {
  test("creates a group, manages membership, and blocks deletion while referenced by a requirement", async ({
    page,
  }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    const courseCode = uniqueId("course-e2e-groupcourse");
    const courseName = uniqueId("Group Member Course");
    await page.goto("/admin/courses/new");
    await page.getByLabel("Course code").fill(courseCode);
    await page.getByLabel("Name").fill(courseName);
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/(?!new)[a-z0-9]+$/);
    const courseId = idFromUrl(page.url());

    await page.goto("/admin/curricula/new");
    const curriculumName = uniqueId("e2e-group-curriculum");
    await page.getByLabel("Name").fill(curriculumName);
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByRole("button", { name: "Create curriculum" }).click();
    await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+$/);
    const curriculumUrl = page.url();
    const curriculumId = idFromUrl(curriculumUrl);

    try {
      const groupName = uniqueId("Test Elective Group");
      await page.locator("#groupName").fill(groupName);
      await page.locator("#groupType").fill("ELECTIVE");
      await page.getByRole("button", { name: "Create group" }).click();
      await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+\/groups\/[a-z0-9]+$/);

      await selectOption(page, "Course", courseName);
      await page.getByRole("button", { name: "Add to group" }).click();
      await expect(page.locator("li", { hasText: courseName })).toBeVisible();

      // Reference this group from a requirement, then confirm the group
      // cannot be deleted while referenced.
      await page.goto(curriculumUrl);
      await selectOption(page, "Type", "Course group");
      await page.locator("#reqName").fill("Elective Requirement");
      await selectOption(page, "Course group", groupName);
      await page.getByRole("button", { name: "Add requirement" }).click();
      await expect(page.getByText("Elective Requirement")).toBeVisible();

      await page.getByRole("link", { name: groupName }).click();
      await expect(page).toHaveURL(/\/groups\/[a-z0-9]+$/);
      await page.getByRole("button", { name: "Delete group" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await expect(page.getByText("This group is used by a curriculum requirement")).toBeVisible();

      // Remove the requirement, then deletion succeeds.
      await page.goto(curriculumUrl);
      await page.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await expect(page.getByText("No requirements yet.")).toBeVisible();

      await page.getByRole("link", { name: groupName }).click();
      await page.getByRole("button", { name: "Delete group" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await expect(page).toHaveURL(curriculumUrl);
      await expect(page.getByText("No course groups yet.")).toBeVisible();
    } finally {
      await deleteCurriculum(curriculumId);
      await deleteCourse(courseId);
    }
  });
});

test.describe("curriculum requirements", () => {
  test("creates and deletes a CATEGORY_UNITS requirement", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    await loginAsAdmin(page, manager);

    await page.goto("/admin/curricula/new");
    const curriculumName = uniqueId("e2e-req-curriculum");
    await page.getByLabel("Name").fill(curriculumName);
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByRole("button", { name: "Create curriculum" }).click();
    await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+$/);
    const curriculumId = idFromUrl(page.url());

    try {
      await selectOption(page, "Type", "Category units");
      await page.locator("#reqName").fill("Basic Units Requirement");
      await selectOption(page, "Applies to category", "اصلی");
      await page.locator("#reqUnits").fill("20");
      await page.getByRole("button", { name: "Add requirement" }).click();

      await expect(page.getByText("Basic Units Requirement")).toBeVisible();
      await expect(page.getByText("20 units")).toBeVisible();

      await page.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await expect(page.getByText("No requirements yet.")).toBeVisible();
    } finally {
      await deleteCurriculum(curriculumId);
    }
  });
});

test.describe("student search and support", () => {
  test("support can search students and view (but never mutate) the academic profile", async ({
    page,
  }) => {
    const support = await seedAdmin("SUPPORT");
    const student = await seedStudent();
    await loginAsAdmin(page, support);

    await page.goto(`/admin/students?q=${encodeURIComponent(student.studentNumber)}`);
    await expect(page.getByText(student.studentNumber)).toBeVisible();

    await page.getByRole("link", { name: "Test Student" }).click();
    await expect(page).toHaveURL(/\/admin\/students\/[a-z0-9-]+$/);
    await expect(page.getByText(student.studentNumber)).toBeVisible();
    await expect(page.getByText("Profile not yet configured.")).toBeVisible();
    await expect(page.getByText("Reset this student's password")).toBeVisible();

    // Never exposes the password hash.
    await expect(page.getByText(/passwordHash|password_hash/i)).toHaveCount(0);
  });

  test("academic group manager can search students but is not offered password reset", async ({
    page,
  }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    const student = await seedStudent();
    await loginAsAdmin(page, manager);

    await page.goto(`/admin/students/${student.id}`);
    await expect(page.getByText("Reset this student's password")).not.toBeVisible();
  });
});

test.describe("administrators", () => {
  test("super admin creates a new administrator and it is audit-logged", async ({ page }) => {
    const superAdmin = await seedAdmin("SUPER_ADMIN");
    await loginAsAdmin(page, superAdmin);

    const identifier = uniqueId("e2e-newadmin");
    await page.goto("/admin/admins/new");
    await page.getByLabel("Identifier (login number)").fill(identifier);
    await page.getByLabel("First name").fill("New");
    await page.getByLabel("Last name").fill("Admin");
    await page.getByLabel("Password").fill("AdminPass123!");
    await selectOption(page, "Role", "Support");
    await page.getByRole("button", { name: "Create administrator" }).click();

    await expect(page).toHaveURL("/admin/admins");
    await expect(page.getByText(identifier)).toBeVisible();

    await page.goto("/admin/audit-log");
    const auditRow = page.locator("tr", { hasText: identifier });
    await expect(auditRow).toBeVisible();
    await expect(auditRow.getByText("ADMIN_CREATED")).toBeVisible();
  });

  test("rejects a duplicate administrator identifier", async ({ page }) => {
    const superAdmin = await seedAdmin("SUPER_ADMIN");
    const existing = await seedAdmin("SUPPORT");
    await loginAsAdmin(page, superAdmin);

    await page.goto("/admin/admins/new");
    await page.getByLabel("Identifier (login number)").fill(existing.studentNumber);
    await page.getByLabel("First name").fill("Dup");
    await page.getByLabel("Last name").fill("Licate");
    await page.getByLabel("Password").fill("AdminPass123!");
    await page.getByRole("button", { name: "Create administrator" }).click();

    await expect(page.getByText("An account with this identifier already exists.")).toBeVisible();
  });
});

test.describe("audit log visibility", () => {
  test("support only sees password-reset activity, not academic-data changes", async ({ page }) => {
    const manager = await seedAdmin("ACADEMIC_GROUP_MANAGER");
    const support = await seedAdmin("SUPPORT");
    const student = await seedStudent();

    // Manager performs a curriculum action.
    await loginAsAdmin(page, manager);
    await page.goto("/admin/curricula/new");
    const curriculumName = uniqueId("e2e-audit-scope-curriculum");
    await page.getByLabel("Name").fill(curriculumName);
    await page.getByLabel("Major").fill("Computer Engineering");
    await page.getByLabel("Orientation").fill("Test Orientation");
    await page.getByRole("button", { name: "Create curriculum" }).click();
    await expect(page).toHaveURL(/\/admin\/curricula\/(?!new)[a-z0-9]+$/);
    const curriculumId = idFromUrl(page.url());
    await page.getByRole("button", { name: "Log out" }).click();

    try {
      // Support performs a password reset.
      await loginAsAdmin(page, support);
      await page.goto("/admin/support/reset-password");
      await page.getByLabel("Student number or phone number").fill(student.studentNumber);
      await page.getByLabel("New password").fill("AnotherPass123!");
      await page.getByRole("button", { name: "Reset password" }).click();
      await expect(page.getByText(/Password reset for/)).toBeVisible();

      await page.goto("/admin/audit-log");
      const passwordResetRow = page.locator("tr", { hasText: student.studentNumber });
      await expect(passwordResetRow).toBeVisible();
      await expect(passwordResetRow.getByText("PASSWORD_RESET")).toBeVisible();
      await expect(page.getByText("CURRICULUM_CREATED")).toHaveCount(0);
    } finally {
      await deleteCurriculum(curriculumId);
    }
  });
});
