import legacyWordPressRedirects from "@/data/legacy-wordpress-redirects.json";
import kentCurrentTaxonomy from "@/data/kent-current-taxonomy.json";
import { ABM_PRODUCT_GROUPS } from "@/lib/abm/catalog-taxonomy";
import { thistlePromotions } from "@/lib/thistle-promotions";
import { CELLFREE_PRODUCTS } from "@/lib/cellfree/catalog";
import { BIOPLASTICS_PRODUCTS } from "@/lib/bioplastics/catalog";
import { bioplasticsProductHref } from "@/lib/bioplastics/navigation";
import { cellFreeProductHref } from "@/lib/cellfree/navigation";
import { PLASLABS_CATEGORIES, PLASLABS_PRODUCTS, plasLabsCategoryHref, plasLabsProductHref } from "@/lib/plaslabs/catalog";
import { AIMS_PRODUCTS, AIMS_CATEGORIES, aimsProductHref } from "@/lib/aims/catalog";
import { DOGEN_CATEGORIES, DOGEN_PRODUCTS, dogenCategoryHref, dogenProductHref } from "@/lib/dogen/catalog";
import { ANIMAL_ID_PRODUCTS, animalIdProductHref } from "@/lib/animalid/catalog";
import { AFFINITY_ALL_PRODUCTS, AFFINITY_CATEGORIES, affinityProductHref, affinityCategoryHref } from "@/lib/affinityimmuno/catalog";
import type { MetadataRoute } from "next";
import { SEEDBURO_PRODUCTS, SEEDBURO_COLLECTIONS, seedburoProductHref, seedburoCollectionHref } from "@/lib/seedburo/catalog";

import { OFFICIAL_ABM_CELL_MODEL_PRODUCTS } from "@/lib/abm/cell-model-data";
import { ABM_REBUILD_VERSION, VERIFIED_EXPRESSION_SYSTEM_PRODUCTS, isNonProductCatalogTool, isInvalidCollectedDetail, stagedRecordPath, type AbmStagedRecord } from "@/lib/abm/rebuild-staging";
import { CLEAVER_CATEGORIES } from "@/lib/cleaver/catalog";
import { getCleaverSitemapProductPaths } from "@/lib/cleaver/sanity";
import { absoluteSiteUrl } from "@/lib/site-url";
import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";

type SlugRow = { slug?: string; updatedAt?: string };
type AbmDetailRow = { sku: string; title: string; sourceUrl?: string };

const ABM_PRODUCT_DETAILS = `
  *[_type == "abmRebuildDetailChunk" && version == $version && kind == "product"]
    .records[key == "product:" + lower(sku) && sku != "" && defined(title) && coalesce(sourceUnavailable, false) == false]{
      sku, title, sourceUrl
    }
`;

