import Image from "next/image";
import Link from "next/link";
import { COMPACT_GLOVE_BOXES, PLASLABS_CATEGORIES, PLASLABS_ROOT, plasLabsCategoryHref, plasLabsProductHref, searchPlasLabsProducts } from "@/lib/plaslabs/catalog";
import PlasLabsFrame from "./PlasLabsFrame";

export default function PlasLabsCatalog({ category, query = "" }: { category?: (typeof PLASLABS_CATEGORIES)[number]; query?: string }) {
  const results = searchPlasLabsProducts(query, category?.slug);
  const products = query ? results : results.filter(
    ({ slug }) => !COMPACT_GLOVE_BOXES.series.some((series) => series.slug === slug),
  );
  const action = category ? plasLabsCategoryHref(category.slug) : PLASLABS_ROOT;
  return (
    <PlasLabsFrame active={category?.slug} title={category?.title || "PLAS-LABS"}>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{category?.title || "Product Catalog"}</h2>
      {category?.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{category.summary}</p>}
      <form action={action} className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label htmlFor="plaslabs-search" className="text-xs font-semibold uppercase text-slate-600">Search PLAS-LABS products</label>
        <div className="mt-2 flex gap-2">
          <input id="plaslabs-search" name="q" type="search" defaultValue={query} placeholder="Product name or Cat.No" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm" />
          <button className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700">Search</button>
        </div>
      </form>
      <p className="mb-4 text-sm text-slate-600">{products.length} {products.length === 1 ? "catalog entry" : "catalog entries"}</p>
      {products.length === 0 ? (
        <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-600">No products match this search. <Link href={action} className="font-medium underline">Clear search</Link></p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <li key={product.slug} className="min-w-0">
              <Link href={plasLabsProductHref(product.slug)} className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-400 hover:shadow-sm">
                <div className="relative flex aspect-[4/3] items-center justify-center border-b border-slate-100 bg-white">
                  {product.images[0] ? (
                    <Image src={product.images[0]} alt={product.title} fill sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw" className="object-contain p-4" />
                  ) : <span className="text-xs font-semibold tracking-widest text-slate-500">PLAS-LABS</span>}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  {product.models[0] && <p className="text-xs font-semibold text-slate-600">{product.models[0]}{product.models.length > 1 ? ` + ${product.models.length - 1} more` : ""}</p>}
                  <h3 className="font-semibold text-slate-950 group-hover:underline">{product.slug === COMPACT_GLOVE_BOXES.slug ? COMPACT_GLOVE_BOXES.title : product.title}</h3>
                  {product.slug === COMPACT_GLOVE_BOXES.slug ? (
                    <p className="text-sm leading-6 text-slate-600">{COMPACT_GLOVE_BOXES.series.map(({ title }) => title).join(" · ")}</p>
                  ) : product.summary && <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.summary}</p>}
                  <span className="mt-auto pt-2 text-sm font-semibold text-slate-800">View details <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PlasLabsFrame>
  );
}
