import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "./Breadcrumb";

const meta = {
  title: "UI/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CoursePath: Story = {
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Courses", href: "/courses" },
      { label: "Frontend Development" },
    ],
  },
};

export const LongPath: Story = {
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Library", href: "/library" },
      { label: "Technology", href: "/library/technology" },
      { label: "Web Development", href: "/library/technology/web" },
      { label: "React Patterns" },
    ],
    structuredData: false,
  },
};

export const CustomLabel: Story = {
  args: {
    items: [{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }],
    ariaLabel: "You are here",
    structuredData: false,
  },
};
