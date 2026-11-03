import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/site/Breadcrumb";
import { DOGEN_CATEGORIES, dogenCategoryHref, dogenProductHref, exactDogenModel, searchDogenProducts } from "@/lib/dogen/catalog";
import DogenHero from "./DogenHero";
import DogenSidebar from "./DogenSidebar";

const pageSize = 18;
export type DogenFilters = { q?: string; page?: string };

export default function DogenCatalog({ category, filters }: { category?: string; filters: DogenFilters }) {
  const current = DOGEN_CATEGORIES.find(({ slug }) => slug === category);
  const base = current ? dogenCategoryHref(current.slug) : "/products/dogen";
  const query = typeof filters.q === "string" ? filters.q : "";
  const exactMatch = exactDogenModel(query);
  const matches = searchDogenProducts(query).filter((product) => !category || product.category === category);
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const requested = Number(filters.page);
  const page = Number.isInteger(requested) ? Math.min(pageCount, Math.max(1, requested)) : 1;
  const products = matches.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <DogenHero />
      <main className="mx-auto max-w-[1320px] px-6 pb-16">
        <div className="my-7">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "DoGen", href: current ? "/products/dogen" : undefined }, ...(current ? [{ label: current.title }] : [])]} />
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <DogenSidebar active={category} />
          <section className="min-w-0">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{current?.title || "Product Catalog"}</h2>
            {!current && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {DOGEN_CATEGORIES.map(({ slug, title }) => (
                  <Link key={slug} href={dogenCategoryHref(slug)} className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-4 text-sm font-semibold text-red-900 hover:border-red-500">
                    {title} <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </div>
            )}
            <form action={base} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label htmlFor="dogen-search" className="text-xs font-semibold uppercase tracking-wide text-slate-600">Search DoGen products</label>
              <div className="mt-2 flex gap-2">
                <input id="dogen-search" name="q" defaultValue={query} placeholder="Product name or Cat.No" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm" />
                <button className="rounded-lg bg-red-800 px-4 text-sm font-semibold text-white hover:bg-red-900">Search</button>
              </div>
            </form>
            <div id="catalog-results" className="mt-6 scroll-mt-28">
              <p role="status" className="mb-4 text-sm text-slate-600">{matches.length} products</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <Link key={product.slug} data-dogen-product={product.slug} href={exactMatch?.product.slug === product.slug ? exactMatch.href : dogenProductHref(product.slug)} prefetch={false} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-sm">
                    <div className="relative aspect-[4/3] border-b border-slate-100 bg-white">
                      <Image src={product.image} alt={product.title} fill sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw" className="object-contain p-4" />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold text-red-800">{product.models[0].sku}{product.models.length > 1 ? ` + ${product.models.length - 1} options` : ""}</p>
                      <h3 className="mt-2 font-semibold leading-6 text-slate-950 group-hover:text-red-900">{product.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{product.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {!products.length && <p className="rounded-lg border border-slate-200 p-6 text-sm text-slate-600">No products match this search.</p>}
              {pageCount > 1 && (
                <nav aria-label="DoGen catalog pages" className="mt-6 flex gap-2">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
                    const params = new URLSearchParams({ page: String(n) });
                    if (query) params.set("q", query);
                    return <Link key={n} href={`${base}?${params}#catalog-results`} aria-current={n === page ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm ${n === page ? "border-red-800 bg-red-800 text-white" : "border-slate-200 text-slate-700"}`}>{n}</Link>;
                  })}
                </nav>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
