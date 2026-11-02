import Image from "next/image";
import Link from "next/link";
import { affinityProductHref, type AffinityProduct } from "@/lib/affinityimmuno/catalog";

export default function AffinityProductCards({products}:{products:AffinityProduct[]}) {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map(product => <Link key={product.slug} href={affinityProductHref(product)} prefetch={false} data-affinity-product-card={product.sku} data-product-slug={product.slug} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-cyan-400 hover:shadow-md">
    <div className="relative aspect-[3/2] overflow-hidden border-b border-slate-100 bg-white"><Image src={product.images[0].url} alt={product.images[0].alt} fill sizes="(max-width: 640px) 90vw, (max-width: 1280px) 45vw, 320px" quality={90} className="object-contain" /></div>
    <div className="flex flex-1 flex-col p-5"><p className="text-[11px] font-semibold tracking-wide text-cyan-900">Cat.No {product.sku}</p><h3 title={product.title} className="mt-2 line-clamp-3 min-h-[4.5rem] text-lg font-semibold leading-6 tracking-tight text-slate-950 group-hover:text-cyan-900">{product.title}</h3>
      <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-600">{product.unit ? <div><dt className="inline font-medium text-slate-800">Size: </dt><dd className="inline">{product.unit}</dd></div>:null}{product.clone ? <div><dt className="inline font-medium text-slate-800">Clone: </dt><dd className="inline">{product.clone}</dd></div>:null}{product.targetSpecies ? <div><dt className="inline font-medium text-slate-800">Reactivity: </dt><dd className="inline">{product.targetSpecies}</dd></div>:null}{product.host ? <div><dt className="inline font-medium text-slate-800">Host: </dt><dd className="inline">{product.host}</dd></div>:null}</dl>
      <span className="mt-auto pt-5 text-sm font-semibold text-cyan-900">View product ›</span>
    </div>
  </Link>)}</div>;
}
