import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuizComponent from "./QuizComponent";
import type { QuizQuestion } from "@/types";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    type: "multiple_choice",
    question: "Which planet is closest to the Sun?",
    options: [
      { id: "a", text: "Venus", isCorrect: false },
      { id: "b", text: "Mercury", isCorrect: true },
      { id: "c", text: "Mars", isCorrect: false },
    ],
    explanation: "Mercury is the closest planet to the Sun.",
  },
  {
    id: "q2",
    type: "multi_select",
    question: "Select all gas giants.",
    options: [
      { id: "a", text: "Jupiter", isCorrect: true },
      { id: "b", text: "Saturn", isCorrect: true },
      { id: "c", text: "Earth", isCorrect: false },
    ],
    explanation: "Jupiter and Saturn are the gas giants.",
  },
  {
    id: "q3",
    type: "true_false",
    question: "The Moon orbits the Earth.",
    explanation: "The Moon orbits the Earth.",
  },
];

describe("QuizComponent", () => {
  it("shows one question at a time with progress", () => {
    render(<QuizComponent questions={questions} />);
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("Which planet is closest to the Sun?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Select all gas giants."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Question 1 of 3" }),
    ).toBeInTheDocument();
  });

  it("renders multiple choice options as radios", () => {
    render(<QuizComponent questions={questions} />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
  });

  it("shows correct/incorrect feedback with explanation after submit", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByText("Mercury is the closest planet to the Sun."),
    ).toBeInTheDocument();
  });

  it("shows incorrect feedback for a wrong single answer", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Venus/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(screen.getByText("Incorrect")).toBeInTheDocument();
  });

  it("disables inputs after submission", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(screen.getByRole("radio", { name: /Mercury/ })).toBeDisabled();
  });

  it("requires every correct option for multi-select", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Jupiter/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(
      screen.getByText("Jupiter and Saturn are the gas giants."),
    ).toBeInTheDocument();
  });

  it("marks multi-select correct when all correct options are chosen", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Jupiter/ }));
    await user.click(screen.getByRole("checkbox", { name: /Saturn/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("renders true/false questions", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Jupiter/ }));
    await user.click(screen.getByRole("checkbox", { name: /Saturn/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("The Moon orbits the Earth.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /True/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /False/ })).toBeInTheDocument();
  });

  it("shows results screen with score and Retake/Continue CTAs", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<QuizComponent questions={questions} onContinue={onContinue} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Jupiter/ }));
    await user.click(screen.getByRole("checkbox", { name: /Saturn/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("radio", { name: /True/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "See Results" }));

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText(/You scored 3 out of 3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retake" })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Continue to next lecture" }),
    );
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("retake resets the quiz to question 1", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Jupiter/ }));
    await user.click(screen.getByRole("checkbox", { name: /Saturn/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("radio", { name: /True/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "See Results" }));
    await user.click(screen.getByRole("button", { name: "Retake" }));

    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
  });

  it("calls onComplete with score and pass state", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <QuizComponent
        questions={questions}
        onComplete={onComplete}
        passPercentage={60}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Jupiter/ }));
    await user.click(screen.getByRole("checkbox", { name: /Saturn/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("radio", { name: /False/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "See Results" }));

    expect(onComplete).toHaveBeenCalledWith(2, 3, true);
  });

  it("shows an empty state when there are no questions", () => {
    render(<QuizComponent questions={[]} />);
    expect(
      screen.getByText("No questions have been added to this lesson yet."),
    ).toBeInTheDocument();
  });

  it("hides the Continue button when onContinue is not provided", async () => {
    const user = userEvent.setup();
    render(<QuizComponent questions={questions} />);

    await user.click(screen.getByRole("radio", { name: /Mercury/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("checkbox", { name: /Jupiter/ }));
    await user.click(screen.getByRole("checkbox", { name: /Saturn/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByRole("radio", { name: /True/ }));
    await user.click(screen.getByRole("button", { name: "Submit Answer" }));
    await user.click(screen.getByRole("button", { name: "See Results" }));

    expect(
      screen.queryByRole("button", { name: "Continue to next lecture" }),
    ).not.toBeInTheDocument();
  });
});
