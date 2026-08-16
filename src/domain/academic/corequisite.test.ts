import { describe, expect, it } from "vitest";
import { evaluateCorequisite } from "./corequisite";

describe("evaluateCorequisite", () => {
  it("reports no relationship when none is supplied (the current dataset state — 0 corequisite rows)", () => {
    const result = evaluateCorequisite([]);
    expect(result.hasRelationship).toBe(false);
    expect(result.warning).toBeUndefined();
  });

  it("reports a relationship exists with an unverified-enforcement warning, never blocking, when one is supplied", () => {
    const result = evaluateCorequisite([
      { sourceCourseId: "course-a", targetCourseId: "course-b", relationshipType: "COREQUISITE" },
    ]);
    expect(result.hasRelationship).toBe(true);
    expect(result.warning).toContain("تأیید نشده");
  });
});
