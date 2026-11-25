import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogStory(args: Story["args"]) {
  const [open, setOpen] = useState(args.open);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-[#7F77DD] px-4 py-2 text-white"
      >
        Open dialog
      </button>
      <Dialog {...args} open={open} onClose={() => setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish your course?</DialogTitle>
            <DialogDescription>
              Review your course before making it available to students.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-ink-600">
              Publishing makes the course visible on your public profile.
            </p>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded bg-[#7F77DD] px-4 py-2 text-white"
            >
              Publish
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const Open: Story = {
  args: {
    open: true,
  },
  render: DialogStory,
};

export const WithoutCloseButton: Story = {
  args: {
    open: true,
    disableEscape: true,
    disableBackdropClick: true,
  },
  render: (args) => (
    <Dialog {...args} onClose={() => undefined}>
      <DialogContent hideCloseButton size="sm">
        <DialogHeader>
          <DialogTitle>Processing payment</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-ink-600">
            Please keep this window open while we confirm your payment.
          </p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
};
