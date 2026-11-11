import type { Metadata } from "next";
import { absoluteSiteUrl } from "@/lib/site-url";

export type ProductSearchInfo = {
  name: string;
  brand: string;
  path: string;
  sku?: string | null;
  modelNumbers?: readonly string[];
  description?: string | null;
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
  const sku = searchText(info.sku);
  return sku && !name.toLowerCase().includes(sku.toLowerCase()) ? `${name} (${sku})` : name;
}

export function productSearchDescription(info: ProductSearchInfo): string {
  const identity = productSearchIdentity(info);
  const label = productSearchLabel(info.name);
  const models = [...new Set((info.modelNumbers || []).map(searchText).filter(Boolean))];
  const modelText = models.length ? ` 모델·Cat.No.: ${models.slice(0, 4).join(", ")}${models.length > 4 ? " 외" : ""}.` : "";
  const description = `${info.brand} ${identity}${label ? ` · ${label}` : ""}. 이츠바이오 국내 ${info.kind === "service" ? "서비스" : "제품"} 정보·견적 문의.${modelText} ${searchText(info.description)}`;
  const chars = Array.from(description.trim());
  return chars.length > 240 ? `${chars.slice(0, 239).join("")}…` : description.trim();
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
  const title = `${identity}${label && !identity.includes(label) ? ` · ${label}` : ""} | ${info.brand} | 이츠바이오`;
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
