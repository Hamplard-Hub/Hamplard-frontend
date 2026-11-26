import type { Meta, StoryObj } from "@storybook/react";
import { CountdownTimer } from "./CountdownTimer";

const meta = {
  title: "UI/CountdownTimer",
  component: CountdownTimer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CountdownTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    expiresAt: new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
    ),
    label: "Course offer ends in",
  },
};

export const WithoutLabel: Story = {
  args: {
    expiresAt: new Date(Date.now() + 90 * 1000),
    label: "",
  },
};

export const Expired: Story = {
  args: {
    expiresAt: new Date(Date.now() - 1000),
  },
};
