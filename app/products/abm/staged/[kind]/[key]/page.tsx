import { notFound, permanentRedirect } from "next/navigation";

import Breadcrumb from "@/components/site/Breadcrumb";
import AbmHeroBanner from "@/components/products/AbmHeroBanner";
import AbmCatalogSideNav from "@/components/products/AbmCatalogSideNav";
import AbmCellularSidebar from "@/components/products/AbmCellularSidebar";
import ProductGalleryClient from "@/components/products/ProductGalleryClient";
import ProductTabsClient from "@/components/products/ProductTabs";
import AbmCategorySideNav from "@/components/products/AbmCategorySideNav";
import { getAbmProductSidebar } from "@/lib/abm/product-sidebar";
import { resolveAbmProductPath, productCategoryBreadcrumbs } from "@/lib/abm/product-navigation";
import { ABM_PRODUCT_GROUPS, findAbmServicePathForLabels } from "@/lib/abm/catalog-taxonomy";
import { abmResourceImagePath } from "@/lib/abm/resource-links";
import { verifiedMissingAbmVectorUrl } from "@/lib/abm/vector-links";
import {
  getAbmStagedDetail,
  isManagedAbmImageUrl,
  isTrustedSpecialCellReferenceImageUrl,
} from "@/lib/abm/rebuild-staging";

export const revalidate = 300;

// ABM's iPSC Reporter products each have a distinct canonical Vector Design
// Studio map. Keep exact local SVG copies in the existing product gallery so
// the six Cat.No. rows never share a thumbnail or depend on iframe rendering.
const VERIFIED_IPSC_VECTOR_MAP_IDS: Record<string, number> = {};

