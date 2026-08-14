import { test, expect } from "@playwright/test";
import { uniqueId, seedAdmin, seedStudent, findAuditLog } from "./db-helper";

function randomPhoneNumber(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `09${digits}`;
}

test.describe("student registration and login", () => {
  test("register, land on dashboard, then log out", async ({ page }) => {
    const studentNumber = uniqueId("e2e-reg");

    await page.goto("/register");
    await page.getByLabel("Student number").fill(studentNumber);
    await page.getByLabel("Password").fill("CorrectPass123!");
    await page.getByLabel("First name").fill("Sara");
    await page.getByLabel("Last name").fill("Ahmadi");
    await page.getByLabel("Phone number").fill(randomPhoneNumber());
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome, Sara Ahmadi.")).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/login");
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

  test("login succeeds with correct credentials", async ({ page }) => {
    const { studentNumber, password } = await seedStudent();

    await page.goto("/login");
    await page.getByLabel("Student number or phone number").fill(studentNumber);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/dashboard");
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
    await expect(page.getByText("SUPPORT")).toBeVisible();
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
    await expect(page).toHaveURL("/dashboard");
  });

  test("support cannot access the reset-password tool without authenticating", async ({
    page,
  }) => {
    await page.goto("/admin/support/reset-password");
    await expect(page).toHaveURL("/admin/login");
  });
});
