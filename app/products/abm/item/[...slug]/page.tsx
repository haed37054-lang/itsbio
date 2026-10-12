// app/products/abm/item/[...slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/site/Breadcrumb";
import QuoteTriggerButton from "@/components/site/QuoteTriggerButton";
import { abmResourceImagePath } from "@/lib/abm/resource-links";
import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";


import AbmCategorySideNav from "@/components/products/AbmCategorySideNav";
import AbmCellularSidebar from "@/components/products/AbmCellularSidebar";
import { getAbmProductSidebar } from "@/lib/abm/product-sidebar";
import { resolveAbmProductPath, productCategoryBreadcrumbs } from "@/lib/abm/product-navigation";
import AbmHeroBanner from "@/components/products/AbmHeroBanner";
import ProductGalleryClient from "@/components/products/ProductGalleryClient";
import ProductTabsClient from "@/components/products/ProductTabs";

export const revalidate = 300;

const THEME = {
  accentBg: "bg-orange-500",
  accentText: "text-orange-600",
  accentBorder: "border-orange-200",
  accentSoftBg: "bg-orange-50",
};

function buildHref(brandKey: string, path: string[]) {
  return path.length ? `/products/${brandKey}/${path.join("/")}` : `/products/${brandKey}`;
}

function decodeHtmlEntities(input: string) {
  if (!input) return "";
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&nbsp;", " ");
}

function stripCompanyNoise(input: string) {
  let t = (input || "").trim();
  t = t.replace(/Applied\s+Biological\s+Materials(?:\s*,?\s*Inc\.)?/gi, "");
  t = t.replace(/\(\s*\)/g, "");
  t = t.replace(/\s{2,}/g, " ");
  return t.trim();
}

function stripBrandSuffix(title: string) {
  const raw = decodeHtmlEntities((title || "").trim());
  const idx = raw.indexOf("|");
  const base = (idx >= 0 ? raw.slice(0, idx) : raw).trim();
  return stripCompanyNoise(base);
}

function legacyHref(brandKey: string, url: string) {
  return `/products/${brandKey}/legacy?u=${encodeURIComponent(url)}`;
}

