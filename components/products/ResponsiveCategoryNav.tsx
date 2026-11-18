"use client";

import { useId, useState, type ReactNode } from "react";

export default function ResponsiveCategoryNav({ label, children }: { label: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <div className="responsive-category-nav min-w-0 self-start">
      <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)} className="mb-3 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 lg:hidden">
        <span>Browse categories<span className="mt-0.5 block text-xs font-normal text-slate-500">{label}</span></span>
        <span aria-hidden>{expanded ? "−" : "+"}</span>
      </button>
      <div id={id} className={`${expanded ? "block" : "hidden"} lg:block`}>{children}</div>
    </div>
  );
}
