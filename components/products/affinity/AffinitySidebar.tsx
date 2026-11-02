import Link from "next/link";
import { AFFINITY_CATEGORIES, affinityCategoryHref } from "@/lib/affinityimmuno/catalog";

export default function AffinitySidebar({active = ""}: {active?: string}) {
  const item = (slug: string, title: string, count: number, child = false) => <Link key={slug} href={slug ? affinityCategoryHref(slug) : "/products/affinity"} prefetch={false} aria-current={active === slug ? "page" : undefined} className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${child ? "ml-3 border-l border-slate-200" : "font-medium"} ${active === slug ? "bg-cyan-50 font-semibold text-cyan-900" : "text-slate-600 hover:bg-slate-50 hover:text-cyan-900"}`}><span>{title}</span><span className="mt-0.5 text-xs tabular-nums text-slate-500">{count}</span></Link>;
  return <aside className="self-start rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-24"><Link href="/products/affinity" className="block border-b border-slate-200 px-5 py-4 font-semibold text-cyan-900">AffinityImmuno</Link><nav aria-label="AffinityImmuno categories" className="p-3">{item("","All products",217)}{AFFINITY_CATEGORIES.filter(c=>!c.parent).map(c=><div key={c.slug} className="mt-3">{item(c.slug,c.title,c.count)}{AFFINITY_CATEGORIES.filter(child=>child.parent===c.slug).map(child=>item(child.slug,child.title,child.count,true))}</div>)}</nav></aside>;
}
