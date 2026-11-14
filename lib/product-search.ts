import type { Metadata } from "next";
import { absoluteSiteUrl } from "@/lib/site-url";

export type ProductSearchInfo = {
  name: string;
  brand: string;
  path: string;
  sku?: string | null;
  modelNumbers?: readonly string[];
  description?: string | null;
  descriptionCandidates?: readonly (string | null | undefined)[];
  image?: string | null;
  kind?: "product" | "service";
};

export function searchText(value?: string | null): string {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, " ").trim();
}

// Translate explicit product names only. Accessories must not inherit the
// classification of the instrument mentioned in their compatibility text.
export function productSearchLabel(name: string): string {
  const title = searchText(name).replace(/[®™]/g, "").trim();
  if (/\b(?:accessor(?:y|ies)|replacement|adapter|warrant(?:y|ies)|lids?|seals?|stands?|tips?)\b/i.test(title)) return "";
  const labels: Array<[RegExp, string]> = [
    [/^(?:SomnoSuite|SomnoFlo)$/i, "소동물 마취기"],
    [/^CODA(?:\s+HT)?\s+(?:High Throughput\s+)?(?:Non.?Invasive\s+Blood\s+Pressure\s+)?System$/i, "비침습 혈압 측정 시스템"],
    [/\bELISA\s+(?:assay\s+)?kits?\b/i, "ELISA 키트"],
    [/\b(?:immortalized|stable|primary|knockout)\b.*\b(?:cells|cell line)\b/i, "연구용 세포주"],
    [/\b(?:monoclonal|polyclonal)\s+antibod(?:y|ies)\b/i, "연구용 항체"],
    [/\b(?:PCR|qPCR)\s+plates?\b/i, "PCR 플레이트"],
    [/\b(?:PCR|qPCR)\s+tubes?\b/i, "PCR 튜브"],
    [/\b(?:PCR|qPCR)\s+kits?\b/i, "PCR 키트"],
    [/\bglove\s*box(?:es)?$/i, "글러브 박스"],
    [/\bmoisture\s+(?:meter|tester)s?\b/i, "수분 측정기"],
    [/\b(?:horizontal|vertical)\s+(?:gel\s+)?electrophoresis\s+system\b/i, "전기영동 장비"],
    [/\bribonuclease\s+inhibitor\b/i, "RNase 억제제"],
    [/^ItsAgarose Tablets$/i, "아가로스 정제"],
  ];
  return labels.find(([pattern]) => pattern.test(title))?.[1] || "";
}

export function productSearchIdentity(info: ProductSearchInfo): string {
  const name = searchText(info.name);
  const numbers = productSearchCatalogNumbers(info);
  const sku = numbers.find((number) => number.toLowerCase() === searchText(info.sku).toLowerCase()) || (numbers.length === 1 ? numbers[0] : "");
  const escaped = sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alreadyNamed = sku && new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(name);
  return sku && !alreadyNamed ? `${name} (${sku})` : name;
}

export function productSearchCatalogNumbers(info: ProductSearchInfo): string[] {
  const seen = new Set<string>();
  return [info.sku, ...(info.modelNumbers || [])].flatMap((value) => {
    const number = searchText(value);
    const key = number.toLowerCase();
    if (!number || /^(?:[-–—]|n\/?a)$/i.test(number) || seen.has(key)) return [];
    seen.add(key);
    return [number];
  });
}

// Reuse product copy; section headings and migration placeholders are not descriptions.
export function productSearchExcerpt(...candidates: (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    const html = String(candidate || "");
    const descriptionCell = html.match(/<tr\b[^>]*>\s*<t[dh]\b[^>]*>\s*(?:<[^>]+>\s*)*Description\s*(?:<\/[^>]+>\s*)*<\/t[dh]>\s*<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/i)?.[1];
    const text = searchText(descriptionCell || html.replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, " "));
    if (!text || /^(?:performance|overview|description|specifications?|product information|features|at a glance)[.!:]?$/i.test(text)) continue;
    if (/is listed by abm under|authoritative ABM inventory|reviewed detail is being migrated/i.test(text)) continue;
    return text;
  }
  return "";
}

export function productSearchDescription(info: ProductSearchInfo): string {
  const identity = productSearchIdentity(info);
  const label = productSearchLabel(info.name);
  const models = productSearchCatalogNumbers(info).filter((number) => number.toLowerCase() !== searchText(info.sku).toLowerCase());
  const modelText = models.length ? ` Cat.No.: ${models.slice(0, 4).join(", ")}${models.length > 4 ? " 외" : ""}.` : "";
  const summary = productSearchExcerpt(info.description, ...(info.descriptionCandidates || []));
  const description = `${searchText(info.brand)} ${identity}${label ? ` · ${label}` : ""}.${modelText}${summary ? ` ${summary}` : ""} | 이츠바이오`;
  const chars = Array.from(description.trim());
  return chars.length > 240 ? `${chars.slice(0, 239).join("")}…` : description.trim();
}

export function productSearchStructuredData(info: ProductSearchInfo, brandHref: string) {
  const image = productSearchImage(info.image);
  const url = absoluteSiteUrl(info.path);
  const identifiers = productSearchCatalogNumbers(info).map((value) => ({
    "@type": "PropertyValue", propertyID: "Cat.No.", value,
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`,
        name: searchText(info.name), description: productSearchDescription(info), url,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        ...(identifiers.length ? { identifier: identifiers } : {}),
        ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: brandHref === "/products" ? "Products" : searchText(info.brand), item: absoluteSiteUrl(brandHref) },
          { "@type": "ListItem", position: 3, name: productSearchIdentity(info), item: url },
        ],
      },
    ],
  };
}

export function productQuoteHref(info: ProductSearchInfo): string {
  const query = new URLSearchParams({ product: searchText(info.name) });
  if (info.sku) query.set("catNo", searchText(info.sku));
  return `/quote?${query}`;
}

export function productSearchImage(image?: string | null): string | undefined {
  if (!image) return undefined;
  try {
    const url = new URL(image, absoluteSiteUrl("/"));
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function productSearchMetadata(info: ProductSearchInfo): Metadata {
  const identity = productSearchIdentity(info);
  const label = productSearchLabel(info.name);
  const title = `${identity}${label && !identity.includes(label) ? ` · ${label}` : ""} | ${info.brand} | ITS BIO 이츠바이오`;
  const description = productSearchDescription(info);
  const url = absoluteSiteUrl(info.path);
  const image = productSearchImage(info.image);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url, locale: "ko_KR", siteName: "ITS BIO 이츠바이오", images: image ? [{ url: image, alt: searchText(info.name) }] : [] },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : [] },
  };
}

