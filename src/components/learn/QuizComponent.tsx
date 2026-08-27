"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronRight, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

interface QuizComponentProps {
  questions: QuizQuestion[];
  passPercentage?: number;
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
  onComplete,
  onContinue,
}: QuizComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const lastScoredRef = useRef<Record<string, boolean>>({});

  const total = questions.length;
  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const options = question ? normalizeOptions(question) : [];
  const selected = question ? (answers[question.id] ?? []) : [];
  const isSubmitted = question ? Boolean(submitted[question.id]) : false;
  const correct = question ? isAnswerCorrect(question, selected) : false;
  const answered = selected.length > 0;

  useEffect(() => {
    if (!question || !isSubmitted || lastScoredRef.current[question.id]) return;
    if (correct) setScore((prev) => prev + 1);
    lastScoredRef.current[question.id] = true;
  }, [question, isSubmitted, correct]);

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
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      onComplete?.(score, total, percentage >= passPercentage);
      setShowResults(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastQuestion, score, total, passPercentage, onComplete]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted({});
    setShowResults(false);
    setScore(0);
    lastScoredRef.current = {};
  }, []);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <p className="text-sm text-ink-500">
          No questions have been added to this lesson yet.
        </p>
      </div>
    );
  }

  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= passPercentage;

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

  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-ink-500">
          <span>
            Question {currentIndex + 1} of {total}
          </span>
          <span>{progressPercent}% complete</span>
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
              : "Select one answer."}
        </p>

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

      <div className="mt-6 flex items-center justify-end">
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

export default QuizComponent;
