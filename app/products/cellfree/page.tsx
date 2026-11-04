import Image from "next/image";
import Link from "next/link";
import CellFreeFrame from "@/components/products/cellfree/CellFreeFrame";
import { exactCellFreeOption, searchCellFreeProducts } from "@/lib/cellfree/catalog";
import { CELLFREE_CATEGORIES, CELLFREE_ROOT, cellFreeCategoryHref, cellFreeProductHref } from "@/lib/cellfree/navigation";

export const metadata = { title: "CellFree Sciences Products & Services" };

type Props = { searchParams: Promise<{ category?: string | string[]; q?: string | string[] }> };

export default async function CellFreeCatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const selected = CELLFREE_CATEGORIES.find(({ key }) => key === params.category);
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const products = searchCellFreeProducts(query, selected?.key);
  const exact = exactCellFreeOption(query);
  const resetHref = selected ? cellFreeCategoryHref(selected.key) : CELLFREE_ROOT;

  return (
    <CellFreeFrame category={selected?.key}>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{selected?.label ?? "Products & Services"}</h2>
      <form action={CELLFREE_ROOT} className="my-6 flex flex-wrap gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
        {selected && <input type="hidden" name="category" value={selected.key} />}
        <label htmlFor="cellfree-search" className="sr-only">Search CellFree Sciences</label>
        <input id="cellfree-search" type="search" name="q" defaultValue={query} placeholder="Product name or catalog number" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm" />
        <button className="rounded-lg bg-blue-900 px-5 text-sm font-semibold text-white hover:bg-blue-950">Search</button>
      </form>
      <p className="mb-4 text-sm text-slate-600" role="status">{products.length} catalog {products.length === 1 ? "entry" : "entries"}</p>
      {products.length ? (
        <ul className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <li key={product.slug} className="min-w-0">
              <Link href={cellFreeProductHref(product.slug, exact?.product.slug === product.slug ? exact.option.sku : undefined)} className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm">
                <div className="relative aspect-[4/3] border-b border-slate-100">
                  {product.image ? (
                    <Image src={product.image} alt="" fill sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw" className="object-contain p-4" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-blue-50 p-4 text-center text-sm font-semibold text-blue-900">Research service</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-xs font-semibold text-blue-900">{product.options[0]?.sku ?? "Custom service"}{product.options.length > 1 ? ` · ${product.options.length} options` : ""}</p>
                  <h3 className="font-semibold leading-snug text-slate-950 group-hover:underline">{product.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{product.summary}</p>
                  <span className="mt-auto pt-2 text-sm font-semibold text-blue-900">View details <span aria-hidden>→</span></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
          <p>No entries match this search.</p>
          <Link href={resetHref} className="mt-3 inline-block font-semibold text-blue-900 underline">Clear search</Link>
        </div>
      )}
    </CellFreeFrame>
  );
}
