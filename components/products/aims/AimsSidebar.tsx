import Link from "next/link";
import { AIMS_CATEGORIES } from "@/lib/aims/catalog";

export default function AimsSidebar({active=""}:{active?:string}) {
  const path=new Set<string>();let current=AIMS_CATEGORIES.find(c=>c.slug===active);while(current){path.add(current.slug);current=AIMS_CATEGORIES.find(c=>c.slug===current?.parent);}
  const render=(parent="",depth=0)=>AIMS_CATEGORIES.filter(c=>c.parent===parent).map(c=>{
    const link=<Link href={`/products/aims/${c.slug}`} prefetch={false} aria-current={active===c.slug?'page':undefined} className={`block min-w-0 rounded-lg px-3 py-2.5 text-sm ${active===c.slug?'bg-red-50 font-semibold text-red-900':'text-slate-600 hover:bg-slate-50 hover:text-red-900'}`}>{c.title}</Link>;
    return AIMS_CATEGORIES.some(child=>child.parent===c.slug)?<details key={c.slug} open={path.has(c.slug)} className={depth?'ml-3 border-l border-slate-200':'mt-2'}><summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden"><div className="min-w-0 flex-1">{link}</div><span aria-label={`Expand ${c.title}`} className="px-2 text-red-700">⌄</span></summary>{render(c.slug,depth+1)}</details>:<div key={c.slug} className={depth?'ml-3 border-l border-slate-200':'mt-2'}>{link}</div>;
  });
  return <aside className="self-start rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-24"><Link href="/products/aims" className="block border-b border-slate-200 px-5 py-4 font-semibold text-red-900">AIMS Lab Products</Link><nav aria-label="AIMS Lab Products categories" className="p-3 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto"><Link href="/products/aims" aria-current={!active?'page':undefined} className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${!active?'bg-red-50 text-red-900':'text-slate-600'}`}>All products</Link>{render()}</nav></aside>;
}