const VERIFIED_STATIC_VECTOR_IMAGES: Record<string, string> = {
  "000776A": "/images/abm/000776A-vector-map.svg",
  "000774A": "/images/abm/000774A-vector-map.svg",
  "000834A": "/images/abm/000834A-vector-map.svg",
  "000835A": "/images/abm/000835A-vector-map.svg",
  LV028858: "/images/abm/LV028858-vector-map.svg",
  LV028859: "/images/abm/LV028859-vector-map.svg",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function usableIntroHtml(introHtml?: string, description?: string) {
  const intro = String(introHtml || "").trim();

  // ABM's newer Vector product pages place an interactive configuration panel
  // directly after the product heading. Older collectors treated every sibling
  // before the information tabs as "Overview", so configurator controls and
  // modal markup could leak into the migrated overview.
  const contaminated = /product-info-box|\btab-content\b|customize-(?:service|selected|blank|container)|\bbl-dialog\b|confirm-modal-dialog|continue-add-blank-control-dialog/i.test(intro);

  if (intro && !contaminated) return intro;
  return description ? `<p>${escapeHtml(description)}</p>` : "";
}

function collectionListingOverview(title: string, sku?: string, category?: string) {
  const safeTitle = escapeHtml(title);
  const safeSku = escapeHtml(String(sku || ""));
  const safeCategory = escapeHtml(String(category || "Special Cell Line Collection"));
  return `<p><strong>${safeTitle}</strong> is listed in ABM's ${safeCategory}${safeSku ? ` under Cat. No. ${safeSku}` : ""}. The specifications below reproduce the product information available in the official ABM collection.</p>`;
}

export default async function AbmStagedDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; key: string }>;
  searchParams?: Promise<{ name?: string; category?: string; unit?: string; from?: string }>;
}) {
  const [{ kind, key }, fallback] = await Promise.all([params, searchParams]);
  if (kind !== "product" && kind !== "service") notFound();
  const decodedKey = decodeURIComponent(key);
  const [stagedRecord, productSidebar] = await Promise.all([
    getAbmStagedDetail(kind, decodedKey),
    kind === "product" ? getAbmProductSidebar(decodedKey) : Promise.resolve(null),
  ]);
  if (!stagedRecord) {
    const counterpartKind = kind === "product" ? "service" : "product";
    const counterpartRecord = await getAbmStagedDetail(counterpartKind, decodedKey);
    if (counterpartRecord) {
      permanentRedirect(`/products/abm/staged/${counterpartKind}/${encodeURIComponent(decodedKey)}`);
    }
  }
  const fallbackName = String(fallback?.name || "").replace(/\s+/g, " ").trim().slice(0, 240);
  const fallbackCategory = String(fallback?.category || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const fallbackUnit = String(fallback?.unit || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const record = stagedRecord || (kind === "product" && fallbackName ? {
    kind: "product" as const,
    sku: decodedKey,
    title: fallbackName,
    url: "",
    unit: fallbackUnit || undefined,
    category: fallbackCategory || undefined,
    searchCategory: fallbackCategory || undefined,
    hasDetail: false,
    sourceUrl: "",
    images: [],
  } : undefined);
  if (!record) notFound();

  const verifiedVectorFallbackUrl = kind === "product" ? verifiedMissingAbmVectorUrl(record) : "";

  const title = record.title || record.sku || "ABM item";
  const galleryUrls = Array.from(new Set([
    String(record.previewImage || "").trim(),
    ...(record.images || []),
  ].filter((url): url is string =>
    isManagedAbmImageUrl(url) || isTrustedSpecialCellReferenceImageUrl(url)
  )));
  const gallery = galleryUrls.map((url) => ({
    url: isTrustedSpecialCellReferenceImageUrl(url) ? url : abmResourceImagePath(url) || url,
    alt: title,
  }));
  const productSku = String(record.sku || decodedKey).toUpperCase();
  const verifiedStaticVectorImage = kind === "product"
    ? VERIFIED_STATIC_VECTOR_IMAGES[productSku]
    : undefined;
  const vectorMapId = kind === "product" && !verifiedStaticVectorImage
    ? VERIFIED_IPSC_VECTOR_MAP_IDS[productSku]
    : undefined;
  const verifiedVectorGallery = verifiedStaticVectorImage
    ? [{ url: verifiedStaticVectorImage, alt: title }]
    : gallery;
  const hasGallery = Boolean(vectorMapId) || verifiedVectorGallery.length > 0;
  const paths = Array.isArray(record.listingPaths) && record.listingPaths.length
    ? record.listingPaths
    : record.listingFilters?.map((item) => item.path).filter((path): path is string[] => Array.isArray(path) && path.length > 0)
      || (record.filterPath?.length ? [record.filterPath] : []);
  const activeProductRoot = kind === "product"
    ? ABM_PRODUCT_GROUPS.find((group) => paths.some((path) => path.includes(group.title)))?.slug || ""
    : "";
  const activeServicePath = kind === "service"
    ? findAbmServicePathForLabels([...paths.flat(), ...(record.breadcrumbs || [])])
    : [];
  const activeProductPath = productSidebar ? resolveAbmProductPath({
    ...productSidebar,
    paths,
    hints: [...(record.breadcrumbs || []), record.category || "", record.searchCategory || "", record.filterTitle || ""],
    from: fallback?.from,
  }) : [];
  const productBreadcrumbs = productSidebar ? productCategoryBreadcrumbs(productSidebar.trees, activeProductPath) : [];
  const fallbackProductRootBreadcrumbs = kind === "product" && !productBreadcrumbs.length
    ? ABM_PRODUCT_GROUPS.filter((group) => group.slug === activeProductRoot).map((group) => ({ label: group.title, href: group.href }))
    : [];
  const belongsToSpecialCellCollection = paths.some((path) => path.includes("Special Cell Line Collections"));
  const isCollectionTableRecord = record.verification?.source === "official-collection-table"
    || (kind === "product"
      && belongsToSpecialCellCollection
      && !record.introHtml
      && Boolean(record.specificationsHtml)
      && !hasGallery);
  const overviewHtml = usableIntroHtml(record.introHtml, record.description || record.overview)
    || (kind === "product" && isCollectionTableRecord
      ? collectionListingOverview(title, record.sku, record.category || record.searchCategory || record.filterTitle)
      : "");
  const documents = (record.documents || []).map((item) => ({
    url: item.url || item.href || "",
    label: item.title || "Document",
  })).filter((item) => item.url);
  const rawServiceFields = record.serviceOffer?.fields;
  const serviceFields = (Array.isArray(rawServiceFields)
    ? rawServiceFields.map((field) => [field.label || "", field.value || ""] as const)
    : Object.entries(rawServiceFields || {})).filter(([label, value]) => {
    const normalized = label.toLowerCase();
    return value && !/price|cost|amount|currency|cart|quantity|^cat\.?\s*no\.?$|^unit$|^service(?:\s+name)?$/.test(normalized);
  });

  const infoRowClass = "grid grid-cols-[100px_1fr] gap-3 py-4 text-sm";

  return (
    <div className="bg-white">
      <AbmHeroBanner title={title} eyebrow={`ABM ${kind}`} />
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-[1320px] px-6 py-4">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: "ABM", href: "/products/abm" },
            ...productBreadcrumbs,
            ...fallbackProductRootBreadcrumbs,
            { label: title },
          ]} />
        </div>
      </div>

      <main className="mx-auto max-w-[1320px] px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)]">
          <aside className="relative z-[40] self-start lg:sticky lg:top-24">
            {kind === "product" && activeProductPath[0] === "cellular-materials" ? (
              <AbmCellularSidebar activePath={activeProductPath} />
            ) : productSidebar && activeProductPath.length ? (
              <AbmCategorySideNav brandKey="abm" roots={productSidebar.roots}
                activePath={activeProductPath}
                activeRootTree={productSidebar.trees.find((node) => node.path[0] === activeProductPath[0])?.children || []}
                theme={{ accentText: "text-orange-600", accentActiveBg: "bg-orange-100", accentActiveText: "text-orange-700", accentSoftBg: "bg-orange-50" }}
                isKentMode={false} />
            ) : (
              <AbmCatalogSideNav mode={kind} activeProductRoot={activeProductRoot} activeServicePath={activeServicePath} />
            )}
          </aside>

          <section
            className="relative z-0 min-w-0"
            data-product-name={title}
            data-cat-no={record.sku || undefined}
          >
            <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-neutral-950">{title}</h1>

            <div className="mt-6 grid gap-8 border-t border-neutral-200 pt-7 md:grid-cols-[minmax(0,1fr)_400px]">
              {hasGallery ? (
                <div className="min-h-[320px]">
                  <ProductGalleryClient
                    images={vectorMapId ? [] : verifiedVectorGallery}
                    title={title}
                    vectorMap={vectorMapId ? {
                      url: `https://www.abmgood.com/vds/map/cat/${vectorMapId}`,
                      alt: `${title} vector map`,
                    } : undefined}
                  />
                  {!vectorMapId && record.imageCaption ? (
                    <p className="mx-auto mt-3 max-w-[560px] text-center text-xs leading-5 text-neutral-500">
                      {record.imageCaption}{" "}
                      {record.imageCreditUrl ? (
                        <a
                          href={record.imageCreditUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#dc5a2b] underline underline-offset-2"
                        >
                          {record.imageCreditLabel || "Source"}
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="relative mx-auto flex aspect-square w-full max-w-[560px] items-center justify-center overflow-hidden bg-neutral-50 px-8 text-center">
                  <div>
                    <svg aria-hidden="true" viewBox="0 0 48 48" className="mx-auto h-12 w-12 text-neutral-300" fill="none">
                      <rect x="5" y="7" width="38" height="34" rx="4" stroke="currentColor" strokeWidth="2" />
                      <path d="m11 34 9-10 7 7 4-5 6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="33" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-neutral-500">Product image not provided by manufacturer</p>
                  </div>
                </div>
              )}

              <aside className="self-start overflow-hidden rounded-xl border-2 border-[#f2632f] bg-white">
                <div className="border-b border-orange-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#dc5a2b]">{kind === "product" ? "Product Information" : "Service Information"}</h2>
                </div>

                <div>
                  <dl className="px-6 py-2">
                    {kind === "product" ? (
                      <>
                        <div className={infoRowClass}><dt className="font-semibold text-slate-900">Cat. No.</dt><dd className="font-medium text-slate-700">{record.sku || "—"}</dd></div>
                        <div className={infoRowClass}><dt className="font-semibold text-slate-900">Unit</dt><dd className="text-slate-700">{record.unit || "—"}</dd></div>
                        <div className={infoRowClass}><dt className="font-semibold text-slate-900">Category</dt><dd className="text-slate-700">{record.category || record.searchCategory || record.filterTitle || "—"}</dd></div>
                        <div className={infoRowClass}><dt className="font-semibold text-slate-900">Storage</dt><dd className="text-slate-700">{record.storage || "—"}</dd></div>
                      </>
                    ) : null}
                    {kind === "service" && record.sku ? <div className={infoRowClass}><dt className="font-semibold text-slate-900">Cat. No.</dt><dd className="font-medium text-slate-700">{record.sku}</dd></div> : null}
                    {kind === "service" && record.unit ? <div className={infoRowClass}><dt className="font-semibold text-slate-900">Unit</dt><dd className="text-slate-700">{record.unit}</dd></div> : null}
                    {kind === "service" && (record.category || record.searchCategory || record.filterTitle) ? <div className={infoRowClass}><dt className="font-semibold text-slate-900">Category</dt><dd className="text-slate-700">{record.category || record.searchCategory || record.filterTitle}</dd></div> : null}
                    {kind === "service" && record.storage ? <div className={infoRowClass}><dt className="font-semibold text-slate-900">Storage</dt><dd className="text-slate-700">{record.storage}</dd></div> : null}
                    {kind === "service" && serviceFields.map(([label, value]) => (
                      <div key={label} className={infoRowClass}><dt className="font-semibold text-slate-900">{label}</dt><dd className="text-slate-700">{value}</dd></div>
                    ))}
                  </dl>
                </div>
              </aside>
            </div>

            <div className="mt-10 itsbio-product-tabs">
              <ProductTabsClient
                overviewHtml={kind === "service" ? overviewHtml : undefined}
                specsHtml={record.specificationsHtml}
                serviceDetailsHtml={record.serviceDetailsHtml}
                datasheetHtml={record.datasheetHtml}
                documentsHtml={record.documentsHtml}
                faqsHtml={record.faqsHtml}
                referencesHtml={record.referencesHtml}
                reviewsHtml={record.reviewsHtml}
                documents={documents}
                sourceUrl={record.sourceUrl}
                kind={kind}
              />
            </div>

            {!record.hasDetail ? (
              <div className="mt-8 border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <p>This item is in the authoritative ABM inventory. Its reviewed detail is being migrated and will appear here after the complete staging corpus passes validation.</p>
                {verifiedVectorFallbackUrl ? (
                  <a
                    href={verifiedVectorFallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center rounded-md bg-[#f2632f] px-4 py-2 font-semibold text-white no-underline hover:bg-[#d95221]"
                  >
                    View Vector on ABM ↗
                  </a>
                ) : null}
              </div>
            ) : !record.sourceUnavailable && !overviewHtml && !record.specificationsHtml && !record.serviceDetailsHtml ? (
              <div className="mt-8 border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                The reviewed record is available, but the official source does not provide additional detail sections for this item.
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
