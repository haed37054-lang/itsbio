import AffinityCatalog, { type AffinityFilters } from "@/components/products/affinity/AffinityCatalog";
export const metadata = {title:"AffinityImmuno Products",description:"Browse AffinityImmuno ELISA kits and research antibodies by target, clone, application and catalog number."};
export default async function AffinityPage({searchParams}:{searchParams:Promise<AffinityFilters>}) {
  return <AffinityCatalog filters={await searchParams} />;
}
