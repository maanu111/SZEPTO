"use client";

import { useId, useState } from "react";
import { ChevronDown } from "./icons";

type Props = {
  title: string;
  /** Shown next to the title when collapsed, e.g. a count. */
  meta?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

/** Disclosure panel that animates open without needing a measured height. */
export function Collapsible({ title, meta, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="border-t border-ink-100">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-2 py-3.5 text-left transition-colors hover:text-brand-700"
        >
          <span className="flex-1 text-sm font-bold text-ink-900">
            {title}
            {meta && <span className="ml-1.5 text-xs font-medium text-ink-400">{meta}</span>}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h2>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
