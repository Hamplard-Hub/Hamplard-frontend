"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shuffleQuestions } from "@/lib/quiz";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { QuizTimer } from "@/components/ui/QuizTimer";
import type { QuizQuestion } from "@/types";

interface QuizComponentProps {
  questions: QuizQuestion[];
  passPercentage?: number;
  /**
   * Optional assessment time limit, in seconds. When omitted (or non-positive)
   * the quiz stays untimed, exactly as before.
   */
  timeLimitSeconds?: number | null;
  /**
   * When `true`, questions are shuffled once per attempt. Defaults to `false`
   * so existing lesson quizzes keep their authored order.
   */
  randomizeQuestions?: boolean;
  onComplete?: (score: number, total: number, passed: boolean) => void;
  onContinue?: () => void;
}

const TRUE_FALSE_OPTIONS = [
  { id: "true", text: "True", isCorrect: true },
  { id: "false", text: "False", isCorrect: false },
];

function normalizeOptions(question: QuizQuestion) {
  if (question.type === "true_false") {
    return question.options ?? TRUE_FALSE_OPTIONS;
  }
  return question.options ?? [];
}

function isAnswerCorrect(question: QuizQuestion, answer: string[]) {
  if (question.type === "short_answer") {
    const given = (answer[0] ?? "").trim().toLowerCase();
    return (
      given !== "" &&
      given === (question.correctAnswer ?? "").trim().toLowerCase()
    );
  }

  const options = normalizeOptions(question);
  const correctIds = new Set(
    options.filter((o) => o.isCorrect).map((o) => o.id),
  );
  if (correctIds.size === 0) return false;
  if (answer.length !== correctIds.size) return false;
  return answer.every((id) => correctIds.has(id));
}