/** ✅ Print 관련만 제거 (wrapper 통삭제 금지) */
function stripPrintFromHtml(html: unknown) {
  let out = typeof html === "string" ? html : "";
  if (!out) return out;

  out = out.replace(
    /<a[^>]*(?:onclick=["'][^"']*print[^"']*["']|href=["'][^"']*print[^"']*["'])[^>]*>[\s\S]*?<\/a>/gi,
    ""
  );
  out = out.replace(
    /<button[^>]*(?:onclick=["'][^"']*print[^"']*["']|class=["'][^"']*print[^"']*["'])[^>]*>[\s\S]*?<\/button>/gi,
    ""
  );
  out = out.replace(/<i[^>]*class=["'][^"']*fa-print[^"']*["'][^>]*>[\s\S]*?<\/i>/gi, "");
  out = out.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, (m) => (m.toLowerCase().includes("print") ? "" : m));
  out = out.replace(/\bPrint\b/gi, "");

  return out;
}

/** ✅ specsHtml 없을 때 fallback (렌더 보정용) */
function extractSpecsTableFromHtml(html: string) {
  if (!html) return "";

  const nearSpecs = html.match(/Specifications[\s\S]{0,5000}?(<table[\s\S]*?<\/table>)/i);
  if (nearSpecs?.[1]) return nearSpecs[1];

  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  for (const t of tables) {
    const low = t.toLowerCase();
    if (low.includes("spec") || low.includes("specification") || low.includes("parameter")) return t;
  }
  if (tables.length) return tables.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return "";
}

/** ✅ ABM 갤러리 노이즈(마케팅/로고/배지/버튼) 제거 */
function isGalleryNoiseUrl(u: string) {
  const s = (u || "").toLowerCase();
  if (!s) return true;

  if (s.includes("request") && s.includes("sample")) return true;
  if (s.includes("request") && s.includes("quote")) return true;
  if (s.includes("intertek")) return true;
  if (s.includes("badge")) return true;
  if (s.includes("icon")) return true;

  if (s.endsWith("/kr.png") || s.includes("/flag") || s.includes("flag-")) return true;
  if (s.includes("abm") && s.includes("logo")) return true;

  if (/-16x11\./.test(s)) return true;
  if (/-229x65\./.test(s)) return true;

  return false;
}

/** -------------------- GROQ -------------------- */

const ITEM_PAGE_QUERY = `
{
  "brand": *[_type == "brand" && (themeKey == $brandKey || slug.current == $brandKey)][0]{
    _id, title, themeKey, "slug": slug.current
  },

  "product": *[
    _type=="product"
    && slug.current == $slug
    && (brand->slug.current==$brandKey || brand->themeKey==$brandKey)
  ][0]{
    _id,
    title,
    "slug": slug.current,
    sku,
    unit,
    storage,
    sourceUrl,
    categoryPath,
    categoryPathTitles,

    specsHtml,
    extraHtml,
    legacyHtml,

    datasheetHtml,
    documentsHtml,
    faqsHtml,
    referencesHtml,
    reviewsHtml,

    docs[]{ title, label, url },

    imageUrls,
    imageFiles,
    images[]{ _key, asset->{ url } },

    enrichedAt
  }
}
`;

type CatLite = { _id: string; title: string; path: string[]; order?: number };

type AbmProductDocument = {
  _id: string;
  title?: string;
  slug: string;
  sku?: string;
  unit?: string;
  storage?: string;
  sourceUrl?: string;
  categoryPath?: string[];
  categoryPathTitles?: string[];
  specsHtml?: string;
  extraHtml?: string;
  legacyHtml?: string;
  datasheetHtml?: string;
  documentsHtml?: string;
  faqsHtml?: string;
  referencesHtml?: string;
  reviewsHtml?: string;
  docs?: Array<{ title?: string; label?: string; url?: string }>;
  imageUrls?: string[];
  images?: Array<{ asset?: { url?: string } }>;
};

type AbmItemBundle = {
  brand?: { _id: string; title: string };
  product?: AbmProductDocument;
  roots?: CatLite[];
  descendants?: CatLite[];
};

/** -------------------- Images normalize (ABM 1:1 우선 + 노이즈 제거) -------------------- */
function normalizeImages(product: AbmProductDocument, title: string) {
  const urls: string[] = Array.isArray(product?.imageUrls)
    ? product.imageUrls.filter((u): u is string => typeof u === "string" && Boolean(u.trim()))
    : [];

  if (urls.length) {
    const cleaned = urls.filter((u) => !isGalleryNoiseUrl(u));
    const seen = new Set<string>();
    return cleaned
      .map((u) => ({ url: abmResourceImagePath(u.trim()) || u.trim(), alt: title }))
      .filter((x) => (seen.has(x.url) ? false : (seen.add(x.url), true)));
  }

  const out: Array<{ url: string; alt: string }> = [];
  if (Array.isArray(product?.images)) {
    for (const im of product.images) {
      const u = im?.asset?.url;
      if (typeof u === "string" && u.trim() && !isGalleryNoiseUrl(u)) out.push({ url: u.trim(), alt: title });
    }
  }
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x.url) ? false : (seen.add(x.url), true)));
}

function specificationValue(html: string, labels: string[]) {
  const acceptedLabels = new Set(labels.map((label) => label.toLowerCase()));
  const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = Array.from(row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi))
      .map((cell) => decodeHtmlEntities(cell[1]
        .replace(/<(?:br|\/p|\/div)\b[^>]*>/gi, " ")
        .replace(/<[^>]*>/g, ""))
        .replace(/\s+/g, " ")
        .trim());
    if (cells.length >= 2 && acceptedLabels.has(cells[0].toLowerCase())) return cells[1];
  }

  return "";
}

