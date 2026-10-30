import Image from "next/image";
import Link from "next/link";
import {
  SEEDBURO_NAVIGATION, SEEDBURO_PRODUCTS, getSeedburoCollection,
  seedburoCollectionHref, seedburoPrimarySku, seedburoProductHref,
  type SeedburoCollection, type SeedburoProduct,
} from "@/lib/seedburo/catalog";

export function SeedburoSidebar({ active = "" }: { active?: string }) {
  return (
    <aside className="self-start lg:sticky lg:top-24">
      <nav aria-label="Seedburo categories" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Link href="/products/seedburo" className="block border-b border-slate-200 px-5 py-4 font-semibold text-green-800">Seedburo Equipment</Link>
        <div className="max-h-[calc(100vh-190px)] overflow-y-auto p-2">
          <Link href="/products/seedburo/all-products" prefetch={false} aria-current={active === "all-products" ? "page" : undefined} className={`block rounded-xl px-3 py-2.5 text-sm ${active === "all-products" ? "bg-green-50 font-semibold text-green-800" : "text-slate-700 hover:bg-slate-50"}`}>All products <span className="float-right text-xs text-slate-400">{SEEDBURO_PRODUCTS.length.toLocaleString()}</span></Link>
          {SEEDBURO_NAVIGATION.categories.map((item) => {
            const category = getSeedburoCollection(item.handle);
            if (!category) return null;
            return <Link key={item.handle} href={seedburoCollectionHref(item.handle)} prefetch={false} aria-current={active === item.handle ? "page" : undefined} className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-sm ${active === item.handle ? "bg-green-50 font-semibold text-green-800" : "text-slate-700 hover:bg-slate-50"}`}><span>{item.title}</span><span className="mt-0.5 text-xs text-slate-400">{category.count}</span></Link>;
          })}
          <div className="mx-3 mb-2 mt-5 border-t border-slate-200 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Product phases</div>
          {SEEDBURO_NAVIGATION.phases.map((item) => <Link key={item.handle} href={seedburoCollectionHref(item.handle)} prefetch={false} className={`block rounded-xl px-3 py-2.5 text-sm ${active === item.handle ? "bg-green-50 font-semibold text-green-800" : "text-slate-700 hover:bg-slate-50"}`}>{item.title}</Link>)}
          <Link href="/products/seedburo/categories" prefetch={false} className="mt-4 block border-t border-slate-200 px-3 py-3 text-sm font-semibold text-green-800">Browse all categories ›</Link>
        </div>
      </nav>
    </aside>
  );
}

export function SeedburoCategoryGrid({ categories }: { categories: SeedburoCollection[] }) {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{categories.map((category) => (
    <Link key={category.handle} href={seedburoCollectionHref(category.handle)} prefetch={false} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md">
      {category.image ? <div className="relative aspect-[4/3] bg-white"><Image src={category.image} alt="" fill sizes="(max-width: 640px) 90vw, 320px" quality={90} className="object-contain p-5" /></div> : null}
      <div className="border-t border-slate-100 p-5"><h3 className="font-semibold text-slate-950 group-hover:text-green-800">{category.title}</h3><p className="mt-2 text-sm text-slate-500">{category.count} products</p><p className="mt-4 text-sm font-semibold text-green-800">Browse category ›</p></div>
    </Link>
  ))}</div>;
}

export function SeedburoProductGrid({ products }: { products: SeedburoProduct[] }) {
  return <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => (
    <Link key={product.id} href={seedburoProductHref(product)} prefetch={false} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-green-300 hover:shadow-md">
      {product.images[0] ? <div className="relative aspect-square border-b border-slate-100 bg-white"><Image src={product.images[0].url} alt={product.images[0].alt} fill quality={90} sizes="(max-width: 640px) 90vw, (max-width: 1280px) 40vw, 300px" className="object-contain p-5" /></div> : null}
      <div className="flex flex-1 flex-col p-5"><div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{seedburoPrimarySku(product) ? `Cat.No ${seedburoPrimarySku(product)}` : "Seedburo"}</div><h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight text-slate-950 group-hover:text-green-800">{product.title}</h3>{product.summary ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{product.summary}</p> : null}<div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-semibold text-green-800"><span>View product ›</span>{product.variants.length > 1 ? <span className="text-xs font-normal text-slate-500">{product.variants.length} models</span> : null}</div></div>
    </Link>
  ))}</div>;
}

export function SeedburoPagination({ page, pageCount, path, query = "" }: { page: number; pageCount: number; path: string; query?: string }) {
  if (pageCount <= 1) return null;
  const href = (value: number) => `${path}?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(value) })}`;
  const pages = Array.from(new Set([1, page - 1, page, page + 1, pageCount])).filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  return <nav aria-label="Product pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">{page > 1 ? <Link href={href(page - 1)} prefetch={false} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">‹ Previous</Link> : null}{pages.map((value, index) => <span key={value} className="inline-flex items-center gap-2">{index > 0 && value - pages[index - 1] > 1 ? <span className="px-1 text-slate-400">…</span> : null}<Link href={href(value)} prefetch={false} aria-current={value === page ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm ${value === page ? "border-green-700 bg-green-700 text-white" : "border-slate-200 hover:bg-green-50"}`}>{value}</Link></span>)}{page < pageCount ? <Link href={href(page + 1)} prefetch={false} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Next ›</Link> : null}</nav>;
}
