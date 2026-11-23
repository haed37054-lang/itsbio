import {notFound} from "next/navigation";
import AimsCatalog from "@/components/products/aims/AimsCatalog";
import {AIMS_CATEGORIES} from "@/lib/aims/catalog";
import { catalogCategoryMetadata } from "@/lib/catalog-category-metadata";
export const dynamicParams=false;
export function generateStaticParams(){return AIMS_CATEGORIES.map(c=>({category:c.slug}));}
export async function generateMetadata({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<{q?:string;page?:string}>}){
  const [{category},query]=await Promise.all([params,searchParams]);
  const entry=AIMS_CATEGORIES.find(c=>c.slug===category);
  if(!entry)return {};
  const page=Number.parseInt(query.page||"1",10);
  return catalogCategoryMetadata({title:entry.title,brand:"AIMS",path:`/products/aims/${entry.slug}${!query.q&&page>1?`?page=${page}`:""}`,
    description:`Browse ${entry.title} from AIMS for laboratory animal research at ITSBio.`,noIndex:Boolean(query.q)});
}
export default async function AimsCategoryPage({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<{q?:string;page?:string}>}){const category=(await params).category;if(!AIMS_CATEGORIES.some(c=>c.slug===category))notFound();return <AimsCatalog category={category} filters={await searchParams} />;}
