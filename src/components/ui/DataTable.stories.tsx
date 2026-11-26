import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DataTable, type Column } from "./DataTable";

type Student = {
  id: number;
  name: string;
  course: string;
  progress: string;
};

const students: Student[] = [
  { id: 1, name: "Ada Okafor", course: "React Fundamentals", progress: "82%" },
  { id: 2, name: "Samuel Bello", course: "Product Design", progress: "64%" },
  { id: 3, name: "Mariam Yusuf", course: "TypeScript Basics", progress: "91%" },
];

const columns: Column<Student>[] = [
  { key: "name", label: "Student", sortable: true },
  { key: "course", label: "Course" },
  { key: "progress", label: "Progress", sortable: true },
];

const meta = {
  title: "UI/DataTable",
  component: DataTable,
  tags: ["autodocs"],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

function DataTableWithSorting(args: Story["args"]) {
  const [sortColumn, setSortColumn] = useState(args.sortColumn);
  const [sortDirection, setSortDirection] = useState(
    args.sortDirection ?? "asc",
  );

  return (
    <DataTable
      {...args}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={(column) => {
        setSortColumn(column);
        setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      }}
    />
  );
}

export const WithRows: Story = {
  args: {
    columns,
    data: students,
    sortColumn: "name",
    sortDirection: "asc",
  },
  render: DataTableWithSorting,
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyMessage: "No enrolled students yet",
  },
};
