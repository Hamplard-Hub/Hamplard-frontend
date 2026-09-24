import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Quiz from "./Quiz";

const questions = [
  {
    id: "q1",
    type: "multiple_choice" as const,
    question: "Which planet is closest to the Sun?",
    options: [
      { id: "a", text: "Venus", isCorrect: false },
      { id: "b", text: "Mercury", isCorrect: true },
    ],
    explanation: "Mercury is the closest planet to the Sun.",
  },
  {
    id: "q2",
    type: "true_false" as const,
    question: "The Moon orbits the Earth.",
    options: [
      { id: "true", text: "True", isCorrect: true },
      { id: "false", text: "False", isCorrect: false },
    ],
  },
  {
    id: "q3",
    type: "short_answer" as const,
    question: "What is 2 + 2?",
    correctAnswer: "4",
  },
];

describe("Quiz", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("is untimed and keeps the authored order by default", () => {
    render(<Quiz questions={questions} />);

    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(
      screen.getByText("Which planet is closest to the Sun?"),
    ).toBeInTheDocument();
  });

  it("shows a countdown and warns when under 30 seconds remain", () => {
    vi.useFakeTimers();
    try {
      render(<Quiz questions={questions} timeLimitSeconds={90} />);

      expect(screen.getByRole("timer")).toHaveTextContent("1:30");
      expect(screen.getByRole("timer")).toHaveAttribute(
        "data-warning",
        "false",
      );

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(screen.getByRole("timer")).toHaveTextContent("0:30");
      expect(screen.getByRole("timer")).toHaveAttribute("data-warning", "true");
    } finally {
      vi.useRealTimers();
    }
  });

  it("auto-submits the visible answer and finishes when the timer expires", () => {
    vi.useFakeTimers();
    try {
      const onComplete = vi.fn();
      render(
        <Quiz
          questions={questions}
          timeLimitSeconds={5}
          onComplete={onComplete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Mercury/ }));

      act(() => {
        vi.advanceTimersByTime(5_000);
      });

      expect(screen.getByText(/You scored 1 out of 3/)).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledWith(1, 3, false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shuffles the question order when randomizeQuestions is enabled", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      render(<Quiz questions={questions} randomizeQuestions />);

      // Fisher-Yates with random() === 0 promotes q2 to the first slot.
      expect(screen.getByText("The Moon orbits the Earth.")).toBeInTheDocument();
      expect(
        screen.queryByText("Which planet is closest to the Sun?"),
      ).not.toBeInTheDocument();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("grades submitted answers as before", () => {
    render(<Quiz questions={questions} />);

    fireEvent.click(screen.getByRole("button", { name: /Mercury/ }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });
});
