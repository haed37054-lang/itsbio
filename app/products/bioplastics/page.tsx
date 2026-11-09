import Image from "next/image";
import Link from "next/link";
import BioplasticsFrame from "@/components/products/bioplastics/BioplasticsFrame";
import { searchBioplasticsProducts } from "@/lib/bioplastics/catalog";
import { BIOPLASTICS_DOCUMENTS } from "@/lib/bioplastics/documents";
import { BIOPLASTICS_CATEGORIES, BIOPLASTICS_GROUPS, BIOPLASTICS_ROOT, bioplasticsProductHref } from "@/lib/bioplastics/navigation";

export const metadata = { title: "BIOplastics Products" };

export default async function BioplasticsCatalogPage({ searchParams }: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[]; group?: string | string[]; page?: string | string[] }>;
}) {
  const { category: categoryParam, q, group, page } = await searchParams;
  const category = BIOPLASTICS_CATEGORIES.find(({ key }) => key === categoryParam)?.key;
  const currentGroup = BIOPLASTICS_GROUPS.find(item => item.code === group && (!category || item.category === category));
  const current = BIOPLASTICS_CATEGORIES.find(({ key }) => key === (category || currentGroup?.category));
  const query = typeof q === "string" ? q.trim() : "";
  const matches = searchBioplasticsProducts(query, current?.key).filter(product => !currentGroup || product.groupCodes?.includes(currentGroup.code));
  const pageSize = 48;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(pageCount, Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1));
  const products = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageHref = (number: number) => {
    const params = new URLSearchParams();
    if (current) params.set("category", current.key);
    if (currentGroup) params.set("group", currentGroup.code);
    if (query) params.set("q", query);
    if (number > 1) params.set("page", String(number));
    return params.size ? `${BIOPLASTICS_ROOT}?${params}` : BIOPLASTICS_ROOT;
  };
  const pageNumbers = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => currentPage + i - 2), pageCount])].filter(number => number >= 1 && number <= pageCount).sort((a, b) => a - b);
  return (
    <BioplasticsFrame category={current?.key} group={currentGroup?.code}>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{currentGroup?.label ?? current?.label ?? "All products"}</h2>
      <form action={BIOPLASTICS_ROOT} className="my-6 flex flex-wrap gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
        {current && <input type="hidden" name="category" value={current.key} />}
        <label htmlFor="bioplastics-group" className="sr-only">Product group</label>
        <select id="bioplastics-group" name="group" defaultValue={currentGroup?.code || ""} className="h-11 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:max-w-72">
          <option value="">All product groups</option>
          {BIOPLASTICS_GROUPS.filter(item => !current || item.category === current.key).map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
        <label htmlFor="bioplastics-search" className="sr-only">Search BIOplastics</label>
        <input id="bioplastics-search" type="search" name="q" defaultValue={query} placeholder="Product name or catalog number" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm" />
        <button className="rounded-lg bg-amber-900 px-5 text-sm font-semibold text-white hover:bg-amber-950">Search</button>
      </form>
      <p className="mb-4 text-sm text-slate-600" role="status">{matches.length} listed {matches.length === 1 ? "product" : "products"}{matches.length > pageSize ? ` · ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, matches.length)}` : ""}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="bg-amber-50 text-amber-950"><tr>
            {["Image", "Cat.No", "Product", "Package"].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(product => (
              <tr key={product.sku}>
                <td className="px-4 py-2">{product.image && <Image src={product.image} alt="" width={48} height={48} unoptimized className="size-12 object-contain" />}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-amber-950">
                  <Link href={bioplasticsProductHref(product.sku)} prefetch={false} className="underline-offset-4 hover:underline">{product.sku}</Link>
                </td>
                <th scope="row" className="px-4 py-3 font-semibold text-slate-950">
                  <Link href={bioplasticsProductHref(product.sku)} prefetch={false} className="underline-offset-4 hover:underline">{product.title}</Link>
                  {product.group && <p className="mt-1 text-xs font-normal text-slate-600">{product.group}</p>}
                </th>
                <td className="px-4 py-3 text-slate-600">{product.pack || "—"}</td>
              </tr>
            ))}
            {!products.length && <tr><td colSpan={4} className="px-4 py-6 text-slate-600">No products match this search.</td></tr>}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <nav aria-label="Product pages" className="mt-6 flex flex-wrap items-center gap-2">
          {currentPage > 1 && <Link href={pageHref(currentPage - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Previous</Link>}
          {pageNumbers.map((number, index) => <span key={number} className="inline-flex items-center gap-2">{index > 0 && number - pageNumbers[index - 1] > 1 && <span aria-hidden="true">…</span>}<Link href={pageHref(number)} aria-current={number === currentPage ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm ${number === currentPage ? "border-amber-900 bg-amber-900 text-white" : "border-slate-200"}`}>{number}</Link></span>)}
          {currentPage < pageCount && <Link href={pageHref(currentPage + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Next</Link>}
        </nav>
      )}
      {!current && !query && (
        <section className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xl font-semibold text-slate-950">Technical documents</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {BIOPLASTICS_DOCUMENTS.map(({ label, url }) => (
              <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-amber-900 underline underline-offset-4">{label} (PDF)</a></li>
            ))}
          </ul>
        </section>
      )}
    </BioplasticsFrame>
  );
}
