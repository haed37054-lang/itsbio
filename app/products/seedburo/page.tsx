import Link from "next/link";
import Breadcrumb from "@/components/site/Breadcrumb";
import SeedburoHero from "@/components/products/seedburo/SeedburoHero";
import { SeedburoCategoryGrid, SeedburoSidebar } from "@/components/products/seedburo/SeedburoCatalog";
import { SEEDBURO_NAVIGATION, getSeedburoCollection, type SeedburoCollection } from "@/lib/seedburo/catalog";

export const metadata = { title: "Seedburo Products | ITS BIO", description: "Browse Seedburo grain, seed and feed testing equipment, product models, specifications and documents." };
export default function SeedburoPage() {
  const categories = SEEDBURO_NAVIGATION.categories.map((item) => getSeedburoCollection(item.handle)).filter((item): item is SeedburoCollection => Boolean(item));
  return <><SeedburoHero /><div className="mx-auto max-w-[1320px] px-6 pb-16"><div className="mt-6"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: "Seedburo" }]} /></div><div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]"><SeedburoSidebar /><main className="min-w-0"><div className="mb-7 flex flex-wrap items-center justify-between gap-4"><h2 className="text-3xl font-semibold tracking-tight text-slate-950">Product categories</h2><Link href="/products/seedburo/all-products" className="text-sm font-semibold text-green-800 hover:underline">View all products ›</Link></div><form action="/products/seedburo/all-products" className="mb-8 flex gap-2"><label htmlFor="seedburo-search" className="sr-only">Search Seedburo products</label><input id="seedburo-search" name="q" placeholder="Search product name or Cat.No" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100" /><button className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800">Search</button></form><SeedburoCategoryGrid categories={categories} /><Link href="/products/seedburo/categories" prefetch={false} className="mt-8 inline-flex text-sm font-semibold text-green-800 hover:underline">Browse all Seedburo categories ›</Link></main></div></div></>;
}
