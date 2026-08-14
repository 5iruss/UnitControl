// docs/04_Academic_Rules_Engine.md §17 — academic term ordering. Term codes
// must not be compared as arbitrary strings; ordering is year first, then
// semester type within a year (Mehr < Bahman < Summer). Built on top of
// domain/academic-status's parseTermCode, which owns term-code parsing.

import { parseTermCode } from "@/domain/academic-status/term";
import type { TermTypeValue } from "@/domain/academic-status/types";

const TERM_TYPE_ORDER: Record<TermTypeValue, number> = {
  MEHR: 1,
  BAHMAN: 2,
  SUMMER: 3,
};

function termIndex(termCode: string): number | null {
  const parsed = parseTermCode(termCode);
  if (!parsed) return null;
  return parsed.academicYear * 3 + TERM_TYPE_ORDER[parsed.termType];
}

/// Returns negative/zero/positive if `a` is before/equal/after `b`, or null
/// if either code fails to parse. Never guesses an ordering for invalid input.
export function compareTermCodes(a: string, b: string): number | null {
  const ai = termIndex(a);
  const bi = termIndex(b);
  if (ai === null || bi === null) return null;
  return ai - bi;
}

/// Number of term-steps moving forward from `fromCode` to `toCode` (Mehr ->
/// Bahman -> Summer -> next year's Mehr -> ...). Returns null if either code
/// fails to parse, or if `toCode` is not at or after `fromCode` — this
/// function only measures forward distance, it does not report "how far in
/// the past."
export function termsElapsed(fromCode: string, toCode: string): number | null {
  const fromIndex = termIndex(fromCode);
  const toIndex = termIndex(toCode);
  if (fromIndex === null || toIndex === null || toIndex < fromIndex) return null;
  return toIndex - fromIndex;
}

/// The later of two term codes, by term order. Returns null if either code
/// fails to parse.
export function laterTermCode(a: string, b: string): string | null {
  const cmp = compareTermCodes(a, b);
  if (cmp === null) return null;
  return cmp >= 0 ? a : b;
}
