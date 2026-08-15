import { test, expect } from "@playwright/test";
import { uniqueId, seedAdmin, seedStudent, findAuditLog } from "./db-helper";

function randomPhoneNumber(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `09${digits}`;
}

test.describe("student registration and login", () => {
  // docs/02_User_Flow.md §2 — Registration -> Academic Profile next (not the
  // dashboard directly). The full registration -> profile -> dashboard ->
  // logout journey is covered in academic-profile.spec.ts.
  test("register creates a session and lands on academic profile setup", async ({ page }) => {
    const studentNumber = uniqueId("e2e-reg");

    await page.goto("/register");
    await page.getByLabel("Student number").fill(studentNumber);
    await page.getByLabel("Password").fill("CorrectPass123!");
    await page.getByLabel("First name").fill("Sara");
    await page.getByLabel("Last name").fill("Ahmadi");
    await page.getByLabel("Phone number").fill(randomPhoneNumber());
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL("/profile/setup");
  });

  test("registering with an existing student number shows an error", async ({ page }) => {
    const { studentNumber } = await seedStudent();

    await page.goto("/register");
    await page.getByLabel("Student number").fill(studentNumber);
    await page.getByLabel("Password").fill("CorrectPass123!");
    await page.getByLabel("First name").fill("Dup");
    await page.getByLabel("Last name").fill("Licate");
    await page.getByLabel("Phone number").fill(randomPhoneNumber());
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByText("An account with this student number already exists."),
    ).toBeVisible();
    await expect(page).toHaveURL("/register");
  });

  test("login rejects an incorrect password", async ({ page }) => {
    const { studentNumber } = await seedStudent();

    await page.goto("/login");
    await page.getByLabel("Student number or phone number").fill(studentNumber);
    await page.getByLabel("Password").fill("WrongPassword!");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Incorrect credentials.")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("login with an unknown identifier shows the same generic error as a wrong password", async ({
    page,
  }) => {
    // Phase 11 hardening — the not-found and wrong-password paths must be
    // indistinguishable to the client (same message; the timing side-channel
    // fix that makes both paths run bcrypt is not observable here, but this
    // guards the functional behavior the fix touches).
    await page.goto("/login");
    await page.getByLabel("Student number or phone number").fill(uniqueId("no-such-student"));
    await page.getByLabel("Password").fill("WhateverPassword123!");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Incorrect credentials.")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("login succeeds with correct credentials", async ({ page }) => {
    const { studentNumber, password } = await seedStudent();

    await page.goto("/login");
    await page.getByLabel("Student number or phone number").fill(studentNumber);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    // A seeded student has no academic profile yet, so the dashboard guard
    // (docs/02_User_Flow.md §2) routes them to profile setup first.
    await expect(page).toHaveURL("/profile/setup");
  });

  test("a student account cannot use the administrative login", async ({ page }) => {
    const { studentNumber, password } = await seedStudent();

    await page.goto("/admin/login");
    await page.getByLabel("Student number or phone number").fill(studentNumber);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(
      page.getByText("This account does not have administrative access."),
    ).toBeVisible();
    await expect(page).toHaveURL("/admin/login");
  });

  test("unauthenticated visitors are redirected away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });
});

test.describe("admin / support authentication", () => {
  test("support can log in via the administrative login", async ({ page }) => {
    const { studentNumber, password } = await seedAdmin("SUPPORT");

    await page.goto("/admin/login");
    await page.getByLabel("Student number or phone number").fill(studentNumber);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/admin");
    // docs Phase 10 prompt — the Admin Panel's nav header shows a
    // human-readable role label, not the raw enum value. Scoped to the
    // header itself since the dashboard's recent-activity list can also
    // contain other "Support" text from prior audit-log entries.
    await expect(page.locator("header").getByText("Support", { exact: false })).toBeVisible();
  });

  test("unauthenticated visitors are redirected away from the admin area", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin/login");
  });

  test("support resets a student's password, and the action is audit-logged", async ({
    page,
  }) => {
    const support = await seedAdmin("SUPPORT");
    const student = await seedStudent();
    const newPassword = "BrandNewPass123!";

    await page.goto("/admin/login");
    await page.getByLabel("Student number or phone number").fill(support.studentNumber);
    await page.getByLabel("Password").fill(support.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/admin");

    await page.getByRole("link", { name: "Reset a student's password" }).click();
    await expect(page).toHaveURL("/admin/support/reset-password");

    await page.getByLabel("Student number or phone number").fill(student.studentNumber);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page.getByText(/Password reset for Test Student\./)).toBeVisible();

    const auditEntry = await findAuditLog(student.studentNumber, "PASSWORD_RESET", support.id);
    expect(auditEntry).not.toBeNull();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/admin/login");

    await page.goto("/login");
    await page.getByLabel("Student number or phone number").fill(student.studentNumber);
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: "Log in" }).click();
    // A seeded student has no academic profile yet, so the dashboard guard
    // (docs/02_User_Flow.md §2) routes them to profile setup first.
    await expect(page).toHaveURL("/profile/setup");
  });

  test("support cannot access the reset-password tool without authenticating", async ({
    page,
  }) => {
    await page.goto("/admin/support/reset-password");
    await expect(page).toHaveURL("/admin/login");
  });

  // Phase 11 hardening — a password reset must invalidate any session issued
  // before it, otherwise a token an attacker already holds keeps working
  // after the reset (the documented reason support resets a password in the
  // first place, docs/08_Admin_Panel.md §11).
  test("resetting a student's password invalidates their existing session", async ({
    page,
    browser,
  }) => {
    const student = await seedStudent();

    // The student logs in first, establishing a session cookie in `page`.
    await page.goto("/login");
    await page.getByLabel("Student number or phone number").fill(student.studentNumber);
    await page.getByLabel("Password").fill(student.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/profile/setup");

    // Support resets the password from a separate browser context (a
    // separate cookie jar), simulating a different real-world session.
    const support = await seedAdmin("SUPPORT");
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/admin/login");
    await adminPage.getByLabel("Student number or phone number").fill(support.studentNumber);
    await adminPage.getByLabel("Password").fill(support.password);
    await adminPage.getByRole("button", { name: "Log in" }).click();
    await expect(adminPage).toHaveURL("/admin");
    await adminPage.getByRole("link", { name: "Reset a student's password" }).click();
    await adminPage.getByLabel("Student number or phone number").fill(student.studentNumber);
    await adminPage.getByLabel("New password").fill("PostResetPass123!");
    await adminPage.getByRole("button", { name: "Reset password" }).click();
    await expect(adminPage.getByText(/Password reset for Test Student\./)).toBeVisible();
    await adminContext.close();

    // The student's original session cookie (issued before the reset) must
    // no longer be accepted.
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });
});
