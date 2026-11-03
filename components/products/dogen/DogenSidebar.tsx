import Link from "next/link";
import categories from "@/data/dogen/categories.json";

export default function DogenSidebar({ active }: { active?: string }) {
  const items = [{ slug: "", title: "All products" }, ...categories];
  return (
    <aside className="self-start rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-24">
      <Link href="/products/dogen" className="block border-b border-slate-200 px-5 py-4 font-semibold text-red-900">DoGen</Link>
      <nav aria-label="DoGen product categories" className="space-y-1 p-3">
        {items.map(({ slug, title }) => {
          const selected = (active || "") === slug;
          return (
            <Link key={slug} href={slug ? `/products/dogen/${slug}` : "/products/dogen"} aria-current={selected ? "page" : undefined} className={`block rounded-lg px-3 py-2.5 text-sm ${selected ? "bg-red-50 font-semibold text-red-900" : "text-slate-600 hover:bg-slate-50 hover:text-red-900"}`}>
              {title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
