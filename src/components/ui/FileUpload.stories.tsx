import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "./FileUpload";

const meta = {
  title: "UI/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Images: Story = {
  args: {
    uploadUrl: "/api/upload",
    accept: ["image/png", "image/jpeg"],
    maxSizeBytes: 5 * 1024 * 1024,
    multiple: true,
    maxFiles: 3,
    label: "Upload course images",
    hint: "PNG or JPEG up to 5 MB each",
  },
};

export const SingleDocument: Story = {
  args: {
    uploadUrl: "/api/upload",
    accept: [".pdf"],
    multiple: false,
    label: "Upload your certificate",
    hint: "PDF files only",
  },
};
