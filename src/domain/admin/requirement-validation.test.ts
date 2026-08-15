import { describe, expect, it } from "vitest";
import { validateCurriculumRequirementInput } from "./requirement-validation";
import type { CurriculumRequirementInput } from "./types";

function input(overrides: Partial<CurriculumRequirementInput>): CurriculumRequirementInput {
  return {
    requirementType: "TOTAL_UNITS",
    category: null,
    requiredUnits: 140,
    minimumPracticalUnits: null,
    courseGroupId: null,
    ...overrides,
  };
}

describe("validateCurriculumRequirementInput", () => {
  it("accepts a valid TOTAL_UNITS requirement", () => {
    expect(validateCurriculumRequirementInput(input({}))).toEqual({ valid: true });
  });

  it("accepts a valid CATEGORY_UNITS requirement", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "CATEGORY_UNITS", category: "BASIC", requiredUnits: 20 }),
    );
    expect(result).toEqual({ valid: true });
  });

  it("rejects CATEGORY_UNITS without a category", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "CATEGORY_UNITS", category: null, requiredUnits: 20 }),
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a category set on a non-CATEGORY_UNITS requirement", () => {
    const result = validateCurriculumRequirementInput(input({ category: "BASIC" }));
    expect(result.valid).toBe(false);
  });

  it("accepts a valid COURSE_GROUP requirement", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "COURSE_GROUP", requiredUnits: null, courseGroupId: "group-1" }),
    );
    expect(result).toEqual({ valid: true });
  });

  it("rejects COURSE_GROUP without a course group id", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "COURSE_GROUP", requiredUnits: null, courseGroupId: null }),
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a course group id set on a non-COURSE_GROUP requirement", () => {
    const result = validateCurriculumRequirementInput(input({ courseGroupId: "group-1" }));
    expect(result.valid).toBe(false);
  });

  it("accepts a valid PRACTICAL_UNITS requirement", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "PRACTICAL_UNITS", requiredUnits: null, minimumPracticalUnits: 12 }),
    );
    expect(result).toEqual({ valid: true });
  });

  it("rejects PRACTICAL_UNITS without minimum practical units", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "PRACTICAL_UNITS", requiredUnits: null, minimumPracticalUnits: null }),
    );
    expect(result.valid).toBe(false);
  });

  it("rejects minimum practical units set on a non-PRACTICAL_UNITS requirement", () => {
    const result = validateCurriculumRequirementInput(input({ minimumPracticalUnits: 5 }));
    expect(result.valid).toBe(false);
  });

  it("rejects TOTAL_UNITS without required units", () => {
    const result = validateCurriculumRequirementInput(input({ requiredUnits: null }));
    expect(result.valid).toBe(false);
  });

  it("accepts a valid ELECTIVE_UNITS requirement", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "ELECTIVE_UNITS", requiredUnits: 10 }),
    );
    expect(result).toEqual({ valid: true });
  });

  it("rejects non-positive required units", () => {
    expect(validateCurriculumRequirementInput(input({ requiredUnits: 0 })).valid).toBe(false);
    expect(validateCurriculumRequirementInput(input({ requiredUnits: -5 })).valid).toBe(false);
  });

  it("rejects non-positive minimum practical units", () => {
    const result = validateCurriculumRequirementInput(
      input({ requirementType: "PRACTICAL_UNITS", requiredUnits: null, minimumPracticalUnits: 0 }),
    );
    expect(result.valid).toBe(false);
  });
});
