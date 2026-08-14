import { describe, expect, it } from "vitest";
import { parseTermCode, isValidTermCode } from "./term";

describe("parseTermCode", () => {
  it("parses the documented Mehr example", () => {
    expect(parseTermCode("4051")).toEqual({
      termCode: "4051",
      academicYear: 1405,
      termType: "MEHR",
    });
  });

  it("parses the documented Bahman example", () => {
    expect(parseTermCode("4052")).toEqual({
      termCode: "4052",
      academicYear: 1405,
      termType: "BAHMAN",
    });
  });

  it("parses the documented Summer example", () => {
    expect(parseTermCode("4053")).toEqual({
      termCode: "4053",
      academicYear: 1405,
      termType: "SUMMER",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseTermCode("  4051  ")?.termCode).toBe("4051");
  });

  it("rejects a code with the wrong number of digits", () => {
    expect(parseTermCode("405")).toBeNull();
    expect(parseTermCode("40511")).toBeNull();
  });

  it("rejects an invalid semester digit", () => {
    expect(parseTermCode("4054")).toBeNull();
    expect(parseTermCode("4050")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseTermCode("abcd")).toBeNull();
    expect(parseTermCode("")).toBeNull();
  });
});

describe("isValidTermCode", () => {
  it("matches parseTermCode's acceptance", () => {
    expect(isValidTermCode("4051")).toBe(true);
    expect(isValidTermCode("bad")).toBe(false);
  });
});