export function QuizComponent({
  questions,
  passPercentage = 60,
  timeLimitSeconds = null,
  randomizeQuestions = false,
  onComplete,
  onContinue,
}: QuizComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "incorrect">("all");
  const [orderedQuestions, setOrderedQuestions] = useState<QuizQuestion[]>(() =>
    randomizeQuestions ? shuffleQuestions(questions) : questions,
  );

  const feedbackRef = useRef<HTMLDivElement | null>(null);

  // Keep the order in sync with the props, re-rolling when randomization is
  // toggled on so an in-flight attempt is not reordered mid-quiz.
  useEffect(() => {
    setOrderedQuestions(
      randomizeQuestions ? shuffleQuestions(questions) : questions,
    );
  }, [questions, randomizeQuestions]);

  const total = orderedQuestions.length;
  const question = orderedQuestions[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const options = question ? normalizeOptions(question) : [];
  const selected = question ? (answers[question.id] ?? []) : [];
  const isSubmitted = question ? Boolean(submitted[question.id]) : false;
  const correct = question ? isAnswerCorrect(question, selected) : false;
  const answered = selected.length > 0;

  // Derived score keeps timer auto-submits from double counting answers.
  const score = useMemo(
    () =>
      orderedQuestions.reduce(
        (acc, item) =>
          submitted[item.id] && isAnswerCorrect(item, answers[item.id] ?? [])
            ? acc + 1
            : acc,
        0,
      ),
    [orderedQuestions, answers, submitted],
  );

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= passPercentage;

  // Auto-submit the visible answer, then reveal the results screen.
  const handleTimeUp = useCallback(() => {
    setSubmitted((prev) => {
      if (!question || prev[question.id] || selected.length === 0) return prev;
      return { ...prev, [question.id]: true };
    });
    setShowResults(true);
  }, [question, selected]);

  const { secondsLeft, isWarning, isActive, restart } = useCountdown({
    seconds: timeLimitSeconds,
    enabled: !showResults,
    onExpire: handleTimeUp,
  });

  const handleToggleOption = useCallback(
    (optionId: string) => {
      if (!question || isSubmitted) return;
      const multi = question.type === "multi_select";
      setAnswers((prev) => {
        const current = prev[question.id] ?? [];
        if (!multi) return { ...prev, [question.id]: [optionId] };
        return {
          ...prev,
          [question.id]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      });
    },
    [question, isSubmitted],
  );

  const handleShortAnswer = useCallback(
    (value: string) => {
      if (!question || isSubmitted) return;
      setAnswers((prev) => ({
        ...prev,
        [question.id]: value.trim() === "" ? [] : [value],
      }));
    },
    [question, isSubmitted],
  );

  const handleSubmit = useCallback(() => {
    if (!question || !answered) return;
    setSubmitted((prev) => ({ ...prev, [question.id]: true }));
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [question, answered]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastQuestion]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReview = useCallback(() => {
    setShowResults(false);
    setShowReview(true);
    setReviewFilter("all");
  }, []);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted({});
    setShowResults(false);
    setShowReview(false);

    if (randomizeQuestions) {
      setOrderedQuestions(shuffleQuestions(questions));
    }

    restart();
  }, [questions, randomizeQuestions, restart]);

  // Report completion exactly once per attempt (covers timer auto-submit too).
  const hasReportedRef = useRef(false);
  useEffect(() => {
    if (!showResults) {
      hasReportedRef.current = false;
      return;
    }
    if (hasReportedRef.current) return;
    hasReportedRef.current = true;
    onComplete?.(score, total, passed);
  }, [showResults, score, total, passed, onComplete]);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <p className="text-sm text-ink-500">
          No questions have been added to this lesson yet.
        </p>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold",
            passed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700",
          )}
        >
          {percentage}%
        </div>

        <h2 className="mt-4 text-xl font-semibold text-ink-900">
          {passed ? "Congratulations!" : "Keep trying"}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          You scored {score} out of {total} ({percentage}%)
          {passed
            ? " and passed the quiz."
            : `, passing at ${passPercentage}%.`}
        </p>

        <div className="mt-6 flex w-full max-w-xs gap-4">
          <div className="flex-1 rounded-lg bg-emerald-50 p-3">
            <p className="text-2xl font-bold text-emerald-700">{score}</p>
            <p className="text-xs text-emerald-600">Correct</p>
          </div>
          <div className="flex-1 rounded-lg bg-rose-50 p-3">
            <p className="text-2xl font-bold text-rose-700">{total - score}</p>
            <p className="text-xs text-rose-600">Incorrect</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex items-center gap-2 rounded-lg bg-hamplard-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hamplard-mid"
          >
            <RotateCcw className="h-4 w-4" />
            Retake
          </button>
          <button
            type="button"
            onClick={handleReview}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            Review answers
          </button>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
            >
              Continue to next lecture
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Review screen ──────────────────────────────────────────────────
  if (showReview) {
    const reviewItems = orderedQuestions.filter((q) => {
      const isCorrect = isAnswerCorrect(q, answers[q.id] ?? []);
      return reviewFilter === "all" || !isCorrect;
    });

    return (
      <div className="rounded-2xl border border-ink-200 bg-white dark:bg-ink-900 dark:border-ink-700 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
            Answer Review
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-500" />
            <button
              type="button"
              onClick={() => setReviewFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                reviewFilter === "all"
                  ? "bg-hamplard-primary text-white"
                  : "border border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400",
              )}
            >
              All ({orderedQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter("incorrect")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                reviewFilter === "incorrect"
                  ? "bg-rose-600 text-white"
                  : "border border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400",
              )}
            >
              Incorrect ({total - score})
            </button>
          </div>
        </div>

        {reviewItems.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-500">
            No questions match this filter.
          </p>
        )}

        <div className="space-y-6">
          {reviewItems.map((q, idx) => {
            const qOptions = normalizeOptions(q);
            const givenAnswer = answers[q.id] ?? [];
            const isCorrect = isAnswerCorrect(q, givenAnswer);
            const correctOptionIds = new Set(
              qOptions.filter((o) => o.isCorrect).map((o) => o.id),
            );

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border p-4",
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30",
                )}
              >
                <div className="mb-2 flex items-start gap-2">
                  {isCorrect ? (
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                  )}
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-100">
                    <span className="mr-1 text-ink-400">Q{idx + 1}.</span>
                    {q.question}
                  </p>
                </div>

                {q.type === "short_answer" ? (
                  <div className="ml-6 mt-2 space-y-1 text-xs">
                    <p className="text-ink-600 dark:text-ink-400">
                      <span className="font-semibold">Your answer:</span>{" "}
                      <span className={isCorrect ? "text-emerald-700" : "text-rose-700"}>
                        {givenAnswer[0] || <em>No answer</em>}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-ink-600 dark:text-ink-400">
                        <span className="font-semibold">Correct answer:</span>{" "}
                        <span className="text-emerald-700">{q.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="ml-6 mt-2 space-y-1">
                    {qOptions.map((opt) => {
                      const wasSelected = givenAnswer.includes(opt.id);
                      const isOptCorrect = correctOptionIds.has(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
                            isOptCorrect && "font-semibold text-emerald-700 dark:text-emerald-400",
                            wasSelected && !isOptCorrect && "text-rose-700 line-through dark:text-rose-400",
                            !wasSelected && !isOptCorrect && "text-ink-500 dark:text-ink-400",
                          )}
                        >
                          {isOptCorrect && <Check className="h-3 w-3 flex-shrink-0 text-emerald-600" />}
                          {wasSelected && !isOptCorrect && <X className="h-3 w-3 flex-shrink-0 text-rose-500" />}
                          {!isOptCorrect && !wasSelected && <span className="h-3 w-3 flex-shrink-0" />}
                          {opt.text}
                          {wasSelected && isOptCorrect && (
                            <span className="ml-1 text-emerald-600">(your answer ✓)</span>
                          )}
                          {wasSelected && !isOptCorrect && (
                            <span className="ml-1 text-rose-500">(your answer)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.explanation && (
                  <p className="ml-6 mt-2 rounded-md bg-white/60 px-3 py-2 text-xs text-ink-600 dark:bg-ink-800/40 dark:text-ink-400">
                    <span className="font-semibold">Explanation:</span> {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex items-center gap-2 rounded-lg bg-hamplard-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hamplard-mid"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </button>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 text-sm text-ink-500">
          <span>
            Question {currentIndex + 1} of {total}
          </span>
          <div className="flex items-center gap-3">
            {isActive && (
              <QuizTimer secondsLeft={secondsLeft} isWarning={isWarning} />
            )}
            <span>{progressPercent}% complete</span>
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={currentIndex + 1}
          aria-label={`Question ${currentIndex + 1} of ${total}`}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100"
        >
          <div
            className="h-full rounded-full bg-hamplard-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-lg font-semibold text-ink-900">
          {question.question}
        </legend>
        <p className="mt-1 text-xs text-ink-400">
          {question.type === "multi_select"
            ? "Select all that apply."
            : question.type === "true_false"
              ? "Select one."
              : question.type === "short_answer"
                ? "Type your answer."
                : "Select one answer."}
        </p>

        {question.type === "short_answer" ? (
          <input
            type="text"
            value={selected[0] ?? ""}
            onChange={(e) => handleShortAnswer(e.target.value)}
            disabled={isSubmitted}
            placeholder="Type your answer..."
            aria-label="Your answer"
            className={cn(
              "mt-5 w-full rounded-lg border px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400",
              "focus:outline-none focus:ring-2 focus:ring-hamplard-primary/40",
              !isSubmitted && "border-ink-200",
              isSubmitted && correct && "border-emerald-500 bg-emerald-50",
              isSubmitted && !correct && "border-rose-500 bg-rose-50",
              isSubmitted && "cursor-not-allowed opacity-75",
            )}
          />
        ) : (
        <div className="mt-5 space-y-3">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            const showCorrect = isSubmitted && option.isCorrect;
            const showIncorrect =
              isSubmitted && isSelected && !option.isCorrect;

            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
                  !isSubmitted &&
                    isSelected &&
                    "border-hamplard-primary bg-hamplard-lilac/50",
                  !isSubmitted &&
                    !isSelected &&
                    "border-ink-200 hover:bg-ink-50",
                  showCorrect && "border-emerald-500 bg-emerald-50",
                  showIncorrect && "border-rose-500 bg-rose-50",
                  isSubmitted &&
                    !showCorrect &&
                    !showIncorrect &&
                    "cursor-not-allowed opacity-60",
                  isSubmitted && showCorrect && "cursor-default",
                )}
              >
                <input
                  type={question.type === "multi_select" ? "checkbox" : "radio"}
                  name={question.id}
                  value={option.id}
                  checked={isSelected}
                  disabled={isSubmitted}
                  onChange={() => handleToggleOption(option.id)}
                  className={cn(
                    "mt-0.5 h-4 w-4 flex-shrink-0",
                    question.type === "multi_select"
                      ? "rounded accent-hamplard-primary"
                      : "accent-hamplard-primary",
                  )}
                />
                <span className="flex-1 leading-snug text-ink-700">
                  {option.text}
                </span>
                {showCorrect && (
                  <Check className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                )}
                {showIncorrect && (
                  <X className="h-4 w-4 flex-shrink-0 text-rose-600" />
                )}
              </label>
            );
          })}
        </div>
        )}
      </fieldset>

      {isSubmitted && (
        <div
          ref={feedbackRef}
          aria-live="polite"
          className={cn(
            "mt-4 rounded-lg border p-4",
            correct
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50",
          )}
        >
          <div className="flex items-center gap-2">
            {correct ? (
              <Check className="h-5 w-5 text-emerald-600" />
            ) : (
              <X className="h-5 w-5 text-rose-600" />
            )}
            <span
              className={cn(
                "text-sm font-semibold",
                correct ? "text-emerald-700" : "text-rose-700",
              )}
            >
              {correct ? "Correct!" : "Incorrect"}
            </span>
          </div>
          {question.explanation && (
            <p className="mt-2 text-sm text-ink-600">{question.explanation}</p>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            currentIndex === 0
              ? "cursor-not-allowed text-ink-300"
              : "text-ink-600 hover:bg-ink-50",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answered}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              answered
                ? "bg-hamplard-primary text-white hover:bg-hamplard-mid"
                : "cursor-not-allowed bg-ink-100 text-ink-400",
            )}
          >
            Submit Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1 rounded-lg bg-hamplard-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hamplard-mid"
          >
            {isLastQuestion ? "See Results" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export { QuizComponent as Quiz };
export default QuizComponent;
