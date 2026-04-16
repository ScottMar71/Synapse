import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "./button";
import { Modal } from "./modal";

type ModalStoryProps = {
  title: string;
  width?: "sm" | "md" | "lg";
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

function ModalStory(props: ModalStoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={props.title}
        width={props.width}
        closeOnBackdropClick={props.closeOnBackdropClick}
        closeOnEscape={props.closeOnEscape}
      >
        <p style={{ margin: "0 0 12px" }}>Dialog body. Try Escape and backdrop click (when enabled).</p>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Close
        </Button>
      </Modal>
    </div>
  );
}

const meta = {
  title: "Primitives/Modal",
  component: ModalStory,
  tags: ["autodocs"],
  args: {
    title: "Example dialog",
    width: "md" as const,
    closeOnBackdropClick: true,
    closeOnEscape: true,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Modal dialog with focus trap and scroll lock. Open the story preview and use the trigger to exercise **focus-visible** on the close control.",
      },
    },
  },
} satisfies Meta<typeof ModalStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Narrow: Story = {
  args: { width: "sm" },
};

export const Wide: Story = {
  args: { width: "lg" },
};

export const Strict: Story = {
  name: "No backdrop / Escape close",
  args: {
    closeOnBackdropClick: false,
    closeOnEscape: false,
    title: "Confirm destructive action",
  },
};
