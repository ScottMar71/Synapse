import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader } from "./card";

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Surface variants and optional **interactive** (keyboard-focusable) cards. Use browser tools for hover on interactive cards.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated">
      <CardHeader title="Course overview" description="Short summary for learners." />
      <CardContent>
        <p style={{ margin: 0 }}>Card body copy goes here.</p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" size="sm">
          Secondary
        </Button>
        <Button size="sm">Primary</Button>
      </CardFooter>
    </Card>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined">
      <CardHeader title="Outlined" />
      <CardContent>Content</CardContent>
    </Card>
  ),
};

export const Flat: Story = {
  render: () => (
    <Card variant="flat">
      <CardHeader title="Flat" />
      <CardContent>Content</CardContent>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card variant="outlined" interactive tabIndex={0} role="button">
      <CardHeader title="Interactive card" description="Focus and activate with the keyboard." />
      <CardContent>Acts as a single focus target for nested content.</CardContent>
    </Card>
  ),
};
