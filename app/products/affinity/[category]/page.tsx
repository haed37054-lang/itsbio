import { notFound } from "next/navigation";
import AffinityCatalog, { type AffinityFilters } from "@/components/products/affinity/AffinityCatalog";
import { AFFINITY_CATEGORIES } from "@/lib/affinityimmuno/catalog";
export async function generateMetadata({params}:{params:Promise<{category:string}>}) {const category=(await params).category;return {title:`${AFFINITY_CATEGORIES.find(c=>c.slug===category)?.title || "Products"} | AffinityImmuno`};}
export default async function AffinityCategoryPage({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<AffinityFilters>}) {
  const {category}=await params;if(!AFFINITY_CATEGORIES.some(c=>c.slug===category))notFound();
  return <AffinityCatalog category={category} filters={await searchParams} />;
}
