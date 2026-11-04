import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/site/Breadcrumb";
import { CELLFREE_CATEGORIES, CELLFREE_ROOT, cellFreeCategoryHref, type CellFreeCategory } from "@/lib/cellfree/navigation";

export default function CellFreeFrame({ category, title, children }: { category?: CellFreeCategory; title?: string; children: ReactNode }) {
  const current = CELLFREE_CATEGORIES.find(({ key }) => key === category);
  return (
    <>
      <section aria-label="CellFree Sciences catalog" className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-r from-white to-blue-50">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-48 h-[430px] w-[430px] rounded-full border-[65px] border-blue-200/35" />
        <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900">ITS BIO</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[44px]">CellFree Sciences</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 md:text-base">Wheat germ cell-free protein expression kits, reagents, instruments and research services.</p>
          </div>
          <div className="hidden h-[126px] items-center justify-center rounded-[22px] border border-blue-100 bg-white px-8 shadow-sm md:flex">
            <Image src="/partners/cellfreesciences-logo.png" alt="CellFree Sciences" width={240} height={100} className="h-auto max-w-full" preload />
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1320px] px-6 pb-16">
        <div className="my-7">
          <Breadcrumb items={[
            { label: "Home", href: "/" }, { label: "Products", href: "/products" },
            { label: "CellFree Sciences", href: current || title ? CELLFREE_ROOT : undefined },
            ...(current ? [{ label: current.label, href: title ? cellFreeCategoryHref(current.key) : undefined }] : []),
            ...(title ? [{ label: title }] : []),
          ]} />
        </div>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="min-w-0 self-start rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-24">
            <Link href={CELLFREE_ROOT} className="block border-b border-slate-200 px-5 py-4 font-semibold text-slate-950">CellFree Sciences</Link>
            <nav aria-label="CellFree Sciences product categories" className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1">
              <Link href={CELLFREE_ROOT} aria-current={!category ? "page" : undefined} className={`block shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm ${!category ? "bg-blue-50 font-semibold text-blue-950" : "text-slate-600 hover:bg-slate-50"}`}>All products &amp; services</Link>
              {CELLFREE_CATEGORIES.map(({ key, label }) => (
                <Link key={key} href={cellFreeCategoryHref(key)} aria-current={key === category ? title ? "location" : "page" : undefined}
                  className={`block shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm lg:whitespace-normal ${key === category ? "bg-blue-50 font-semibold text-blue-950" : "text-slate-600 hover:bg-slate-50"}`}>{label}</Link>
              ))}
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
