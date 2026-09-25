/**
 * Quiz helpers shared by the course quiz (`components/courses/Quiz`) and the
 * lesson quiz (`components/learn/QuizComponent`).
 */

/**
 * Returns a new array containing the same items in a shuffled order.
 *
 * Fisher-Yates, non-mutating. `random` is injectable so tests (and callers that
 * want reproducible shuffles) can provide a deterministic source of entropy.
 */
export function shuffleQuestions<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = current;
  }

  return shuffled;
}

/**
 * Resolves the question order for one attempt.
 *
 * Randomization is opt-in, so when it is disabled (the default) the original
 * array is returned untouched, preserving the previous behaviour exactly.
 */
export function resolveQuizOrder<T>(
  questions: T[],
  randomize: boolean,
  random?: () => number,
): T[] {
  if (!randomize || questions.length < 2) return questions;
  return shuffleQuestions(questions, random);
}
