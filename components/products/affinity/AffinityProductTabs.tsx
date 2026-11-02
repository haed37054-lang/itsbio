"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

export default function AffinityProductTabs({ tabs }: { tabs: Tab[] }) {
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
    <div ref={root} className="mt-8 overflow-hidden border border-cyan-200 bg-white">
      <div className="border-b border-cyan-200 bg-cyan-50">
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
              className={`inline-flex h-12 shrink-0 items-center justify-center border-r border-cyan-200 px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cyan-800 ${active === tab.id ? "bg-cyan-800 text-white" : "bg-cyan-50 text-cyan-900 hover:bg-cyan-100 hover:text-cyan-950"}`}
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
