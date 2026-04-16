import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "you@example.com",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Text field with label, hint, and error slots. Tab into the field to see **focus-visible**; use **error** and **disabled** stories for §4 coverage.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
  args: {
    hint: "We will only use this for account recovery.",
  },
};

export const WithError: Story = {
  args: {
    defaultValue: "not-an-email",
    error: "Enter a valid email address.",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Cannot edit",
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: "Read only value",
  },
};

export const Required: Story = {
  args: {
    required: true,
  },
};
