import AimsCatalog from "@/components/products/aims/AimsCatalog";
export const metadata={title:"AIMS Lab Products",description:"Surgery and procedure boards, warming equipment, CO₂ systems, rodent restraints and stereotaxic lighting from AIMS Lab Products."};
export default async function AimsPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}) {return <AimsCatalog filters={await searchParams} />;}
