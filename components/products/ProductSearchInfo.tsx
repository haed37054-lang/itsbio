import { absoluteSiteUrl } from "@/lib/site-url";
import { productSearchDescription, productSearchIdentity, productSearchImage, searchText, type ProductSearchInfo as SearchInfo } from "@/lib/product-search";

export default function ProductSearchInfo({ info, brandHref }: { info: SearchInfo; brandHref: string }) {
  const image = productSearchImage(info.image);
  const url = absoluteSiteUrl(info.path);
  // Quote-only products have no public offer or review data. Describe the page
  // and its breadcrumbs without adding a second visible inquiry section.
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: searchText(info.name),
        description: productSearchDescription(info),
        url,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        ...(info.sku ? { identifier: { "@type": "PropertyValue", propertyID: "Cat.No.", value: searchText(info.sku) } } : {}),
        ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: brandHref === "/products" ? "Products" : info.brand, item: absoluteSiteUrl(brandHref) },
          { "@type": "ListItem", position: 3, name: productSearchIdentity(info), item: url },
        ],
      },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  );
}
