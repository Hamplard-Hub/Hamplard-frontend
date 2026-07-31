'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuizType = 'multiple_choice' | 'true_false' | 'short_answer';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  passPercentage?: number;
  onComplete?: (score: number, total: number, passed: boolean) => void;
  onProgressSave?: (currentIndex: number, answers: Record<string, string>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'quiz-progress';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Quiz({
  questions,
  passPercentage = 60,
  onComplete,
  onProgressSave,
}: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const isFirstQuestion = currentIndex === 0;

  // Restore saved progress on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentIndex(parsed.currentIndex ?? 0);
        setAnswers(parsed.answers ?? {});
        setSubmitted(parsed.submitted ?? {});
      }
    } catch {
      // Ignore invalid storage
    }
  }, []);

  // Save progress
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentIndex, answers, submitted }),
      );
      onProgressSave?.(currentIndex, answers);
    } catch {
      // Ignore storage errors
    }
  }, [currentIndex, answers, submitted, onProgressSave]);

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      if (submitted[questionId]) return;
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    },
    [submitted],
  );

  const handleShortAnswer = useCallback(
    (questionId: string, value: string) => {
      if (submitted[questionId]) return;
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    [submitted],
  );

  const handleSubmitAnswer = useCallback(
    (questionId: string) => {
      if (!answers[questionId]) return;
      setSubmitted((prev) => ({ ...prev, [questionId]: true }));

      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      const userAnswer = answers[questionId];
      let isCorrect = false;

      if (question.type === 'short_answer') {
        isCorrect =
          userAnswer.trim().toLowerCase() ===
          (question.correctAnswer ?? '').trim().toLowerCase();
      } else {
        const correctOption = question.options?.find((o) => o.isCorrect);
        isCorrect = correctOption?.id === userAnswer;
      }

      if (isCorrect) {
        setScore((prev) => prev + 1);
      }
    },
    [answers, questions],
  );

  const handleNext = useCallback(() => {
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  }, [isLastQuestion]);

  const handlePrevious = useCallback(() => {
    if (!isFirstQuestion) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [isFirstQuestion]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted({});
    setShowResult(false);
    setScore(0);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= passPercentage;

  // Call onComplete when quiz finishes
  useEffect(() => {
    if (showResult) {
      onComplete?.(score, total, passed);
    }
  }, [showResult, score, total, passed, onComplete]);

  // ---------------------------------------------------------------------------
  // Score Summary Screen
  // ---------------------------------------------------------------------------

  if (showResult) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold',
            passed
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700',
          )}
        >
          {percentage}%
        </div>

        <h2 className="mt-4 text-xl font-semibold text-ink-900">
          {passed ? 'Congratulations!' : 'Keep Trying'}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          {passed
            ? 'You passed the quiz!'
            : `You need ${passPercentage}% to pass.`}
        </p>

        <div className="mt-6 flex w-full max-w-xs gap-4">
          <div className="flex-1 rounded-lg bg-emerald-50 p-3">
            <p className="text-2xl font-bold text-emerald-700">{score}</p>
            <p className="text-xs text-emerald-600">Correct</p>
          </div>
          <div className="flex-1 rounded-lg bg-rose-50 p-3">
            <p className="text-2xl font-bold text-rose-700">
              {total - score}
            </p>
            <p className="text-xs text-rose-600">Incorrect</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
              'bg-hamplard-primary text-white hover:bg-hamplard-mid transition-colors',
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </button>
          <button
            type="button"
            onClick={() => {
              setShowResult(false);
              setCurrentIndex(0);
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
              'border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors',
            )}
          >
            Review Answers
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Question Screen
  // ---------------------------------------------------------------------------

  if (!currentQuestion) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <p className="text-ink-500">No questions available.</p>
      </div>
    );
  }

  const isSubmitted = submitted[currentQuestion.id] ?? false;
  const selectedAnswer = answers[currentQuestion.id] ?? '';
  const correctOption = currentQuestion.options?.find((o) => o.isCorrect);
  const isCorrect =
    isSubmitted &&
    (currentQuestion.type === 'short_answer'
      ? selectedAnswer.trim().toLowerCase() ===
        (currentQuestion.correctAnswer ?? '').trim().toLowerCase()
      : correctOption?.id === selectedAnswer);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-ink-500">
          <span>
            Question {currentIndex + 1} of {total}
          </span>
          <span>
            {Object.keys(submitted).length} of {total} answered
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-hamplard-primary transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / total) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold text-ink-900">
        {currentQuestion.question}
      </h3>

      {/* Options */}
      <div className="mt-6 space-y-3">
        {currentQuestion.type === 'short_answer' ? (
          <div>
            <input
              type="text"
              value={selectedAnswer}
              onChange={(e) =>
                handleShortAnswer(currentQuestion.id, e.target.value)
              }
              disabled={isSubmitted}
              placeholder="Type your answer..."
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400',
                'focus:outline-none focus:ring-2 focus:ring-hamplard-primary/40',
                isSubmitted && isCorrect && 'border-emerald-500 bg-emerald-50',
                isSubmitted && !isCorrect && 'border-rose-500 bg-rose-50',
                !isSubmitted && 'border-ink-200',
                isSubmitted && 'cursor-not-allowed opacity-75',
              )}
              aria-label="Your answer"
            />
          </div>
        ) : (
          currentQuestion.options?.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const showCorrect = isSubmitted && option.isCorrect;
            const showIncorrect =
              isSubmitted && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  handleSelectOption(currentQuestion.id, option.id)
                }
                disabled={isSubmitted}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all',
                  isSelected &&
                    !isSubmitted &&
                    'border-[#7F77DD] bg-hamplard-lilac/50',
                  showCorrect && 'border-emerald-500 bg-emerald-50',
                  showIncorrect && 'border-rose-500 bg-rose-50',
                  !isSelected &&
                    !isSubmitted &&
                    'border-ink-200 hover:bg-ink-50',
                  isSubmitted &&
                    !isSelected &&
                    !option.isCorrect &&
                    'cursor-not-allowed opacity-60',
                  isSubmitted && 'cursor-default',
                )}
                aria-pressed={isSelected}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                    isSelected &&
                      !isSubmitted &&
                      'border-[#7F77DD] bg-[#7F77DD] text-white',
                    showCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                    showIncorrect && 'border-rose-500 bg-rose-500 text-white',
                    !isSelected && !isSubmitted && 'border-ink-300 text-ink-400',
                  )}
                >
                  {showCorrect ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : showIncorrect ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    String.fromCharCode(65 + currentQuestion.options!.indexOf(option))
                  )}
                </span>
                <span className="flex-1">{option.text}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Feedback after submission */}
      {isSubmitted && (
        <div
          className={cn(
            'mt-4 rounded-lg p-4',
            isCorrect
              ? 'border border-emerald-200 bg-emerald-50'
              : 'border border-rose-200 bg-rose-50',
          )}
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <Check className="h-5 w-5 text-emerald-600" />
            ) : (
              <X className="h-5 w-5 text-rose-600" />
            )}
            <span
              className={cn(
                'text-sm font-semibold',
                isCorrect ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          {currentQuestion.explanation && (
            <p className="mt-2 text-sm text-ink-600">
              {currentQuestion.explanation}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isFirstQuestion
              ? 'cursor-not-allowed text-ink-300'
              : 'text-ink-600 hover:bg-ink-50',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {!isSubmitted ? (
          <button
            type="button"
            onClick={() => handleSubmitAnswer(currentQuestion.id)}
            disabled={!selectedAnswer}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              selectedAnswer
                ? 'bg-hamplard-primary text-white hover:bg-hamplard-mid'
                : 'cursor-not-allowed bg-ink-100 text-ink-400',
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
            {isLastQuestion ? 'See Results' : 'Next'}
            {!isLastQuestion && <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;