/** -------------------- Hero -------------------- */
function HeroBanner({ brandTitle }: { brandTitle: string }) {
  return (
    <section className="relative">
      <div className="relative h-[220px] w-full overflow-hidden md:h-[280px]">
        <Image src="/hero.png" alt="Products hero" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/45 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl items-center px-6">
            <div>
              <div className="text-xs font-semibold tracking-wide text-white/80">ITS BIO</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {stripCompanyNoise(brandTitle)} Product
              </h1>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** -------------------- Page -------------------- */

export default async function AbmProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }> | { slug: string[] };
  searchParams?: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
}) {
  const [resolved, query] = await Promise.all([Promise.resolve(params), Promise.resolve(searchParams)]);

  const brandKey = "abm";
  const slugArr = (resolved?.slug ?? []) as string[];
  const slug = slugArr.join("/");


  if (!slug) notFound();

  const bundle = await sanityCdnClient.fetch<AbmItemBundle>(ITEM_PAGE_QUERY, {
    brandKey,
    slug,
  }, PUBLIC_CATALOG_CACHE);

  const brand = bundle?.brand;
  if (!brand?._id) notFound();

  const product = bundle?.product;
  if (!product?._id) notFound();

  const title = stripBrandSuffix(product?.title || "");
  const catNo = decodeHtmlEntities((product?.sku || "").trim());
  const isCas9CellProduct = /^T\d/i.test(catNo) && /cas9/i.test(title);
  const savedCategoryPath: string[] = Array.isArray(product?.categoryPath) ? product.categoryPath : [];
  const productSidebar = await getAbmProductSidebar(catNo);
  const categoryPath = resolveAbmProductPath({ ...productSidebar, paths: [product.categoryPathTitles || []], hints: [],
    from: query?.from || (savedCategoryPath.length ? buildHref(brandKey, savedCategoryPath)
      : isCas9CellProduct ? "/products/abm/cellular-materials/cell-library-collections/cas9-expressing-cell-lines" : undefined),
  });
  const categoryHref = buildHref(brandKey, categoryPath);
  const sidebar = categoryPath[0] === "cellular-materials" ? <AbmCellularSidebar activePath={categoryPath} />
    : <AbmCategorySideNav brandKey="abm" roots={productSidebar.roots} activePath={categoryPath}
      activeRootTree={productSidebar.trees.find((node) => node.path[0] === categoryPath[0])?.children || []}
      theme={{ accentText: "text-orange-600", accentActiveBg: "bg-orange-100", accentActiveText: "text-orange-700", accentSoftBg: "bg-orange-50" }} isKentMode={false} />;
  const breadcrumbItems = [
    { label: "Home", href: "/" }, { label: "Products", href: "/products" },
    { label: stripCompanyNoise(brand.title), href: `/products/${brandKey}` },
    ...productCategoryBreadcrumbs(productSidebar.trees, categoryPath),
    { label: title, href: `/products/${brandKey}/item/${product.slug}` },
  ];

  const openOriginalUrl =
    typeof product?.sourceUrl === "string" && product.sourceUrl.trim() ? product.sourceUrl.trim() : "";

  const images = normalizeImages(product, title);

  const rawSpecs = typeof product?.specsHtml === "string" && product.specsHtml.trim() ? product.specsHtml : "";
  const rawFallback =
    typeof product?.extraHtml === "string" && product.extraHtml.trim()
      ? product.extraHtml
      : typeof product?.legacyHtml === "string"
      ? product.legacyHtml
      : "";

  const derivedSpecs = rawSpecs ? "" : extractSpecsTableFromHtml(rawFallback);
  const specsHtml = stripPrintFromHtml(rawSpecs || derivedSpecs);

  const datasheetHtml = stripPrintFromHtml(product?.datasheetHtml);
  const documentsHtml = stripPrintFromHtml(product?.documentsHtml);
  const faqsHtml = stripPrintFromHtml(product?.faqsHtml);
  const referencesHtml = stripPrintFromHtml(product?.referencesHtml);
  const reviewsHtml = stripPrintFromHtml(product?.reviewsHtml);

  const documents = Array.isArray(product?.docs)
    ? product.docs
        .map((d) => {
          const url = typeof d?.url === "string" ? d.url.trim() : "";
          const title2 = typeof d?.title === "string" ? d.title.trim() : "";
          const label2 = typeof d?.label === "string" ? d.label.trim() : "";
          if (!url) return null;
          return { url, label: title2 || label2 || "Document" };
        })
        .filter(Boolean)
    : [];

  if (isCas9CellProduct) {
    const unit = product.unit || specificationValue(specsHtml, ["Unit"]);
    const storage = product.storage || specificationValue(specsHtml, ["Storage", "Storage Condition"]);
    const hasGallery = images.length > 0;
    const quoteProduct = `${title}${catNo ? ` — Cat. No. ${catNo}` : ""}`;
    const infoRowClass = hasGallery
      ? "grid grid-cols-[100px_1fr] gap-3 py-4 text-sm"
      : "grid grid-cols-[120px_1fr] gap-3 border-b border-orange-50 py-4 text-sm last:border-b-0";

    return (
      <div className="bg-white">
        <AbmHeroBanner title={title} eyebrow="ABM product" />
        <div className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-[1320px] px-6 py-4">
            <Breadcrumb items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: "ABM", href: "/products/abm" },
              ...productCategoryBreadcrumbs(productSidebar.trees, categoryPath),
              { label: title, href: `/products/abm/item/${encodeURIComponent(product.slug)}` },
            ]} />
          </div>
        </div>

        <main className="mx-auto max-w-[1320px] px-6 py-10">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)]">
            <aside className="self-start lg:sticky lg:top-24">
              {sidebar}
            </aside>

            <section className="min-w-0">
              <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-neutral-950">{title}</h1>

              <div className={[
                "mt-6 grid gap-8 border-t border-neutral-200 pt-7",
                hasGallery ? "md:grid-cols-[minmax(0,1fr)_400px]" : "grid-cols-1",
              ].join(" ")}>
                {hasGallery ? (
                  <div className="min-h-[320px]">
                    <ProductGalleryClient images={images} title={title} />
                  </div>
                ) : null}

                <aside className={`self-start overflow-hidden rounded-xl border-2 border-[#f2632f] bg-white ${hasGallery ? "" : "w-full"}`}>
                  <div className="border-b border-orange-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-[#dc5a2b]">Product Information</h2>
                  </div>

                  <div className={hasGallery ? "" : "md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]"}>
                    <dl className={hasGallery ? "px-6 py-2" : "px-6 py-3 md:border-r md:border-orange-100 md:px-7"}>
                      {catNo ? <div className={infoRowClass}><dt className="font-semibold text-slate-900">Cat. No.</dt><dd className="font-medium text-slate-700">{catNo}</dd></div> : null}
                      {unit ? <div className={infoRowClass}><dt className="font-semibold text-slate-900">Unit</dt><dd className="text-slate-700">{unit}</dd></div> : null}
                      <div className={infoRowClass}><dt className="font-semibold text-slate-900">Category</dt><dd className="text-slate-700">Cas9 Expressing Cell Lines</dd></div>
                      {storage ? <div className={infoRowClass}><dt className="font-semibold text-slate-900">Storage</dt><dd className="text-slate-700">{storage}</dd></div> : null}
                    </dl>

                    <div className={hasGallery ? "border-t border-orange-100 p-5" : "bg-orange-50/35 p-6 md:flex md:flex-col md:justify-center"}>
                      <p className="mb-4 text-sm leading-6 text-slate-600">For availability, lead time, and technical questions, contact ITS BIO.</p>
                      <QuoteTriggerButton
                        product={quoteProduct}
                        className="inline-flex w-full items-center justify-center bg-[#f2632f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d95221]"
                      />
                      <Link href="/contact" className="mt-3 inline-flex w-full items-center justify-center border border-[#f2632f] bg-white px-4 py-3 text-sm font-semibold text-[#dc5a2b] transition hover:bg-orange-50">Contact ITS BIO</Link>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="mt-10 itsbio-product-tabs">
                <ProductTabsClient
                  specsHtml={specsHtml}
                  datasheetHtml={datasheetHtml}
                  documentsHtml={documentsHtml}
                  faqsHtml={faqsHtml}
                  referencesHtml={referencesHtml}
                  reviewsHtml={reviewsHtml}
                  documents={documents.filter((document): document is { url: string; label: string } => Boolean(document))}
                  sourceUrl={openOriginalUrl}
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner brandTitle={brand.title} />

      <div className="mx-auto max-w-6xl px-6">
        <div className="mt-6 flex justify-end">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <main className="mt-10 pb-14">
          <div className="grid gap-8 lg:grid-cols-12">
            <aside className="lg:col-span-4">
              {sidebar}
            </aside>

            <section className="lg:col-span-8">
              <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">{title}</h2>

              {categoryPath.length ? (
                <div className={`mt-3 inline-flex rounded-full ${THEME.accentSoftBg} px-3 py-1 text-xs ${THEME.accentText}`}>
                  Category: {categoryPath.join(" / ")}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={categoryHref}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Back to Category
                </Link>

                {openOriginalUrl ? (
                  <Link
                    href={legacyHref(brandKey, openOriginalUrl)}
                    className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold ${THEME.accentBorder} ${THEME.accentSoftBg} ${THEME.accentText}`}
                  >
                    Open Original
                  </Link>
                ) : null}

              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="p-5">
                  {catNo ? (
                    <div className="mb-4 text-sm">
                      <span className="font-semibold text-neutral-900">Cat. No.</span>
                      <span className="ml-3 text-neutral-800">{catNo}</span>
                    </div>
                  ) : null}

                  <ProductGalleryClient images={images} title={title} />
                </div>

                <div className="h-px bg-neutral-200" />

                <div className="p-5">
                  <div className="itsbio-product-tabs">
                    <ProductTabsClient
                      specsHtml={specsHtml}
                      datasheetHtml={datasheetHtml}
                      documentsHtml={documentsHtml}
                      faqsHtml={faqsHtml}
                      referencesHtml={referencesHtml}
                      reviewsHtml={reviewsHtml}
                      documents={documents.filter((document): document is { url: string; label: string } => Boolean(document))}
                    />
                  </div>
                </div>
              </div>

              <div className="h-10" />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
