import { describe, expect, it } from "vitest";
import { classifyAttemptState } from "./attempt-history";

describe("classifyAttemptState", () => {
  it("classifies NOT_COMPLETED with no history as never attempted", () => {
    const state = classifyAttemptState("course-a", "NOT_COMPLETED", []);
    expect(state).toEqual({
      everAttempted: false,
      currentlyStudying: false,
      previouslyPassed: false,
      previouslyFailed: false,
    });
  });

  it("classifies PLANNED with no history as never attempted", () => {
    const state = classifyAttemptState("course-a", "PLANNED", []);
    expect(state.everAttempted).toBe(false);
  });

  it("classifies PASSED current status as previously passed and attempted", () => {
    const state = classifyAttemptState("course-a", "PASSED", []);
    expect(state.everAttempted).toBe(true);
    expect(state.previouslyPassed).toBe(true);
    expect(state.previouslyFailed).toBe(false);
  });

  it("classifies FAILED current status as previously failed and attempted", () => {
    const state = classifyAttemptState("course-a", "FAILED", []);
    expect(state.everAttempted).toBe(true);
    expect(state.previouslyFailed).toBe(true);
    expect(state.previouslyPassed).toBe(false);
  });

  it("classifies CURRENTLY_STUDYING with no prior attempt record as currently studying but never (previously) attempted", () => {
    const state = classifyAttemptState("course-a", "CURRENTLY_STUDYING", []);
    expect(state.currentlyStudying).toBe(true);
    expect(state.everAttempted).toBe(false);
  });

  it("classifies CURRENTLY_STUDYING with a prior FAILED attempt as both currently studying and previously attempted (retake)", () => {
    const state = classifyAttemptState("course-a", "CURRENTLY_STUDYING", [
      { courseId: "course-a", termCode: "4051", result: "FAILED" },
    ]);
    expect(state.currentlyStudying).toBe(true);
    expect(state.everAttempted).toBe(true);
    expect(state.previouslyFailed).toBe(true);
  });

  it("ignores attempt records for other courses", () => {
    const state = classifyAttemptState("course-a", "NOT_COMPLETED", [
      { courseId: "course-b", termCode: "4051", result: "PASSED" },
    ]);
    expect(state.everAttempted).toBe(false);
  });

  it("classifies multiple attempts (fail then pass) as previously passed and previously failed", () => {
    const state = classifyAttemptState("course-a", "PASSED", [
      { courseId: "course-a", termCode: "4051", result: "FAILED" },
      { courseId: "course-a", termCode: "4052", result: "PASSED" },
    ]);
    expect(state.previouslyPassed).toBe(true);
    expect(state.previouslyFailed).toBe(true);
    expect(state.everAttempted).toBe(true);
  });
});
