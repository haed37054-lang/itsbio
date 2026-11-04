import Image from "next/image";
import Link from "next/link";
import BioplasticsFrame from "@/components/products/bioplastics/BioplasticsFrame";
import { searchBioplasticsProducts } from "@/lib/bioplastics/catalog";
import { BIOPLASTICS_CATEGORIES, BIOPLASTICS_ROOT, bioplasticsProductHref } from "@/lib/bioplastics/navigation";

export const metadata = { title: "BIOplastics Products" };

const documents = [
  ["Firm Deck catalog", "FirmDeckProducts.pdf"],
  ["(q)PCR sealing options", "qPCR_Closure_options.pdf"],
  ["Work rack systems", "Work_rack_systems.pdf"],
  ["DeBox family", "DeBoxFamily.pdf"],
  ["Filtertips", "filtertips.pdf"],
];

export default async function BioplasticsCatalogPage({ searchParams }: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
}) {
  const { category, q } = await searchParams;
  const current = BIOPLASTICS_CATEGORIES.find(({ key }) => key === category);
  const query = typeof q === "string" ? q.trim() : "";
  const products = searchBioplasticsProducts(query, current?.key);
  return (
    <BioplasticsFrame category={current?.key}>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{current?.label ?? "All products"}</h2>
      <form action={BIOPLASTICS_ROOT} className="my-6 flex flex-wrap gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
        {current && <input type="hidden" name="category" value={current.key} />}
        <label htmlFor="bioplastics-search" className="sr-only">Search BIOplastics</label>
        <input id="bioplastics-search" type="search" name="q" defaultValue={query} placeholder="Product name or catalog number" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm" />
        <button className="rounded-lg bg-amber-900 px-5 text-sm font-semibold text-white hover:bg-amber-950">Search</button>
      </form>
      <p className="mb-4 text-sm text-slate-600" role="status">{products.length} listed {products.length === 1 ? "product" : "products"}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="bg-amber-50 text-amber-950"><tr>
            {["Image", "Cat.No", "Product", "Package"].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(product => (
              <tr key={product.sku}>
                <td className="px-4 py-2">{product.image && <Image src={product.image} alt="" width={48} height={48} unoptimized className="size-12 object-contain" />}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-amber-950">{product.sku}</td>
                <th scope="row" className="px-4 py-3 font-semibold text-slate-950">
                  <Link href={bioplasticsProductHref(product.sku)} className="underline-offset-4 hover:underline">{product.title}</Link>
                  {product.group && <p className="mt-1 text-xs font-normal text-slate-600">{product.group}</p>}
                </th>
                <td className="px-4 py-3 text-slate-600">{product.pack || "—"}</td>
              </tr>
            ))}
            {!products.length && <tr><td colSpan={4} className="px-4 py-6 text-slate-600">No products match this search.</td></tr>}
          </tbody>
        </table>
      </div>
      {!current && !query && (
        <section className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xl font-semibold text-slate-950">Technical documents</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {documents.map(([label, file]) => (
              <li key={file}><a href={`https://www.bioplastics.com/downloads/${file}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-amber-900 underline underline-offset-4">{label} (PDF)</a></li>
            ))}
          </ul>
        </section>
      )}
    </BioplasticsFrame>
  );
}
