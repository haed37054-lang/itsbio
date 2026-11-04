import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BioplasticsFrame from "@/components/products/bioplastics/BioplasticsFrame";
import { BIOPLASTICS_INSTRUMENTS, BIOPLASTICS_PRODUCTS, findBioplasticsProduct } from "@/lib/bioplastics/catalog";
import { bioplasticsProductHref } from "@/lib/bioplastics/navigation";

type Props = { params: Promise<{ sku: string }> };
const supportLabels: Record<string, string> = {
  supported: "Fits in whole or in part",
  cutting: "Tear-off section fits",
  alternative: "Alternative product fits",
  ab17503g: "Grid AB17503G (top-right corner cut)",
  ab19805g: "Grid AB19805G (top-left corner cut)",
  b17489g: "Grid B17489G (bottom-right corner cut)",
  b69304: "Grid B69304 (non-skirted assembly)",
};

export const dynamicParams = false;
export function generateStaticParams() {
  return BIOPLASTICS_PRODUCTS.map(({ sku }) => ({ sku: sku.toLowerCase() }));
}

export async function generateMetadata({ params }: Props) {
  const product = findBioplasticsProduct((await params).sku);
  return product ? {
    title: `${product.title} · ${product.sku} | BIOplastics`,
    alternates: { canonical: bioplasticsProductHref(product.sku) },
  } : {};
}

export default async function BioplasticsProductPage({ params }: Props) {
  const product = findBioplasticsProduct((await params).sku);
  if (!product) notFound();
  const quote = new URLSearchParams({ product: product.title, catNo: product.sku });
  const variants = BIOPLASTICS_PRODUCTS.filter(p =>
    p.sku !== product.sku && p.category === product.category && p.group === product.group && p.family === product.family,
  );
  const instruments = product.fitKey ? BIOPLASTICS_INSTRUMENTS[product.fitKey] : undefined;

  return (
    <BioplasticsFrame category={product.category} title={product.sku}>
      <article>
        <div className={product.image ? "grid items-center gap-7 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : undefined}>
          {product.image && (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-slate-200 p-6">
              <Image src={product.image} alt={`${product.title}, ${product.sku}`} width={150} height={150} unoptimized className="size-[150px] object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">{product.group}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h2>
            {product.configuration && <p className="mt-2 text-sm leading-6 text-slate-600">{product.configuration}</p>}
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm">
              <span className="font-semibold text-amber-950">Cat.No</span> <strong className="ml-2 text-slate-950">{product.sku}</strong>
              {product.pack && <p className="mt-1 text-slate-600">{product.pack}</p>}
            </div>
            <Link href={`/quote?${quote}`} className="mt-4 inline-flex rounded-lg bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-950">Request a Quote</Link>
          </div>
        </div>
        {product.overview && (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-3 text-xl font-semibold text-slate-950">Overview</h3>
            <p className="text-sm leading-7 text-slate-600">{product.overview}</p>
          </section>
        )}
        {(Object.keys(product.specs).length > 0 || product.properties.length > 0) && (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-3 text-xl font-semibold text-slate-950">Specifications</h3>
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              {[...Object.entries(product.specs), ...product.properties].map(([label, value], index) => (
                <div key={`${label}-${index}`} className="grid gap-1 py-3 text-sm sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-semibold text-slate-900">{label}</dt>
                  <dd className="text-slate-600">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {!!variants.length && (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-3 text-xl font-semibold text-slate-950">Other ordering options</h3>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              {variants.map(variant => (
                <li key={variant.sku} className="flex flex-wrap gap-x-3 gap-y-1 py-3 text-sm">
                  <Link href={bioplasticsProductHref(variant.sku)} className="font-semibold text-amber-900 underline underline-offset-4">{variant.sku}</Link>
                  <span className="text-slate-600">{variant.pack || variant.title}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {!!instruments?.length && (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 id="instrument-compatibility" className="mb-3 text-xl font-semibold text-slate-950">Instrument compatibility</h3>
            {product.fitNote && <p className="mb-3 text-sm text-slate-600">{product.fitNote}</p>}
            <div role="region" aria-labelledby="instrument-compatibility" tabIndex={0} className="max-h-[32rem] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 bg-amber-50 text-amber-950"><tr>
                  {["Manufacturer", "Instrument", "Block", "Support"].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {instruments.map(([manufacturer, model, block, markers], index) => (
                    <tr key={`${manufacturer}-${model}-${block}-${index}`}>
                      <td className="px-4 py-3">{manufacturer}</td>
                      <th scope="row" className="px-4 py-3 font-medium text-slate-950">{model}</th>
                      <td className="px-4 py-3">{block}</td>
                      <td className="px-4 py-3">{markers.map(marker => supportLabels[marker] ?? marker.toUpperCase()).join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </article>
    </BioplasticsFrame>
  );
}
