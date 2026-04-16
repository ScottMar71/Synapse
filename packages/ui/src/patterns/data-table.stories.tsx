import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import type { DataTableColumn, DataTableSortState } from "./data-table";
import { DataTable } from "./data-table";

type DemoRow = { id: string; name: string; status: string };

const columns: DataTableColumn<DemoRow>[] = [
  {
    id: "name",
    header: "Name",
    sortable: true,
    cell: (row) => row.name,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => row.status,
  },
];

const sampleRows: DemoRow[] = [
  { id: "1", name: "Introduction", status: "Complete" },
  { id: "2", name: "Practice quiz", status: "In progress" },
  { id: "3", name: "Final assessment", status: "Not started" },
];

type DataTableStoryProps = {
  loading?: boolean;
  rows: DemoRow[];
  responsiveMode?: "cards" | "scroll";
};

function DataTableStory(props: DataTableStoryProps) {
  const [sort, setSort] = useState<DataTableSortState>(null);

  return (
    <DataTable
      columns={columns}
      rows={props.rows}
      getRowId={(row) => row.id}
      sort={sort}
      onSortChange={setSort}
      loading={props.loading}
      empty={<p>No rows match.</p>}
      responsiveMode={props.responsiveMode}
      aria-label="Lessons"
    />
  );
}

const meta = {
  title: "Patterns/DataTable",
  component: DataTableStory,
  tags: ["autodocs"],
  args: {
    loading: false,
    rows: sampleRows,
    responsiveMode: "cards" as const,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Responsive table with sortable headers and loading skeleton (**aria-busy**). Resize the preview or use **scroll** mode; sort buttons show **focus-visible** in the browser.",
      },
    },
  },
} satisfies Meta<typeof DataTableStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true, rows: [] },
};

export const Empty: Story = {
  args: { rows: [] },
};

export const ScrollMode: Story = {
  args: { responsiveMode: "scroll" },
};
