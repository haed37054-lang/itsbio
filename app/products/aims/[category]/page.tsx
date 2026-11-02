import {notFound} from "next/navigation";
import AimsCatalog from "@/components/products/aims/AimsCatalog";
import {AIMS_CATEGORIES} from "@/lib/aims/catalog";
export const dynamicParams=false;
export function generateStaticParams(){return AIMS_CATEGORIES.map(c=>({category:c.slug}));}
export async function generateMetadata({params}:{params:Promise<{category:string}>}){const slug=(await params).category;return{title:`${AIMS_CATEGORIES.find(c=>c.slug===slug)?.title||'Products'} | AIMS Lab Products`};}
export default async function AimsCategoryPage({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<{q?:string;page?:string}>}){const category=(await params).category;if(!AIMS_CATEGORIES.some(c=>c.slug===category))notFound();return <AimsCatalog category={category} filters={await searchParams} />;}
