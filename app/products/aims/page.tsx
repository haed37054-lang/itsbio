import AimsCatalog from "@/components/products/aims/AimsCatalog";
export const metadata={title:"AIMS",description:"Browse AIMS laboratory animal equipment and animal tattoo identification systems."};
export default async function AimsPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}) {return <AimsCatalog filters={await searchParams} />;}
