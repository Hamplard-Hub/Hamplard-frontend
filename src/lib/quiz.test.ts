import { describe, expect, it } from "vitest";
import { resolveQuizOrder, shuffleQuestions } from "./quiz";

describe("shuffleQuestions", () => {
  it("returns a new array containing the same items", () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffleQuestions(input);

    expect(output).not.toBe(input);
    expect([...output].sort()).toEqual([...input].sort());
  });

  it("shuffles deterministically when a random source is provided", () => {
    expect(shuffleQuestions([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });

  it("does not mutate the source array", () => {
    const input = [1, 2, 3];
    shuffleQuestions(input, () => 0);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe("resolveQuizOrder", () => {
  it("returns the original questions untouched when randomization is off", () => {
    const input = ["a", "b", "c"];
    expect(resolveQuizOrder(input, false)).toBe(input);
  });

  it("shuffles when randomization is on", () => {
    expect(resolveQuizOrder(["a", "b", "c"], true, () => 0)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("leaves single-question quizzes in order", () => {
    const input = ["only"];
    expect(resolveQuizOrder(input, true, () => 0)).toBe(input);
  });
});