const CORE_ROUTES = [
  "/", "/products", "/products/abm", "/products/kent", "/about", "/contact", "/quote", "/notice", "/promotions", "/privacy", "/terms",
  ...ABM_PRODUCT_GROUPS.map(({ href }) => href),
  "/products/thistle", "/products/seedburo", "/products/aims", "/products/animalid", "/products/bioplastics", "/products/cellfree", "/products/itschem", "/products/plaslabs", "/products/affinity", "/products/dogen",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [abmProducts, abmServices, abmDetails, kentProducts, cleaverProductPaths, notices, promotions] = await Promise.all([
    sanityCdnClient.fetch<AbmStagedRecord[]>(`*[_type == "abmRebuildChunk" && version == $version && kind == "product"].records[lower(sku) != "coa"]{ kind, sku, title, url }`, { version: ABM_REBUILD_VERSION }, PUBLIC_CATALOG_CACHE),
    sanityCdnClient.fetch<AbmStagedRecord[]>(`*[_type == "abmRebuildChunk" && version == $version && kind == "service"].records[]{ kind, sku, title, url }`, { version: ABM_REBUILD_VERSION }, PUBLIC_CATALOG_CACHE),
    sanityCdnClient.fetch<AbmDetailRow[]>(ABM_PRODUCT_DETAILS, { version: ABM_REBUILD_VERSION }, PUBLIC_CATALOG_CACHE),
    sanityCdnClient.fetch<SlugRow[]>(`*[_type == "product" && (!defined(isActive) || isActive == true) && (brandSlug == "kent" || brand->slug.current == "kent") && lower(slug.current) in $slugs]{ "slug": slug.current, "updatedAt": _updatedAt }`, { slugs: kentCurrentTaxonomy.products.map(({ slug }) => slug.toLowerCase()) }, PUBLIC_CATALOG_CACHE),
    getCleaverSitemapProductPaths(),
    sanityCdnClient.fetch<SlugRow[]>(`*[_type == "notice" && (!defined(isActive) || isActive == true) && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }`, {}, PUBLIC_CATALOG_CACHE),
    sanityCdnClient.fetch<SlugRow[]>(`*[_type == "promotion" && (!defined(isActive) || isActive == true) && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }`, {}, PUBLIC_CATALOG_CACHE),
  ]);

  const now = new Date();
  const entries: MetadataRoute.Sitemap = CORE_ROUTES.map((path) => ({
    url: absoluteSiteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" || path === "/products" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/products") ? 0.8 : 0.6,
  }));

  const abmRecords: AbmStagedRecord[] = [
    ...abmProducts.filter((record) => !isNonProductCatalogTool(record)),
    ...Object.values(VERIFIED_EXPRESSION_SYSTEM_PRODUCTS),
    ...abmServices,
    ...OFFICIAL_ABM_CELL_MODEL_PRODUCTS.map((row) => ({ kind: "product" as const, sku: row.sku || "", title: row.title, url: row.url })),
    ...abmDetails.filter((row) => !isInvalidCollectedDetail(row)).map((row) => ({
      kind: "product" as const, sku: row.sku, title: row.title, url: row.sourceUrl || "",
    })),
  ];
  const seenAbm = new Set<string>();
  for (const record of abmRecords) {
    const path = stagedRecordPath(record.kind, record);
    const key = path.toLowerCase();
    if (seenAbm.has(key)) continue;
    seenAbm.add(key);
    entries.push({ url: absoluteSiteUrl(path), changeFrequency: "monthly", priority: 0.7 });
  }

  for (const { categoryPath, count } of kentCurrentTaxonomy.categories) {
    if (count <= 0) continue;
    const [root, section, leaf] = categoryPath;
    const canonicalPath = root === "anesthesia" && section === "anesthesia-accessories" && /^anesthesia-accessories-for-(somnoflo|somnosuite|vetflo)$/.test(leaf || "")
      ? [root, leaf]
      : categoryPath;
    entries.push({ url: absoluteSiteUrl(`/products/kent/${canonicalPath.map(encodeURIComponent).join("/")}`) });
  }
  for (const row of kentProducts) if (row.slug) entries.push({ url: absoluteSiteUrl(`/products/kent/item/${row.slug.split("/").map(encodeURIComponent).join("/")}`), lastModified: row.updatedAt, changeFrequency: "monthly", priority: 0.7 });
  for (const category of CLEAVER_CATEGORIES) {
    entries.push({ url: absoluteSiteUrl(`/products/thistle/${category.slug}`), changeFrequency: "monthly", priority: 0.7 });
    for (const child of category.children) entries.push({ url: absoluteSiteUrl(`/products/thistle/${category.slug}/${child.slug}`), changeFrequency: "monthly", priority: 0.7 });
  }
  for (const path of cleaverProductPaths) entries.push({ url: absoluteSiteUrl(path), changeFrequency: "monthly", priority: 0.7 });
  for (const category of AIMS_CATEGORIES) entries.push({url:absoluteSiteUrl(`/products/aims/${category.slug}`),changeFrequency:"monthly",priority:0.65});
  const animalIdSlugs = new Set(ANIMAL_ID_PRODUCTS.map(({ slug }) => slug));
  for (const product of AIMS_PRODUCTS) {
    if (!animalIdSlugs.has(product.slug)) entries.push({ url: absoluteSiteUrl(aimsProductHref(product.slug)), changeFrequency: "monthly", priority: 0.7 });
  }
  for (const category of PLASLABS_CATEGORIES) entries.push({ url: absoluteSiteUrl(plasLabsCategoryHref(category.slug)), changeFrequency: "monthly", priority: 0.65 });
  for (const product of CELLFREE_PRODUCTS) entries.push({ url: absoluteSiteUrl(cellFreeProductHref(product.slug)), changeFrequency: "monthly", priority: 0.7 });
  for (const product of BIOPLASTICS_PRODUCTS) entries.push({ url: absoluteSiteUrl(bioplasticsProductHref(product.sku)), changeFrequency: "monthly", priority: 0.7 });
  for (const product of PLASLABS_PRODUCTS) entries.push({ url: absoluteSiteUrl(plasLabsProductHref(product.slug)), changeFrequency: "monthly", priority: 0.7 });
  for (const category of DOGEN_CATEGORIES) entries.push({ url: absoluteSiteUrl(dogenCategoryHref(category.slug)), changeFrequency: "monthly", priority: 0.65 });
  for (const product of DOGEN_PRODUCTS) entries.push({ url: absoluteSiteUrl(dogenProductHref(product.slug)), changeFrequency: "monthly", priority: 0.7 });
  for (const product of ANIMAL_ID_PRODUCTS) entries.push({ url: absoluteSiteUrl(animalIdProductHref(product.slug)), changeFrequency: "monthly", priority: 0.7 });
  for (const product of AFFINITY_ALL_PRODUCTS) entries.push({ url: absoluteSiteUrl(affinityProductHref(product)), changeFrequency: "monthly", priority: 0.7 });
  for (const category of AFFINITY_CATEGORIES) entries.push({ url: absoluteSiteUrl(affinityCategoryHref(category.slug)), changeFrequency: "monthly", priority: 0.6 });
  for (const product of SEEDBURO_PRODUCTS) entries.push({ url: absoluteSiteUrl(seedburoProductHref(product)), changeFrequency: "monthly", priority: 0.7 });
  for (const category of SEEDBURO_COLLECTIONS) entries.push({ url: absoluteSiteUrl(seedburoCollectionHref(category.handle)), changeFrequency: "monthly", priority: 0.6 });
  for (const path of ["/products/seedburo/all-products", "/products/seedburo/categories"]) entries.push({ url: absoluteSiteUrl(path), changeFrequency: "monthly", priority: 0.6 });
  for (const row of notices) if (row.slug) entries.push({ url: absoluteSiteUrl(`/notice/${encodeURIComponent(row.slug)}`), lastModified: row.updatedAt, changeFrequency: "monthly", priority: 0.5 });
  for (const row of [...promotions, ...thistlePromotions.map(({ slug, publishedAt }) => ({ slug, updatedAt: publishedAt }))]) if (row.slug) entries.push({ url: absoluteSiteUrl(`/promotions/${encodeURIComponent(row.slug)}`), lastModified: row.updatedAt, changeFrequency: "weekly", priority: 0.6 });

  const listedUrls = new Set(entries.map(({ url }) => url));
  for (const destination of [...Object.values(legacyWordPressRedirects.pages), ...Object.values(legacyWordPressRedirects.catalogs)]) {
    const path = destination.split(/[?#]/, 1)[0].replace(/^\/products\/cleaver(?=\/|$)/, "/products/thistle");
    const url = absoluteSiteUrl(path);
    if (listedUrls.has(url)) continue;
    listedUrls.add(url);
    entries.push({ url });
  }

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
