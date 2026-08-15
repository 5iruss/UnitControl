import { test, expect } from "@playwright/test";

// Phase 11 hardening — /api/health is unauthenticated (used by deploy/uptime
// tooling), so it must report DB reachability without leaking business data
// (it used to return a raw user count to any caller).
test.describe("health check", () => {
  test("reports ok and never returns a user count", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
    expect(body).not.toHaveProperty("userCount");
  });
});
