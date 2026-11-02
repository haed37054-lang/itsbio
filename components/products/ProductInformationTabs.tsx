"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

export default function ProductInformationTabs({ tabs, accent = "cyan" }: { tabs: Tab[]; accent?: "cyan" | "sky" | "red" }) {
  const palette = accent === "red" ? { border: "border-red-200", bar: "bg-red-50", tab: "border-red-200 focus-visible:outline-red-800", active: "bg-red-800 text-white", idle: "bg-red-50 text-red-900 hover:bg-red-100 hover:text-red-950" } : accent === "sky" ? { border: "border-sky-200", bar: "bg-sky-50", tab: "border-sky-200 focus-visible:outline-sky-800", active: "bg-sky-800 text-white", idle: "bg-sky-50 text-sky-900 hover:bg-sky-100 hover:text-sky-950" } : { border: "border-cyan-200", bar: "bg-cyan-50", tab: "border-cyan-200 focus-visible:outline-cyan-800", active: "bg-cyan-800 text-white", idle: "bg-cyan-50 text-cyan-900 hover:bg-cyan-100 hover:text-cyan-950" };
  const [active, setActive] = useState(tabs[0]?.id);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some(tab => tab.id === id)) setActive(id);
    };
    selectHash();
    window.addEventListener("hashchange", selectHash);
    return () => window.removeEventListener("hashchange", selectHash);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    window.history.replaceState(window.history.state, "", `#${id}`);
  };

  return (
    <div ref={root} className={`mt-8 overflow-hidden border bg-white ${palette.border}`}>
      <div className={`border-b ${palette.border} ${palette.bar}`}>
        <div role="tablist" aria-label="Product information" className="scrollbar-hidden flex overflow-x-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              id={`affinity-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              aria-controls={tab.id}
              tabIndex={active === tab.id ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={event => {
                let next = index;
                if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else return;
                event.preventDefault();
                select(tabs[next].id);
                root.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
              }}
              className={`inline-flex h-12 shrink-0 items-center justify-center border-r px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-[-3px] ${palette.tab} ${active === tab.id ? palette.active : palette.idle}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {tabs.map(tab => (
        <div key={tab.id} id={tab.id} role="tabpanel" aria-labelledby={`affinity-tab-${tab.id}`} hidden={active !== tab.id} tabIndex={0} className="scroll-mt-28 px-5 py-6 md:px-6 md:py-7">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
