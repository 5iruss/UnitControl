import { describe, expect, it } from "vitest";
import {
  getMajors,
  getOrientationsForMajor,
  requiresCurriculumReset,
  resolveCurriculum,
} from "./curriculum-matching";
import type { CurriculumSummary } from "./types";

// docs/06_Curriculum_Dataset.md §2 — the three documented curricula.
const SE: CurriculumSummary = {
  id: "se",
  name: "Computer Engineering — Software Engineering",
  major: "Computer Engineering",
  orientation: "Software Engineering",
  entryYearFrom: null,
  entryYearTo: 1402,
};
const IT: CurriculumSummary = {
  id: "it",
  name: "Computer Engineering — Information Technology",
  major: "Computer Engineering",
  orientation: "Information Technology",
  entryYearFrom: null,
  entryYearTo: 1402,
};
const UNIFIED: CurriculumSummary = {
  id: "unified",
  name: "Computer Engineering — Unified",
  major: "Computer Engineering",
  orientation: "Unified",
  entryYearFrom: 1403,
  entryYearTo: null,
};
const CURRICULA = [SE, IT, UNIFIED];

describe("resolveCurriculum", () => {
  it("resolves Software Engineering for entry years <= 1402", () => {
    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1402,
        major: "Computer Engineering",
        orientation: "Software Engineering",
      }),
    ).toEqual(SE);

    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1390,
        major: "Computer Engineering",
        orientation: "Software Engineering",
      }),
    ).toEqual(SE);
  });

  it("resolves Information Technology for entry years <= 1402", () => {
    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1400,
        major: "Computer Engineering",
        orientation: "Information Technology",
      }),
    ).toEqual(IT);
  });

  it("resolves Unified for entry years >= 1403", () => {
    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1403,
        major: "Computer Engineering",
        orientation: "Unified",
      }),
    ).toEqual(UNIFIED);

    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1410,
        major: "Computer Engineering",
        orientation: "Unified",
      }),
    ).toEqual(UNIFIED);
  });

  it("does not match Software Engineering at the 1403 boundary", () => {
    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1403,
        major: "Computer Engineering",
        orientation: "Software Engineering",
      }),
    ).toBeNull();
  });

  it("does not match Unified at the 1402 boundary", () => {
    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1402,
        major: "Computer Engineering",
        orientation: "Unified",
      }),
    ).toBeNull();
  });

  it("returns null for an unknown major", () => {
    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1403,
        major: "Electrical Engineering",
        orientation: "Unified",
      }),
    ).toBeNull();
  });

  it("returns null for an orientation that doesn't exist for that major/year", () => {
    expect(
      resolveCurriculum(CURRICULA, {
        entryYear: 1403,
        major: "Computer Engineering",
        orientation: "Software Engineering",
      }),
    ).toBeNull();
  });
});

describe("getMajors / getOrientationsForMajor", () => {
  it("derives distinct majors from the curricula list", () => {
    expect(getMajors(CURRICULA)).toEqual(["Computer Engineering"]);
  });

  it("derives orientations scoped to a major", () => {
    expect(getOrientationsForMajor(CURRICULA, "Computer Engineering")).toEqual([
      "Software Engineering",
      "Information Technology",
      "Unified",
    ]);
  });

  it("returns an empty list for a major with no curricula", () => {
    expect(getOrientationsForMajor(CURRICULA, "Civil Engineering")).toEqual([]);
  });
});

describe("requiresCurriculumReset", () => {
  it("is false when the resolved curriculum is unchanged", () => {
    expect(requiresCurriculumReset("se", "se")).toBe(false);
  });

  it("is true when the resolved curriculum differs", () => {
    expect(requiresCurriculumReset("se", "unified")).toBe(true);
  });
});
