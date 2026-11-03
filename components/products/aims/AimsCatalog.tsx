import Link from "next/link";
import Breadcrumb from "@/components/site/Breadcrumb";
import {AIMS_PRODUCTS,AIMS_CATEGORIES,searchAimsProducts} from "@/lib/aims/catalog";
import { AIMS_FAMILIES } from "@/lib/aims/families";
import AimsHero from "./AimsHero";
import AimsSidebar from "./AimsSidebar";
import AimsProductCards from "./AimsProductCards";
export default function AimsCatalog({category="",filters={}}:{category?:string;filters?:{q?:string;page?:string}}) {
  const current=AIMS_CATEGORIES.find(c=>c.slug===category),scope=AIMS_PRODUCTS.filter(p=>!category||p.categories.includes(category));
  const matches=filters.q?new Set(searchAimsProducts(filters.q).map(p=>p.slug)):null;
  const products=scope.filter(p=>!matches||matches.has(p.slug));
  const pages=Math.max(1,Math.ceil(products.length/24));const requested=Number(filters.page);const page=Math.min(pages,Number.isSafeInteger(requested)&&requested>0?requested:1);
  const base=category?`/products/aims/${category}`:'/products/aims';
  const pageHref=(n:number)=>`${base}?${new URLSearchParams({...filters,page:String(n)})}#catalog-results`;
  return <><AimsHero brandOverview={!category} /><main className="mx-auto max-w-[1320px] px-6 pb-16"><div className="my-7"><Breadcrumb items={[{label:'Home',href:'/'},{label:'Products',href:'/products'},{label:'AIMS',...(category?{href:'/products/aims'}:{})},...(current?[{label:'Lab Products',href:'/products/aims#lab-products'},{label:current.title}]:[])]} /></div>
    {!category && (
      <nav aria-label="AIMS product families" className="mb-8 grid gap-4 sm:grid-cols-2">
        {AIMS_FAMILIES.map((family) => (
          <Link key={family.href} href={family.href} className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 transition hover:border-red-300 hover:bg-red-50/30">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 group-hover:text-red-800">{family.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{family.description}</p>
            </div>
            <span aria-hidden="true" className="shrink-0 text-lg text-red-800">→</span>
          </Link>
        ))}
      </nav>
    )}
    <div id={category ? undefined : "lab-products"} className="grid scroll-mt-28 items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]"><AimsSidebar active={category} /><div className="min-w-0"><h2 className="text-3xl font-semibold tracking-tight text-slate-950">{current?.title||'Lab Products'}</h2><p className="mt-3 text-sm leading-7 text-slate-600">Browse {scope.length} products from AIMS Lab Products.</p>
    {!category?<div className="mt-6 grid gap-3 sm:grid-cols-2">{AIMS_CATEGORIES.filter(c=>!c.parent).map(c=><Link key={c.slug} href={`/products/aims/${c.slug}`} className="rounded-xl border border-red-200 bg-red-50/50 px-5 py-4 text-sm font-semibold text-red-950 hover:border-red-500">{c.title} ›</Link>)}</div>:null}
    <form action={base} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"><label htmlFor="aims-query" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Search within {current?.title||'AIMS Lab Products'}</label><div className="mt-3 flex gap-2"><input id="aims-query" name="q" defaultValue={filters.q||''} placeholder="Product name, model or Cat.No" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm" /><button className="rounded-xl bg-red-800 px-5 text-sm font-semibold text-white hover:bg-red-900">Search</button></div><Link href={base} className="mt-3 inline-block text-xs font-medium text-red-900 underline">Reset filters</Link></form>
    <section id="catalog-results" className="scroll-mt-28"><div className="mb-4 mt-7 flex items-center justify-between"><p role="status" className="text-sm text-slate-600">{products.length?`${(page-1)*24+1}–${Math.min(page*24,products.length)} of ${products.length} products`:'0 products'}</p><p className="text-xs text-slate-500">Page {page} / {pages}</p></div><AimsProductCards products={products.slice((page-1)*24,page*24)} />{!products.length?<p className="rounded-xl border border-slate-200 p-8 text-sm text-slate-600">No matching products. Try another product name or catalog number.</p>:null}{pages>1?<nav aria-label="AIMS catalog pages" className="mt-6 flex flex-wrap gap-2">{Array.from({length:pages},(_,i)=>i+1).map(n=><Link key={n} href={pageHref(n)} aria-current={n===page?'page':undefined} className={`rounded-lg border px-3 py-2 text-sm ${n===page?'border-red-800 bg-red-800 text-white':'border-slate-200 text-slate-700'}`}>{n}</Link>)}</nav>:null}</section>
  </div></div></main></>;
}
