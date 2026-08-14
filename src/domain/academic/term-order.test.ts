import { describe, expect, it } from "vitest";
import { compareTermCodes, laterTermCode, termsElapsed } from "./term-order";

describe("compareTermCodes", () => {
  it("orders Mehr before Bahman before Summer within the same year", () => {
    expect(compareTermCodes("4051", "4052")).toBeLessThan(0);
    expect(compareTermCodes("4052", "4053")).toBeLessThan(0);
    expect(compareTermCodes("4051", "4053")).toBeLessThan(0);
  });

  it("orders an earlier year before a later year regardless of semester type", () => {
    expect(compareTermCodes("4053", "4061")).toBeLessThan(0);
  });

  it("returns 0 for identical terms", () => {
    expect(compareTermCodes("4051", "4051")).toBe(0);
  });

  it("returns null when either code fails to parse", () => {
    expect(compareTermCodes("not-a-term", "4051")).toBeNull();
    expect(compareTermCodes("4051", "9999")).toBeNull();
  });
});

describe("termsElapsed", () => {
  it("counts zero for the same term", () => {
    expect(termsElapsed("4051", "4051")).toBe(0);
  });

  it("counts one step between adjacent terms", () => {
    expect(termsElapsed("4051", "4052")).toBe(1);
    expect(termsElapsed("4052", "4053")).toBe(1);
  });

  it("counts across a year boundary", () => {
    expect(termsElapsed("4053", "4061")).toBe(1);
    expect(termsElapsed("4051", "4061")).toBe(3);
  });

  it("returns null when `toCode` is before `fromCode`", () => {
    expect(termsElapsed("4052", "4051")).toBeNull();
  });

  it("returns null when either code fails to parse", () => {
    expect(termsElapsed("bogus", "4051")).toBeNull();
  });
});

describe("laterTermCode", () => {
  it("returns the later of two terms", () => {
    expect(laterTermCode("4051", "4052")).toBe("4052");
    expect(laterTermCode("4052", "4051")).toBe("4052");
  });

  it("returns null if either code fails to parse", () => {
    expect(laterTermCode("bogus", "4051")).toBeNull();
  });
});
