import { notFound } from "next/navigation";
import Breadcrumb from "@/components/site/Breadcrumb";
import SeedburoHero from "@/components/products/seedburo/SeedburoHero";
import { SeedburoCategoryGrid, SeedburoPagination, SeedburoProductGrid, SeedburoSidebar } from "@/components/products/seedburo/SeedburoCatalog";
import { SEEDBURO_COLLECTIONS, SEEDBURO_PRODUCTS, getSeedburoCollection, searchSeedburoProducts, seedburoCollectionProducts } from "@/lib/seedburo/catalog";

export default async function SeedburoCollectionPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const [{ category: handle }, query] = await Promise.all([params, searchParams]);
  const collection = getSeedburoCollection(handle);
  const all = handle === "all-products";
  const directory = handle === "categories";
  if (!collection && !all && !directory) notFound();
  const title = directory ? "All Seedburo categories" : all ? "All Seedburo products" : collection!.title;
  const q = String(query.q || "").trim().slice(0, 150);
  const source = all ? SEEDBURO_PRODUCTS : seedburoCollectionProducts(handle);
  const products = q ? searchSeedburoProducts(q, source) : source;
  const categories = directory ? SEEDBURO_COLLECTIONS.filter((item) => item.title.toLowerCase().includes(q.toLowerCase())) : [];
  const pageSize = 24;
  const count = directory ? categories.length : products.length;
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const requested = Number(query.page || 1);
  const page = Math.min(pageCount, Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 1));
  const start = (page - 1) * pageSize;
  return <><SeedburoHero /><div className="mx-auto max-w-[1320px] px-6 pb-16"><div className="mt-6"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "Seedburo", href: "/products/seedburo" }, { label: title }]} /></div><div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]"><SeedburoSidebar active={handle} /><main className="min-w-0"><h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>{collection?.description ? <p className="mt-4 text-sm leading-7 text-slate-600">{collection.description}</p> : null}<form className="my-6 flex gap-2"><label htmlFor="seedburo-category-search" className="sr-only">Search {directory ? "categories" : "products"}</label><input id="seedburo-category-search" name="q" defaultValue={q} placeholder={directory ? "Search category name" : "Search product name or Cat.No"} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100" /><button className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800">Search</button></form><div className="mb-7 border-b border-slate-200 pb-4 text-sm text-slate-500">{count.toLocaleString()} {directory ? "categories" : "products"}{count ? ` · ${start + 1}–${Math.min(start + pageSize, count)}` : ""}</div>{directory ? <SeedburoCategoryGrid categories={categories.slice(start, start + pageSize)} /> : <SeedburoProductGrid products={products.slice(start, start + pageSize)} />}{!count ? <p className="py-12 text-center text-slate-500">No matching {directory ? "categories" : "products"} found.</p> : null}<SeedburoPagination page={page} pageCount={pageCount} path={`/products/seedburo/${handle}`} query={q} /></main></div></div></>;
}
