"use client";

import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { useRef, useState } from "react";

import { cx } from "../internal/cx";
import tabStyles from "./patterns-tabs.module.css";

export type TabItem = {
  id: string;
  label: string;
  panel: ReactNode;
};

export type TabsProps = {
  items: TabItem[];
  defaultSelectedId?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
};

/**
 * Keyboard: Left/Right move focus and selection; Home/End jump to first/last.
 * Inactive tabs use `tabIndex={-1}` (roving tabindex); the selected tab is `tabIndex={0}`.
 */
export function Tabs({ items, defaultSelectedId, selectedId: controlledId, onSelect }: TabsProps): ReactElement {
  const [internalId, setInternalId] = useState(defaultSelectedId ?? items[0]?.id ?? "");
  const selectedId = controlledId ?? internalId;
  const setSelected = (id: string) => {
    onSelect?.(id);
    if (controlledId === undefined) {
      setInternalId(id);
    }
  };

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const n = items.length;
    if (n === 0) {
      return;
    }
    let next = index;
    if (event.key === "ArrowRight") {
      next = (index + 1) % n;
    } else if (event.key === "ArrowLeft") {
      next = (index - 1 + n) % n;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = n - 1;
    } else {
      return;
    }
    event.preventDefault();
    setSelected(items[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      <ul role="tablist" className={tabStyles.tabList}>
        {items.map((item, index) => (
          <li key={item.id} className={tabStyles.tab}>
            <button
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={item.id === selectedId}
              aria-controls={`panel-${item.id}`}
              tabIndex={item.id === selectedId ? 0 : -1}
              className={cx(tabStyles.tabButton, item.id === selectedId ? tabStyles.tabButtonSelected : undefined)}
              onClick={() => {
                setSelected(item.id);
              }}
              onKeyDown={(e) => {
                onKeyDown(e, index);
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          hidden={item.id !== selectedId}
          className={tabStyles.tabPanel}
          tabIndex={0}
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
}
