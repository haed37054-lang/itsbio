import { productSearchStructuredData, type ProductSearchInfo as SearchInfo } from "@/lib/product-search";

export default function ProductSearchInfo({ info, brandHref }: { info: SearchInfo; brandHref: string }) {
  // Keep metadata separate from visible copy; never invent offers, prices, or reviews.
  const schema = productSearchStructuredData(info, brandHref);
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  );
}

