import type { ParsedTerm, TermTypeValue } from "./types";

// docs/06_Curriculum_Dataset.md §6 — "YYYS" format: 3-digit year segment +
// 1-digit semester (1=Mehr, 2=Bahman, 3=Summer). The example "4051" = "Mehr
// 1405" is the only documented instance — the year segment ("405") is the
// last 3 digits of the real 4-digit year ("1405"). See Phase 5 plan report,
// ambiguity #1.
const TERM_CODE_PATTERN = /^(\d{3})([123])$/;

const TERM_TYPE_BY_DIGIT: Record<string, TermTypeValue> = {
  "1": "MEHR",
  "2": "BAHMAN",
  "3": "SUMMER",
};

export function parseTermCode(rawCode: string): ParsedTerm | null {
  const termCode = rawCode.trim();
  const match = TERM_CODE_PATTERN.exec(termCode);
  if (!match) return null;

  const [, yearSegment, semesterDigit] = match;
  return {
    termCode,
    academicYear: Number(`1${yearSegment}`),
    termType: TERM_TYPE_BY_DIGIT[semesterDigit],
  };
}

export function isValidTermCode(rawCode: string): boolean {
  return parseTermCode(rawCode) !== null;
}
