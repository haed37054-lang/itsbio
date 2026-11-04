import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/site/Breadcrumb";
import { PLASLABS_CATEGORIES, PLASLABS_ROOT, plasLabsCategoryHref } from "@/lib/plaslabs/catalog";

export default function PlasLabsFrame({ active, title, children }: { active?: string; title: string; children: ReactNode }) {
  const category = PLASLABS_CATEGORIES.find(({ slug }) => slug === active);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "PLAS-LABS", href: PLASLABS_ROOT },
    ...(category && category.title !== title ? [{ label: category.title, href: plasLabsCategoryHref(category.slug) }] : []),
    ...(title === "PLAS-LABS" ? [] : [{ label: title }]),
  ];

  return (
    <>
      <section aria-label="PLAS-LABS product catalog" className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-r from-white to-slate-100" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-[9%] -top-[55%] h-[440px] w-[440px] rounded-full bg-slate-900/10 md:right-[2%]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-[85%] right-[15%] h-[430px] w-[430px] rounded-full border-[70px] border-slate-900/5" aria-hidden="true" />
        <div className="absolute right-0 top-0 h-full w-[7px] bg-slate-900" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_360px] md:py-14">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700">
              <span className="h-px w-8 bg-slate-700" aria-hidden="true" /> ITS BIO
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-slate-950 md:text-[44px]">PLAS-LABS</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
              Controlled-environment glove boxes, laboratory enclosures, and animal care equipment.
            </p>
          </div>
          <div className="hidden h-[126px] w-[330px] items-center justify-center justify-self-end rounded-[22px] border border-slate-200 bg-white px-8 shadow-sm md:flex">
            <Image src="/partners/plaslabs-banner-logo.png" alt="PLAS-LABS, Inc." width={600} height={60} className="h-auto w-[240px] max-w-full" priority />
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1320px] px-6 pb-16">
        <div className="my-7"><Breadcrumb items={crumbs} /></div>
        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-24">
            <Link href={PLASLABS_ROOT} className="block border-b border-slate-200 px-5 py-4 font-semibold text-slate-950">PLAS-LABS</Link>
            <nav aria-label="PLAS-LABS product categories" className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1">
              {[{ slug: "", title: "All products" }, ...PLASLABS_CATEGORIES].map(({ slug, title: label }) => {
                const selected = (active || "") === slug;
                return <Link key={slug} href={slug ? plasLabsCategoryHref(slug) : PLASLABS_ROOT}
                  aria-current={selected ? (category && title !== category.title ? "location" : "page") : undefined}
                  className={`block shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm lg:whitespace-normal ${selected ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{label}</Link>;
              })}
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
