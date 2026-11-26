import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./Pagination";

const meta = {
  title: "UI/Pagination",
  component: Pagination,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/courses",
        query: {},
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    currentPage: 3,
    totalPages: 8,
    updateUrl: false,
  },
};

export const CalculatedFromItems: Story = {
  args: {
    currentPage: 1,
    totalItems: 42,
    itemsPerPage: 10,
    updateUrl: false,
  },
};

export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 4,
    updateUrl: false,
  },
};
