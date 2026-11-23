import { notFound } from "next/navigation";
import AffinityCatalog, { type AffinityFilters } from "@/components/products/affinity/AffinityCatalog";
import { AFFINITY_CATEGORIES } from "@/lib/affinityimmuno/catalog";
import { catalogCategoryMetadata } from "@/lib/catalog-category-metadata";
export async function generateMetadata({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<AffinityFilters>}) {
  const [{category},filters]=await Promise.all([params,searchParams]);
  const entry=AFFINITY_CATEGORIES.find(c=>c.slug===category);
  return entry ? catalogCategoryMetadata({title:entry.title,brand:"AffinityImmuno",path:`/products/affinity/${entry.slug}`,
    description:`Browse ${entry.title} from AffinityImmuno, with research product specifications and catalog numbers at ITSBio.`,
    noIndex:Boolean(filters.q||filters.host||filters.application||filters.clonality||filters.page)}) : {};
}
export default async function AffinityCategoryPage({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<AffinityFilters>}) {
  const {category}=await params;if(!AFFINITY_CATEGORIES.some(c=>c.slug===category))notFound();
  return <AffinityCatalog category={category} filters={await searchParams} />;
}
