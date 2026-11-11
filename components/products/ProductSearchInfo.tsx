import Link from "next/link";
import { absoluteSiteUrl } from "@/lib/site-url";
import { productQuoteHref, productSearchDescription, productSearchIdentity, productSearchImage, productSearchLabel, searchText, type ProductSearchInfo as SearchInfo } from "@/lib/product-search";

export default function ProductSearchInfo({ info, brandHref }: { info: SearchInfo; brandHref: string }) {
  const label = productSearchLabel(info.name);
  const image = productSearchImage(info.image);
  const url = absoluteSiteUrl(info.path);
  // Quote-only products have no public offer or review data. Describe the page
  // and its visible navigation without claiming Product rich-result eligibility.
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
    <section lang="ko" aria-label="국내 제품 문의" className="mt-8 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-600">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <h2 className="font-semibold text-slate-900">국내 {info.kind === "service" ? "서비스" : "제품"} 문의</h2>
      <p className="mt-2 break-words">{info.brand} {productSearchIdentity(info)}{label ? ` · ${label}` : ""}</p>
      <p>{info.kind === "service" ? "견적 요청 시 서비스명과 요청 내용을 알려주세요. 서비스 범위와 조건은 상세 정보를 확인해 주세요." : "견적 요청 시 필요한 모델·Cat.No.와 수량을 알려주세요. 제품 사양과 구성은 상세 정보를 확인해 주세요."}</p>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <Link href={productQuoteHref(info)} className="font-medium text-slate-900 underline underline-offset-4">국내 견적 문의</Link>
        <Link href={brandHref} className="underline underline-offset-4">{info.brand} 제품 목록</Link>
        <Link href="/contact" className="underline underline-offset-4">이츠바이오 연락처</Link>
      </div>
    </section>
  );
}
