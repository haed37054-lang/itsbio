import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import Breadcrumb from "@/components/site/Breadcrumb";
import {
  BIOPLASTICS_CATEGORIES, BIOPLASTICS_GROUPS, BIOPLASTICS_ROOT, bioplasticsCategoryHref, bioplasticsGroupHref, type BioplasticsCategory,
} from "@/lib/bioplastics/navigation";

export default function BioplasticsFrame({ category, group, title, children }: {
  category?: BioplasticsCategory;
  group?: string;
  title?: string;
  children: ReactNode;
}) {
  const current = BIOPLASTICS_CATEGORIES.find(({ key }) => key === category);
  return (
    <>
      <section aria-label="BIOplastics catalog" className="relative overflow-hidden border-b border-amber-200 bg-gradient-to-r from-white to-amber-50">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-48 size-[430px] rounded-full border-[65px] border-amber-200/40" />
        <div className="relative mx-auto grid min-h-[220px] max-w-[1320px] items-center gap-8 px-6 py-10 md:min-h-[280px] md:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-900">ITS BIO</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[44px]">BIOplastics</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 md:text-base">PCR and qPCR consumables, pipette tips, tubes, racks and storage boxes.</p>
          </div>
          <div className="hidden h-[126px] items-center justify-center rounded-[22px] border border-amber-100 bg-white px-8 shadow-sm md:flex">
            <Image src="/partners/bioplastics-logo.png" alt="BIOplastics" width={240} height={100} className="h-auto max-h-20 w-auto max-w-full object-contain" preload />
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1320px] px-6 pb-16">
        <div className="my-7">
          <Breadcrumb items={[
            { label: "Home", href: "/" }, { label: "Products", href: "/products" },
            { label: "BIOplastics", href: current ? BIOPLASTICS_ROOT : undefined },
            ...(current ? [{ label: current.label, href: title ? bioplasticsCategoryHref(current.key) : undefined }] : []),
            ...(title ? [{ label: title }] : []),
          ]} />
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="min-w-0 rounded-2xl border border-slate-200 lg:sticky lg:top-24">
            <Link href={BIOPLASTICS_ROOT} className="block border-b border-slate-200 px-5 py-4 font-semibold text-slate-950">BIOplastics</Link>
            <nav aria-label="BIOplastics categories" className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1">
              {[{ key: undefined, label: "All products" }, ...BIOPLASTICS_CATEGORIES].map(({ key, label }) => (
                <Link key={label} href={key ? bioplasticsCategoryHref(key) : BIOPLASTICS_ROOT}
                  aria-current={key === category ? title ? "location" : "page" : undefined}
                  className={`block shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm ${key === category ? "bg-amber-50 font-semibold text-amber-950" : "text-slate-600 hover:bg-slate-50"}`}>
                  {label}
                </Link>
              ))}
            </nav>
            {category && <nav aria-label="BIOplastics product groups" className="hidden max-h-[55vh] overflow-y-auto border-t border-slate-100 p-3 lg:block">
              {BIOPLASTICS_GROUPS.filter(item => item.category === category).map(item => <Link key={item.code} href={bioplasticsGroupHref(category, item.code)} aria-current={item.code === group ? "location" : undefined} className={`block rounded-lg px-3 py-2 text-xs leading-5 ${item.code === group ? "bg-amber-50 font-semibold text-amber-950" : "text-slate-600 hover:bg-slate-50"}`}>{item.label}</Link>)}
            </nav>}
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
