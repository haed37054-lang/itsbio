// app/products/abm/[[...path]]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Breadcrumb from "@/components/site/Breadcrumb";
import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";
import HtmlContent from "@/components/site/HtmlContent";
import AbmStagedCatalog from "@/components/products/AbmStagedCatalog";
import AbmHeroBanner from "@/components/products/AbmHeroBanner";
import AbmCatalogSideNav from "@/components/products/AbmCatalogSideNav";
import AbmCellularSidebar from "@/components/products/AbmCellularSidebar";
import AbmServiceLanding from "@/components/products/AbmServiceLanding";
import AbmViralKitGuide from "@/components/products/AbmViralKitGuide";
import AbmTiterKitLanding, { TITER_KITS, TITER_PATH } from "@/components/products/AbmTiterKitLanding";
import { AbmPackagingVideo, AbmPackagingPublications } from "@/components/products/AbmPackagingMedia";
import { stripUnwantedAbmNav } from "@/lib/abm/category-html";
import { abmCategoryLabel } from "@/lib/abm/category-labels";
import { restorePackagingMixesBlocks } from "@/lib/abm/packaging-mixes";
import expressionLibraryLandings from "@/data/abm-expression-library-landings.json";
import generalLandings from "@/data/abm-general-landings.json";
import AbmGeneralLanding from "@/components/products/AbmGeneralLanding";
import { normalizeAbmGeneralSidebar } from "@/lib/abm/general-navigation";
import AbmLibraryMediaClient from "@/components/products/AbmLibraryMediaClient";
import AbmCategorySideNav from "@/components/products/AbmCategorySideNav";
import { buildTreeFromDescendants, buildTreeFromAllCategories, normalizeAbmCellularSidebar, normalizeAbmGeneticSidebar, includeVerifiedSpecializedVectorPages, findTreeNodeByPath, normalizeAbmGeneticNavLabel, type CatLite, type TreeNode } from "@/lib/abm/sidebar-tree";
import {
  ABM_PRODUCT_GROUPS,
  ABM_SERVICE_GROUPS,
  abmRecordBelongsToGroup,
  abmRecordBelongsToProductPath,
  abmRecordBelongsToServicePath,
  abmServiceCategoryHref,
  findAbmCatalogGroup,
  findAbmServiceCategory,
  type AbmCatalogGroup,
} from "@/lib/abm/catalog-taxonomy";
import {
  getAbmStagedCatalogNumbers,
  getAbmStagedRecordCount,
  getAbmStagedRecords,
  getAbmStagedServiceLanding,
  isManagedAbmImageUrl,
} from "@/lib/abm/rebuild-staging";
import { internalizeAbmHref } from "@/lib/abm/internal-links";
import {
  abmResourceImagePath,
  abmResourcePagePath,
  isOfficialAbmResourceImageUrl,
} from "@/lib/abm/resource-links";
import { extractAbmTableCatalogNumbers } from "@/lib/abm/table-catalog";
import "../abm-3d-landing.css";
import "../abm-cellular-category.css";
import "../abm-crispr-official.css";
import "../abm-crispr-source.css";
import "../abm-titer-official.css";
import "../abm-library-source.css";
import "../abm-library-official.css";
import "../abm-general-source.css";
import "../abm-general-reviewed.css";

export const revalidate = 300;

// ✅ ABM는 루트 3갈래만 루트로 취급 (루트 오염 방지)
const ABM_ROOTS = ["general-materials", "cellular-materials", "genetic-materials"] as const;
const KENT_MENU_TITLE = "General Lab Equipment";


const PAGE_SHELL = "mx-auto max-w-[1320px] px-6";
const CONTENT_LAYOUT = "grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)]";

const TARGETED_APOPTOSIS_PATH = [
  "genetic-materials",
  "specialized-vectors",
  "targeted-cell-apoptosis-adenoviruses",
];

const VERIFIED_TARGETED_APOPTOSIS_HTML = `
  <p>abm’s unique Adenoviruses provide a targeted clean-up step for iPSC workflows, enabling inducible, selective depletion of non-reprogrammed and off-target cells. These recombinant adenoviruses transiently deliver a construct in which a cell type-specific promoter drives expression of an inducible caspase.</p>
  <p>After transduction, addition of the small molecule Rimiducid (AP1903) or AP20187 activates apoptosis specifically in targeted cell populations, resulting in efficient depletion of residual somatic cells and enrichment of a purified iPSC population.</p>
  <table>
    <thead><tr><th>Product Name</th><th>Cat. No.</th><th>Quantity</th><th>Titer</th></tr></thead>
    <tbody>
      <tr><td><a href="https://www.abmgood.com/CMV-Control-Apoptosis-Adenovirus-G3000.html">CMV Control Apoptosis Adenovirus</a></td><td><a href="https://www.abmgood.com/CMV-Control-Apoptosis-Adenovirus-G3000.html">G3000</a></td><td>1.0 ml</td><td>1 × 10<sup>6</sup> pfu/ml</td></tr>
      <tr><td><a href="https://www.abmgood.com/Endothelial-Apoptosis-Adenovirus-G3001.html">Endothelial Apoptosis Adenovirus</a></td><td><a href="https://www.abmgood.com/Endothelial-Apoptosis-Adenovirus-G3001.html">G3001</a></td><td>1.0 ml</td><td>1 × 10<sup>6</sup> pfu/ml</td></tr>
      <tr><td><a href="https://www.abmgood.com/Epithelial-Apoptosis-Adenovirus-G3002.html">Epithelial Apoptosis Adenovirus</a></td><td><a href="https://www.abmgood.com/Epithelial-Apoptosis-Adenovirus-G3002.html">G3002</a></td><td>1.0 ml</td><td>1 × 10<sup>6</sup> pfu/ml</td></tr>
    </tbody>
  </table>
  <h3>Mechanism</h3>
  <p><img src="https://www.abmgood.com/assets/images/tinymce/Targeted-Cell-Apoptosis-Adenovirus-Workflow.jpg" alt="Targeted Cell Apoptosis Adenovirus workflow" /></p>
  <h3>Supporting Data</h3>
  <p>Coming soon</p>
`;

type Theme = {
  accentBg: string;
  accentText: string;
  accentBorder: string;
  accentSoftBg: string;
  accentActiveBg: string;
  accentActiveText: string;
  accentDotBg: string;
  accentDotBorder: string;
  accentUnderline: string;
};

const THEME_ORANGE: Theme = {
  accentBg: "bg-orange-500",
  accentText: "text-orange-600",
  accentBorder: "border-orange-200",
  accentSoftBg: "bg-orange-50",
  accentActiveBg: "bg-orange-100",
  accentActiveText: "text-orange-700",
  accentDotBg: "bg-orange-500",
  accentDotBorder: "border-orange-200",
  accentUnderline: "text-orange-700",
};

const THEME_KENT: Theme = {
  accentBg: "bg-blue-600",
  accentText: "text-blue-700",
  accentBorder: "border-blue-200",
  accentSoftBg: "bg-blue-50",
  accentActiveBg: "bg-blue-50",
  accentActiveText: "text-blue-800",
  accentDotBg: "bg-blue-600",
  accentDotBorder: "border-blue-200",
  accentUnderline: "text-blue-700",
};

function getTheme(brandKey: string): Theme {
  return brandKey === "kent" ? THEME_KENT : THEME_ORANGE;
}

function buildHref(brandKey: string, path: string[]) {
  return path.length ? `/products/${brandKey}/${path.join("/")}` : `/products/${brandKey}`;
}

function humanizeSegment(seg: string) {
  if (seg === "RNAi-shRNA-sirna-shrna-rnai-lentivirus") return "siRNA";
  return (seg || "").replaceAll("-", " ").replaceAll("_", " ").trim();
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

function stripBrandSuffix(title: string) {
  const raw = decodeHtmlEntities((title || "").trim());
  const idx = raw.indexOf("|");
  return (idx >= 0 ? raw.slice(0, idx) : raw).trim();
}

function legacyHref(brandKey: string, url: string) {
  if (brandKey === "abm") {
    return internalizeAbmHref(url, "https://www.abmgood.com");
  }
  return `/products/${brandKey}/legacy?u=${encodeURIComponent(url)}`;
}

function escapeHtml(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeNextImageSrc(src: string) {
  if (!src) return false;
  return src.startsWith("https://cdn.sanity.io/") || src.startsWith("/");
}

/** -------------------- GROQ (✅ 1회 호출) -------------------- */

const PAGE_QUERY = `
{
  "brand": *[
    _type == "brand"
    && (themeKey == $brandKey || slug.current == $brandKey)
  ][0]{
    _id, title, themeKey, "slug": slug.current
  },

  "roots": *[
    _type == "category"
    && (!defined(isActive) || isActive == true)
    && (
      brandSlug == $brandKey
      || themeKey == $brandKey
      || brand->themeKey == $brandKey
      || brand->slug.current == $brandKey
    )
    && count(path) == 1
    && ($isAbm == false || path[0] in $abmRoots)
  ]
  | order(order asc, title asc) {
    _id, title, path, order, sourceUrl
  },

  "descendants": select(
    $isKent => *[
      _type == "category"
      && (!defined(isActive) || isActive == true)
      && (
        brandSlug == $brandKey
        || themeKey == $brandKey
        || brand->themeKey == $brandKey
        || brand->slug.current == $brandKey
      )
      && count(path) > 1
      && ($isAbm == false || path[0] in $abmRoots)
    ]
    | order(order asc, title asc) {
      _id, title, path, order, sourceUrl
    },

    $hasActiveRoot => *[
      _type == "category"
      && (!defined(isActive) || isActive == true)
      && (
        brandSlug == $brandKey
        || themeKey == $brandKey
        || brand->themeKey == $brandKey
        || brand->slug.current == $brandKey
      )
      && count(path) > 1
      && path[0] == $activeRoot
      && ($isAbm == false || path[0] in $abmRoots)
    ]
    | order(order asc, title asc) {
      _id, title, path, order, sourceUrl
    },

    []
  ),

  "category": select(
    $hasPath => *[
      _type == "category"
      && (!defined(isActive) || isActive == true)
      && (
        brandSlug == $brandKey
        || themeKey == $brandKey
        || brand->themeKey == $brandKey
        || brand->slug.current == $brandKey
      )
      && array::join(path, "/") == $pathStr
      && ($isAbm == false || path[0] in $abmRoots)
    ][0]{
      _id,
      title,
      path,
      sourceUrl,
      summary,
      legacyHtml,
      contentBlocks[] { _key,_type,title,html,items[] },
      blocks[] { _key,_type,title,html,items[] }
    },
    null
  ),

  "products": select(
    $isKent && $hasPath => *[
      _type=="product"
      && isActive==true
      && (
        brandSlug == $brandKey
        || brand->slug.current == $brandKey
        || brand->themeKey == $brandKey
      )
      && defined(categoryPath)
      && categoryPath == $pathArr
    ]
    | order(title asc) {
      _id,
      title,
      sku,
      "slug": slug.current,
      "thumb": imageUrls[0],
      sourceUrl,
      enrichedAt
    },
    []
  )
}
`;

function CategoryLinkRail({ brandKey, nodes }: { brandKey: string; nodes: TreeNode[] }) {
  if (!nodes.length) return null;
  return (
    <nav className="mt-4 flex flex-wrap items-center gap-y-2 text-base font-semibold" aria-label="Subcategories">
      {nodes.map((node, index) => (
        <span key={node.key} className="flex items-center">
          {index ? <span className="mx-2 text-neutral-800" aria-hidden>|</span> : null}
          <Link href={node.href || buildHref(brandKey, node.path)} prefetch={false} className="text-[#1386ac] hover:underline hover:underline-offset-4">
            {stripBrandSuffix(node.title)}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function isTrustedAbmResourceImageUrl(value?: string) {
  if (!value) return false;
  if (isManagedAbmImageUrl(value)) return true;
  return isOfficialAbmResourceImageUrl(value);
}

function trustedAbmResourceImageSrc(value?: string) {
  if (!value) return "";
  return isManagedAbmImageUrl(value) ? value : abmResourceImagePath(value);
}

/** -------------------- HTML rewrite -------------------- */

function getBaseUrlForBrand(brandKey: string) {
  if (brandKey === "abm") return "https://www.abmgood.com";
  if (brandKey === "kent") return "https://www.kentscientific.com";
  return "";
}

function rewriteRelativeUrls(html: string, baseUrl: string) {
  if (!html) return "";
  if (!baseUrl) return html;

  let out = html.replace(
    /\s(href|src)=["'](\/(?!\/)[^"']*)["']/gi,
    (_m, attr, p) => ` ${attr}="${baseUrl}${p}"`
  );
  out = out.replace(/\s(href|src)=["'](\/\/[^"']+)["']/gi, (_m, attr, p2) => ` ${attr}="https:${p2}"`);
  return out;
}

function rewriteAnchorsToLegacy(html: string, brandKey: string) {
  if (!html) return "";
  return html.replace(/\shref=["'](https?:\/\/[^"']+)["']/gi, (_m, url) => {
    return ` href="${legacyHref(brandKey, url)}"`;
  });
}

function safeHtmlForRender(html: string, brandKey: string) {
  const baseUrl = getBaseUrlForBrand(brandKey);
  let out = html || "";
  if (brandKey === "abm") out = stripUnwantedAbmNav(out);
  if (/class="abm-(?:sirna|library)-official"/.test(out)) return out.trim();
  if (brandKey === "abm") {
    out = out.replace(/<li\b[^>]*>(?:(?!<\/li>)[\s\S])*Wholesale\s+Prices?(?:(?!<\/li>)[\s\S])*<\/li>/gi, "");
    out = out.replace(/Wholesale\s+Prices?/gi, "");
  }
  out = rewriteRelativeUrls(out, baseUrl);
  out = rewriteAnchorsToLegacy(out, brandKey);
  return out.trim();
}

/** -------------------- UI -------------------- */

function HeroBanner({ brandTitle }: { brandTitle: string }) {
  return <AbmHeroBanner title={`${brandTitle} Products & Services`} />;
}

function CatalogGroupGrid({ groups, counts }: { groups: AbmCatalogGroup[]; counts?: Map<string, number> }) {
  return (
    <div className="mt-5 border-y border-neutral-300">
      {groups.map((group) => (
        <Link
          key={`${group.kind}-${group.slug}`}
          href={group.href}
          prefetch={true}
          className="group grid gap-2 border-b border-neutral-200 px-3 py-5 transition last:border-b-0 hover:bg-orange-50/70 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center md:gap-6"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
              {group.kind === "product" ? "Product category" : "Service category"}
            </span>
            <h3 className="mt-1 text-lg font-semibold leading-7 text-neutral-900 group-hover:text-orange-700 group-hover:underline group-hover:underline-offset-4">{group.title}</h3>
          </div>
          <p className="text-sm leading-6 text-neutral-600">{group.description}</p>
          <div className="flex items-center gap-3 text-sm font-semibold text-orange-700">
            {counts?.has(group.slug) ? <span className="whitespace-nowrap text-xs font-medium text-neutral-500">{counts.get(group.slug)?.toLocaleString()} items</span> : null}
            <span className="text-lg transition group-hover:translate-x-1" aria-hidden>›</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** -------------------- contentBlocks renderer -------------------- */

function normalizeResourceItems(rawItems: any[]) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .filter(Boolean)
    .map((it: any, i: number) => {
      const href = typeof it?.href === "string" ? it.href.trim() : "";
      const title = typeof it?.title === "string" ? it.title.trim() : "";
      const subtitle = typeof it?.subtitle === "string" ? it.subtitle.trim() : "";
      const imageUrl = typeof it?.imageUrl === "string" ? it.imageUrl.trim() : "";
      const verifiedImageUrl = /EOS iPSC Reporters/i.test(title) && /EOS-Reporters\.pdf/i.test(href)
        ? "https://www.abmgood.com/assets/images/tinymce/j5zfRZ4xL0WljzG25jjKGvpOAC3XvNRB2toUgb8P.png"
        : imageUrl;

      return {
        key: it?._key || `${title}-${href}-${i}`,
        title: title || "(untitled)",
        subtitle,
        href,
        imageUrl: verifiedImageUrl,
        imageFit: it?.imageFit === "contain" ? "contain" as const : "cover" as const,
      };
    })
    .filter((x) => x.href);
}

function normalizePubItems(rawItems: any[]) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .filter(Boolean)
    .map((it: any, i: number) => {
      const order = typeof it?.order === "number" ? it.order : undefined;
      const citation = typeof it?.citation === "string" ? it.citation.trim() : "";
      const doi = typeof it?.doi === "string" ? it.doi.trim() : "";
      const product = typeof it?.product === "string" ? it.product.trim() : "";

      return {
        key: it?._key || `${order ?? i}-${citation.slice(0, 16)}`,
        order,
        citation,
        doi,
        product,
      };
    })
    .filter((x) => x.citation);
}

function normalizeBullets(rawItems: any[]) {
  const arr = Array.isArray(rawItems) ? rawItems : [];
  return arr
    .map((x: any) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .filter((t: string) => !/^resources?$|^top\s*publications$/i.test(t));
}

function BulletsSection({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <ul className="list-disc space-y-2 pl-5 text-neutral-800 leading-7">
        {items.map((t, i) => (
          <li key={`${t}-${i}`}>{t}</li>
        ))}
      </ul>
    </section>
  );
}

type CellularPresentation = "" | "collections" | "rich" | "catalog" | "editorial" | "article";

function getCellularPresentation(pathStr: string, html: string): CellularPresentation {
  if (!pathStr.startsWith("cellular-materials")) return "";
  if (pathStr.startsWith("cellular-materials/3d-and-organoid/3d-culture-platforms")) return "";
  if (pathStr.startsWith("cellular-materials/3d-and-organoid/3dcelmatrix")) return "";

  // Cell Library pages already have their own bespoke renderer and styling.
  if (pathStr.startsWith("cellular-materials/cell-library-collections")) return "";

  if (/\bcollections-page\b/i.test(html)) return "collections";
  if (/\b(?:lp-wrap|coating-page|stem-page)\b/i.test(html)) return "rich";
  if (/<table\b/i.test(html)) return "catalog";
  if (/\babm-categories-text\b/i.test(html)) return "editorial";
  return "article";
}

function HtmlBlock({
  html,
  brandKey,
  landingVariant = "",
  cellularPresentation = "",
  productCatalogNumbers,
  serviceCatalogNumbers = [],
}: {
  html: string;
  brandKey: string;
  landingVariant?: "" | "platforms" | "matrix";
  cellularPresentation?: CellularPresentation;
  productCatalogNumbers?: string[];
  serviceCatalogNumbers?: string[];
}) {
  const cleaned = safeHtmlForRender(html, brandKey);
  if (!cleaned) return null;
  const landingFidelity = Boolean(landingVariant);
  const embeddedCellularLanding = cellularPresentation === "collections" || cellularPresentation === "rich";
  const cleanedText = cleaned.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
  const officialCrisprContent = brandKey === "abm" && /CRISPR Genome Editing Tools and Services|CRISPR Knockout sgRNA Vectors & Viruses|CRISPR Activation & Repression|Cas9 Expression Vectors and Viruses|Cas Proteins & CRISPR Screening/i.test(cleanedText);
  const className = landingFidelity
    ? `abm-3d-landing abm-3d-${landingVariant}`
    : cellularPresentation
      ? `abm-cellular-category abm-cellular-${cellularPresentation}`
      : officialCrisprContent
        ? "abm-crispr-official"
        : undefined;

  const content = (
    <HtmlContent
      html={cleaned}
      mode={landingFidelity || embeddedCellularLanding || officialCrisprContent ? "abm-landing" : brandKey === "abm" ? "abm-detail" : "default"}
      className={className}
      productCatalogNumbers={productCatalogNumbers}
      serviceCatalogNumbers={serviceCatalogNumbers}
    />
  );
  return (
    <section className={landingFidelity || embeddedCellularLanding || officialCrisprContent || /class="abm-library-official"/.test(cleaned) ? "mt-0" : cellularPresentation ? "mt-6" : "mt-8"}>
      {/class="abm-library-official"/.test(cleaned) ? <AbmLibraryMediaClient>{content}</AbmLibraryMediaClient> : content}
    </section>
  );
}

function ResourceSection({
  items,
  brandKey,
  theme,
  title = "Resource",
}: {
  items: Array<{ key: string; title: string; subtitle?: string; href: string; imageUrl?: string; imageFit?: "contain" | "cover" }>;
  brandKey: string;
  theme: Theme;
  title?: string;
}) {
  const safeItems = items.filter((x) => typeof x?.href === "string" && x.href.trim().length > 0);
  if (!safeItems.length) return null;

  return (
    <section className="mt-10">
      <h3 className={`text-2xl font-bold ${theme.accentText}`}>{title}</h3>

      <div className="mt-4 grid gap-x-7 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
        {safeItems.map((x) => (
          <Link key={x.key} href={legacyHref(brandKey, x.href)} prefetch={false} className="block">
            <div className="bg-white">
              {isTrustedAbmResourceImageUrl(x.imageUrl) ? <div className="overflow-hidden bg-neutral-100">
                <div className="relative aspect-[16/9] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={trustedAbmResourceImageSrc(x.imageUrl)} alt={x.title} className={`absolute inset-0 h-full w-full ${x.imageFit === "contain" ? "object-contain" : "object-cover"}`} loading="lazy" />
                </div>
              </div> : null}

              <div className="pt-2">
                <div className="line-clamp-2 text-base font-bold leading-snug text-neutral-900 hover:text-[#dc5a2b]">
                  {stripBrandSuffix(x.title)}
                </div>
                <div className="mt-2 line-clamp-1 text-sm italic text-neutral-600">{x.subtitle || "Learning Resources"}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TopPublicationsSection({
  items,
  theme,
}: {
  items: Array<{ key: string; order?: number; citation?: string; doi?: string; product?: string }>;
  theme: Theme;
}) {
  const safeItems = items.filter((x) => typeof x?.citation === "string" && x.citation.trim().length > 0);
  if (!safeItems.length) return null;

  const sorted = [...safeItems].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return (
    <section className="mt-14">
      <h3 className={`text-2xl font-semibold ${theme.accentText}`}>Top Publications</h3>

      <div className="mt-5 border-y border-neutral-300">
        {sorted.map((p, idx) => {
          const no = String(p.order ?? idx + 1).padStart(2, "0");
          return (
            <div key={p.key} className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 border-b border-neutral-200 bg-white px-2 py-4 last:border-b-0">
              <div className={`text-xl font-semibold ${theme.accentText}`}>{no}</div>
              <div className="min-w-0">
                <div className="whitespace-pre-line text-sm leading-6 text-neutral-900">{p.citation}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function renderContentBlocks(
  blocks: any[],
  brandKey: string,
  theme: Theme,
  landingVariant: "" | "platforms" | "matrix" = "",
  cellularPresentation: CellularPresentation = "",
  hideResources = false,
  productCatalogNumbers?: string[],
  serviceCatalogNumbers: string[] = [],
) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  let renderedHtml = false;
  let renderedResources = false;
  let renderedPubs = false;
  let renderedBullets = false;

  return (
    <>
      {blocks.map((b: any) => {
        const type = b?._type;

        if (brandKey === "abm" && type === "contentBlockAbmPackagingVideo") {
          return <AbmPackagingVideo key={b._key} />;
        }
        if (brandKey === "abm" && type === "contentBlockAbmPackagingPublications") {
          return <AbmPackagingPublications key={b._key} />;
        }

        if (type === "contentBlockHtml") {
          if (renderedHtml) return null;
          renderedHtml = true;
          const html = typeof b?.html === "string" ? b.html : "";
          return (
            <HtmlBlock
              key={b._key || "html"}
              html={html}
              brandKey={brandKey}
              landingVariant={landingVariant}
              cellularPresentation={cellularPresentation}
              productCatalogNumbers={productCatalogNumbers}
              serviceCatalogNumbers={serviceCatalogNumbers}
            />
          );
        }

        if (type === "contentBlockBullets") {
          if (renderedBullets) return null;
          renderedBullets = true;
          const items = normalizeBullets(b?.items ?? []);
          return (
            <div key={b._key || "bullets"}>
              <BulletsSection items={items} />
            </div>
          );
        }

        if (type === "contentBlockResources") {
          if (renderedResources) return null;
          renderedResources = true;
          if (hideResources) return null;
          const items = normalizeResourceItems(b?.items ?? []);
          return (
            <div key={b._key || "resources"}>
              <ResourceSection items={items} brandKey={brandKey} theme={theme} title={b.title || "Resource"} />
            </div>
          );
        }

        if (type === "contentBlockPublications") {
          if (renderedPubs) return null;
          renderedPubs = true;
          const items = normalizePubItems(b?.items ?? []);
          return (
            <div key={b._key || "pubs"}>
              <TopPublicationsSection items={items} theme={theme} />
            </div>
          );
        }

        return null;
      })}
    </>
  );
}

/** -------------------- Page -------------------- */

export default async function AbmProductsPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }> | { path?: string[] };
  searchParams?: Promise<{ open?: string; q?: string; page?: string }> | { open?: string; q?: string; page?: string };
}) {
  const resolved = await Promise.resolve(params as any);
  const sp = await Promise.resolve(searchParams as any);

  const openSlug = (sp?.open ?? "").toString().trim();
  const stagedQuery = (sp?.q ?? "").toString().trim();
  const stagedPage = Math.max(1, Number.parseInt((sp?.page ?? "1").toString(), 10) || 1);
  const brandKey: string = "abm";
  const theme = getTheme(brandKey);
  const isKent = brandKey === "kent";

  const path = (resolved?.path ?? []) as string[];
  const activeRoot = path[0] || "";
  const hasPath = path.length > 0;
  const hasActiveRoot = !!activeRoot;
  const pathStr = path.join("/");
  if (pathStr === "genetic-materials/expression-ready-libraries/RNAi-shRNA-sirna-shrna-rnai-lentivirus") {
    redirect("/products/abm/genetic-materials/expression-ready-libraries/sirna");
  }

  const data = await sanityCdnClient.fetch(PAGE_QUERY, {
    brandKey,
    isKent,
    isAbm: brandKey === "abm",
    abmRoots: ABM_ROOTS,
    hasPath,
    hasActiveRoot,
    activeRoot,
    pathArr: path,
    pathStr,
  }, PUBLIC_CATALOG_CACHE);

  const brand = data?.brand;
  if (!brand?._id) notFound();

  const roots: CatLite[] = Array.isArray(data?.roots) ? data.roots : [];
  const descendants: CatLite[] = Array.isArray(data?.descendants) ? data.descendants : [];
  let category = data?.category || null;
  const generalLanding = generalLandings.landings.find((landing) =>
    path[0] === landing.root && path.slice(1).join("/") === landing.key);
  if (generalLanding) {
    category = {
      ...(category || {}),
      _id: category?._id || `reviewed-general-${generalLanding.key}`,
      path,
      sourceUrl: generalLanding.sourceUrl,
      contentBlocks: [{ _key: "reviewed-general-landing", _type: "contentBlockHtml", html: generalLanding.html }],
    };
  }
  if (pathStr === TARGETED_APOPTOSIS_PATH.join("/")) {
    category = {
      ...(category || {}),
      _id: category?._id || "verified-targeted-cell-apoptosis-adenoviruses",
      title: "Targeted Cell Apoptosis Adenoviruses",
      path: TARGETED_APOPTOSIS_PATH,
      sourceUrl: "https://www.abmgood.com/Targeted-Cell-Apoptosis-Adenoviruses.html",
      contentBlocks: [{
        _key: "verified-targeted-cell-apoptosis-content",
        _type: "contentBlockHtml",
        html: VERIFIED_TARGETED_APOPTOSIS_HTML,
      }],
    };
  }

  const productsInCategory: Array<{
    _id: string;
    title: string;
    sku?: string;
    slug: string;
    thumb?: string;
  }> = Array.isArray(data?.products) ? data.products : [];
  let activeRootTree: TreeNode[] = [];
  if (isKent) {
    activeRootTree = buildTreeFromAllCategories(roots, descendants);
  } else if (activeRoot) {
    activeRootTree = buildTreeFromDescendants([activeRoot], descendants);
    if (activeRoot === "cellular-materials") {
      activeRootTree = normalizeAbmCellularSidebar(activeRootTree);
    } else if (activeRoot === "genetic-materials") {
      activeRootTree = includeVerifiedSpecializedVectorPages(normalizeAbmGeneticSidebar(activeRootTree));
    } else if (activeRoot === "general-materials") {
      activeRootTree = normalizeAbmGeneralSidebar(activeRootTree);
    }
  }

  const activePageNode = path.length > 1 ? findTreeNodeByPath(activeRootTree, path) : undefined;
  if (activePageNode?.href && activePageNode.href !== buildHref(brandKey, path)) {
    redirect(activePageNode.href);
  }
  const childCategoryNodes = path.length === 1 ? activeRootTree : activePageNode?.children || [];
  const categoryRailNodes = pathStr === "genetic-materials/crispr"
    ? childCategoryNodes.map((node) => normalizeAbmGeneticNavLabel(node.title) === normalizeAbmGeneticNavLabel("CRISPR Activation Vectors")
      ? { ...node, title: "CRISPR Activation/Repression" }
      : node)
    : childCategoryNodes;
  const isProductListPage = path.length >= 3 || (path.length > 1 && childCategoryNodes.length === 0);
  const isPrimaryAntibodyPage = pathStr === "general-materials/antibodies/primary-antibodies";
  const stagedProductsInCategory = !generalLanding && isProductListPage && ABM_ROOTS.includes(path[0] as (typeof ABM_ROOTS)[number])
    ? (await getAbmStagedRecords("product")).filter((record) => {
        if (isPrimaryAntibodyPage) {
          const antibodyCategory = `${record.searchCategory || ""} ${record.filterTitle || ""}`;
          return /antibod/i.test(antibodyCategory) && !/secondary/i.test(antibodyCategory);
        }
        return abmRecordBelongsToProductPath(record, path, category?.title || humanizeSegment(path.at(-1) || ""));
      })
    : [];

  const stagedKind = path[0] === "products" ? "product" : path[0] === "services" ? "service" : null;
  if (stagedKind) {
    const groups = stagedKind === "product" ? ABM_PRODUCT_GROUPS : ABM_SERVICE_GROUPS;
    const selectedGroup = findAbmCatalogGroup(stagedKind, path[1]);
    const servicePath = stagedKind === "service" ? path.slice(1) : [];
    const selectedServiceNode = stagedKind === "service" ? findAbmServiceCategory(servicePath) : undefined;
    if (path.length > 1 && !selectedGroup) notFound();
    if (stagedKind === "service" && path.length > 1 && !selectedServiceNode) notFound();
    if (stagedKind === "product" && path.length > 2) notFound();
    const shouldLoadRecords = Boolean(stagedQuery || selectedGroup || selectedServiceNode);
    const stagedRecords = shouldLoadRecords ? await getAbmStagedRecords(stagedKind) : [];
    const visibleRecords = stagedQuery
      ? stagedRecords
      : stagedKind === "service" && servicePath.length
        ? stagedRecords.filter((record) => abmRecordBelongsToServicePath(record, servicePath))
        : selectedGroup
          ? stagedRecords.filter((record) => abmRecordBelongsToGroup(record, selectedGroup))
          : [];
    const serviceLanding = selectedServiceNode ? await getAbmStagedServiceLanding(servicePath) : undefined;
    const groupCounts = shouldLoadRecords
      ? new Map(groups.map((group) => [
          group.slug,
          stagedRecords.filter((record) => abmRecordBelongsToGroup(record, group)).length,
        ]))
      : undefined;
    const selectedTitle = stagedQuery
      ? `Search results for “${stagedQuery}”`
      : selectedServiceNode?.title || selectedGroup?.title;
    const selectedDescription = stagedQuery
      ? `Matching ABM ${stagedKind === "product" ? "products" : "services"} from the staged catalog.`
      : selectedServiceNode && "description" in selectedServiceNode && typeof selectedServiceNode.description === "string"
        ? selectedServiceNode.description
        : selectedGroup?.description;
    const breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: brand.title, href: "/products/abm" },
      { label: stagedKind === "product" ? "Products" : "Services", href: `/products/abm/${path[0]}` },
      ...(stagedKind === "service" && servicePath.length
        ? servicePath.map((_, index) => {
            const nodePath = servicePath.slice(0, index + 1);
            const node = findAbmServiceCategory(nodePath);
            return { label: node?.title || humanizeSegment(nodePath.at(-1) || ""), href: abmServiceCategoryHref(nodePath) };
          })
        : selectedGroup ? [{ label: selectedGroup.title, href: selectedGroup.href }] : []),
    ];

    return (
      <div>
        <HeroBanner brandTitle={brand.title} />
        <div className={PAGE_SHELL}>
          <div className="mt-4"><Breadcrumb items={breadcrumbItems} /></div>
          <div className={`mt-5 pb-14 ${CONTENT_LAYOUT}`}>
            <aside className="relative z-[40] self-start lg:sticky lg:top-24">
              <AbmCatalogSideNav
                mode={stagedKind}
                activeProductRoot={stagedKind === "product" ? selectedGroup?.slug : ""}
                activeServicePath={servicePath}
              />
            </aside>

            <main className="min-w-0">
              {!serviceLanding?.html ? (
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">ABM {stagedKind}</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
                      {selectedTitle || (stagedKind === "product" ? "Product Categories" : "Service Categories")}
                    </h1>
                    <p className="mt-3 max-w-3xl leading-7 text-neutral-600">
                      {selectedDescription || (stagedKind === "product"
                        ? "Choose one of the three official ABM Product roots. Each root opens the preserved category landing and its hierarchy."
                        : "Choose one of the three official ABM Service roots. Each root opens its complete landing hierarchy and reviewed service offerings.")}
                    </p>
                  </div>
                  <Link href="/products/abm" className="text-sm font-semibold text-orange-700 underline underline-offset-4">ABM overview</Link>
                </div>
              ) : null}

              {serviceLanding?.html ? (
                <>
                  <h1 className="mb-7 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
                    {selectedTitle || "ABM Service"}
                  </h1>
                  <AbmServiceLanding html={serviceLanding.html} />
                </>
              ) : null}

              {selectedServiceNode?.children?.length ? (
                <section className="mt-10" aria-labelledby="service-subcategories">
                  <h2 id="service-subcategories" className="text-2xl font-semibold text-neutral-900">Service Categories</h2>
                  <div className="mt-5 border-y border-neutral-300">
                    {selectedServiceNode.children.map((child) => {
                      const childPath = [...servicePath, child.slug];
                      return (
                        <Link
                          key={childPath.join("/")}
                          href={abmServiceCategoryHref(childPath)}
                          prefetch={false}
                          className="group flex items-center justify-between gap-4 border-b border-neutral-200 px-3 py-4 transition last:border-b-0 hover:bg-orange-50/70"
                        >
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Service category</p>
                            <h3 className="mt-1 text-base font-semibold leading-6 text-neutral-900 group-hover:text-orange-700 group-hover:underline group-hover:underline-offset-4">{child.title}</h3>
                          </div>
                          <span className="text-lg text-orange-600 transition group-hover:translate-x-1" aria-hidden>›</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {selectedGroup || selectedServiceNode || stagedQuery ? (
                <>
                  <div className="mt-10 border-t border-neutral-200 pt-8">
                    <Link href={`/products/abm/${path[0]}`} className="text-sm font-semibold text-orange-700 underline underline-offset-4">
                      ← All {stagedKind === "product" ? "Product" : "Service"} categories
                    </Link>
                  </div>
                  {stagedKind === "service" && serviceLanding?.html && !stagedQuery && visibleRecords.length === 0 ? null : (
                    <AbmStagedCatalog
                      kind={stagedKind}
                      records={visibleRecords}
                      query={stagedQuery}
                      page={stagedPage}
                      basePath={`/products/abm/${path.join("/")}`}
                    />
                  )}
                </>
              ) : (
                <CatalogGroupGrid groups={groups} counts={groupCounts} />
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!path.length) {
    const [stagedProductCount, stagedServiceCount] = await Promise.all([
      getAbmStagedRecordCount("product"),
      getAbmStagedRecordCount("service"),
    ]);
    const breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: brand.title, href: `/products/${brandKey}` },
    ];

    return (
      <div>
        <HeroBanner brandTitle={brand.title} />

        <div className={PAGE_SHELL}>
          <div className="mt-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div className={`mt-5 ${CONTENT_LAYOUT}`}>
            <aside className="relative z-[40] self-start lg:sticky lg:top-24">
              <AbmCategorySideNav
                brandKey={brandKey}
                roots={roots}
                activePath={[]}
                activeRootTree={activeRootTree}
                theme={theme}
                isKentMode={isKent}
              />
            </aside>

            <main className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">ABM Products & Services</h1>
              <p className="mt-3 max-w-3xl leading-7 text-neutral-700">
                Browse the official hierarchy for ABM Products and Services. Category landing content, resources, images, and reviewed detail pages remain inside ITS BIO.
              </p>

              <section className="mt-10" aria-labelledby="abm-product-categories">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-600">Products</p>
                    <h3 id="abm-product-categories" className="mt-1 text-2xl font-semibold text-neutral-900">Product Categories</h3>
                  </div>
                  <Link href="/products/abm/products" className="text-sm font-semibold text-orange-700 underline underline-offset-4">
                    {stagedProductCount.toLocaleString()} catalog records
                  </Link>
                </div>
                <CatalogGroupGrid groups={ABM_PRODUCT_GROUPS} />
              </section>

              <section className="mt-12 border-t border-neutral-200 pt-10" aria-labelledby="abm-service-categories">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-600">Services</p>
                    <h3 id="abm-service-categories" className="mt-1 text-2xl font-semibold text-neutral-900">Service Categories</h3>
                  </div>
                  <Link href="/products/abm/services" className="text-sm font-semibold text-orange-700 underline underline-offset-4">
                    {stagedServiceCount.toLocaleString()} service offerings
                  </Link>
                </div>
                <CatalogGroupGrid groups={ABM_SERVICE_GROUPS} />
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!category?._id && (!activeRootTree || activeRootTree.length === 0)) notFound();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: brand.title, href: `/products/${brandKey}` },
    ...(isKent ? [{ label: KENT_MENU_TITLE, href: `/products/${brandKey}` }] : []),
    ...path.map((seg: string, i: number) => ({
      label: brandKey === "abm"
        ? abmCategoryLabel(buildHref(brandKey, path.slice(0, i + 1)), findTreeNodeByPath(activeRootTree, path.slice(0, i + 1))?.title || ABM_PRODUCT_GROUPS.find((group) => group.slug === seg && i === 0)?.title || humanizeSegment(seg))
        : humanizeSegment(seg),
      href: buildHref(brandKey, path.slice(0, i + 1)),
    })),
  ];

  const pageTitle = brandKey === "abm"
    ? abmCategoryLabel(buildHref(brandKey, path), activePageNode?.title || ABM_PRODUCT_GROUPS.find((group) => group.slug === pathStr)?.title || stripBrandSuffix(category?.title || humanizeSegment(path.at(-1) || "")))
    : stripBrandSuffix(category?.title || humanizeSegment(path.at(-1) || ""));
  const is3dLandingFidelity = brandKey === "abm" && [
    "cellular-materials/3d-and-organoid/3d-culture-platforms",
    "cellular-materials/3d-and-organoid/3dcelmatrix",
  ].includes(path.join("/"));
  const landingVariant: "" | "platforms" | "matrix" = is3dLandingFidelity
    ? path.at(-1) === "3dcelmatrix" ? "matrix" : "platforms"
    : "";

  const blocks = Array.isArray(category?.contentBlocks)
    ? category.contentBlocks
    : Array.isArray(category?.blocks)
      ? category.blocks
      : [];
  const legacyHtml = typeof category?.legacyHtml === "string" ? category.legacyHtml.trim() : "";
  const populatedHtmlBlock = blocks.find(
    (block: any) => block?._type === "contentBlockHtml" && typeof block?.html === "string" && block.html.trim(),
  );
  const primaryHtml = populatedHtmlBlock?.html || legacyHtml;
  const originalBlocksForRender = populatedHtmlBlock
    ? blocks
    : primaryHtml
      ? [{ _key: "legacy-html-fallback", _type: "contentBlockHtml", html: primaryHtml }, ...blocks]
      : blocks;
  const libraryLanding = expressionLibraryLandings.find((landing) => pathStr === ["genetic-materials", "expression-ready-libraries", landing.key].filter(Boolean).join("/"));
  const blocksForRender = libraryLanding
    ? [{ _key: "verified-expression-library-landing", _type: "contentBlockHtml", html: libraryLanding.html }]
    : brandKey === "abm"
    ? restorePackagingMixesBlocks(pathStr, originalBlocksForRender)
    : originalBlocksForRender;
  const cellularPresentation = getCellularPresentation(pathStr, typeof primaryHtml === "string" ? primaryHtml : "");
  const hasEmbeddedCellularHero = cellularPresentation === "collections" || cellularPresentation === "rich";
  const officialCrisprPaths = new Set([
    "genetic-materials/crispr",
    "genetic-materials/crispr/crispr-ko-vectors-and-virus",
    "genetic-materials/crispr/crispr-activation-vectors",
    "genetic-materials/crispr/cas9-vectors-and-virus",
    "genetic-materials/crispr/cas-proteins-and-crispr-screening",
  ]);
  const primaryText = String(primaryHtml || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");
  const hasEmbeddedCrisprHero = officialCrisprPaths.has(pathStr)
    && /CRISPR Genome Editing Tools and Services|CRISPR Knockout sgRNA Vectors & Viruses|CRISPR Activation & Repression|Cas9 Expression Vectors and Viruses|Cas Proteins & CRISPR Screening/i.test(primaryText);
  const hasEmbeddedCategoryHero = hasEmbeddedCellularHero || hasEmbeddedCrisprHero || Boolean(libraryLanding);
  const hideDuplicateCas9Resources = pathStr === "genetic-materials/crispr/cas9-vectors-and-virus";
  const isTiterLanding = brandKey === "abm" && pathStr === TITER_PATH;
  const hasEmbeddedProductTable = Boolean(generalLanding) || isTiterLanding || blocksForRender.some((block: any) => {
    const html = typeof block?.html === "string" ? block.html : "";
    return /<table\b/i.test(html) && /Product\s+(?:List|Name)|Cat\.?\s*No\.?/i.test(html);
  });
  const tableHtml = blocksForRender
    .map((block: any) => typeof block?.html === "string" ? block.html : "")
    .filter(Boolean)
    .join("\n");
  const tableCatalogNumbers = generalLanding
    ? []
    : isTiterLanding
    ? TITER_KITS.map((kit) => kit.sku)
    : brandKey === "abm" && hasEmbeddedProductTable
    ? extractAbmTableCatalogNumbers(tableHtml)
    : [];
  const tableCatalogKeys = new Set(tableCatalogNumbers.map((sku) => sku.toLowerCase()));
  const [allProductCatalogNumbers, allServiceCatalogNumbers] = tableCatalogNumbers.length
    ? await Promise.all([
        getAbmStagedCatalogNumbers("product"),
        getAbmStagedCatalogNumbers("service"),
      ])
    : [[], []];
  const productCatalogNumbers = tableCatalogNumbers.length
    ? allProductCatalogNumbers.filter((sku) => tableCatalogKeys.has(sku.toLowerCase()))
    : undefined;
  const serviceCatalogNumbers = tableCatalogNumbers.length
    ? allServiceCatalogNumbers.filter((sku) => tableCatalogKeys.has(sku.toLowerCase()))
    : [];

  const fallbackHtmlRaw = blocksForRender.length
    ? ""
    : category?.summary
      ? `<p>${escapeHtml(category.summary)}</p>`
      : "";

  const fallbackHtml = fallbackHtmlRaw ? safeHtmlForRender(fallbackHtmlRaw, brandKey) : "";

  return (
    <div>
      <HeroBanner brandTitle={brand.title} />

      <div className={PAGE_SHELL}>
        <div className="mt-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className={`mt-5 ${CONTENT_LAYOUT}`}>
          <aside className="relative z-[40] self-start lg:sticky lg:top-24">
            {activeRoot === "cellular-materials" ? (
              <AbmCellularSidebar activePath={path} />
            ) : (
              <AbmCategorySideNav
                brandKey={brandKey}
                roots={roots}
                activePath={path}
                activeRootTree={activeRootTree}
                theme={theme}
                isKentMode={isKent}
              />
            )}
          </aside>

          <main className="min-w-0">
            {!is3dLandingFidelity && !hasEmbeddedCategoryHero && !isTiterLanding ? <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{pageTitle}</h1> : null}
            {!is3dLandingFidelity && !hasEmbeddedCategoryHero && !isTiterLanding ? <CategoryLinkRail brandKey={brandKey} nodes={categoryRailNodes} /> : null}

            {isKent && productsInCategory.length ? (
              <div className="mt-6">
                <div className="text-sm font-semibold text-neutral-900">Products</div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {productsInCategory.map((p) => {
                    const isOpen = openSlug && p.slug === openSlug;
                    return (
                      <Link
                        key={p._id}
                        href={`/products/${brandKey}/item/${encodeURIComponent(p.slug)}`}
                        prefetch={false}
                        className={`group flex items-center gap-3 rounded-2xl border bg-white p-3 hover:shadow-sm ${
                          isOpen ? `${theme.accentBorder} ring-1 ${theme.accentSoftBg}` : "border-slate-200"
                        }`}
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-50">
                          {p.thumb ? (
                            isSafeNextImageSrc(p.thumb) ? (
                              <Image src={p.thumb} alt="" fill className="object-contain" sizes="48px" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.thumb}
                                alt=""
                                className="absolute inset-0 h-full w-full object-contain"
                                loading="lazy"
                              />
                            )
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-neutral-900 group-hover:underline">
                            {stripBrandSuffix(p.title)}
                          </div>
                          {p.sku ? <div className="mt-0.5 text-xs text-neutral-600">Cat.No: {p.sku}</div> : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {brandKey === "abm" && !isTiterLanding ? <AbmViralKitGuide path={pathStr} position="before" sourceHtml={tableHtml} /> : null}

            {generalLanding ? <AbmGeneralLanding html={generalLanding.html} className={generalLanding.className} finderProducts={generalLanding.key === "pcr-enzymes/rt-and-rt-pcr" ? generalLandings.finderProducts : undefined} /> : isTiterLanding ? <AbmTiterKitLanding /> : blocksForRender.length ? (
              renderContentBlocks(
                blocksForRender,
                brandKey,
                theme,
                landingVariant,
                cellularPresentation,
                hideDuplicateCas9Resources,
                productCatalogNumbers,
                serviceCatalogNumbers,
              )
            ) : fallbackHtml ? (
              <section className="mt-8">
                <HtmlContent html={fallbackHtml} mode={brandKey === "abm" ? "abm-detail" : "default"} />
                {category?.sourceUrl ? (
                  <div className="mt-4 text-sm">
                    <a
                      className={`font-semibold underline underline-offset-4 ${theme.accentUnderline}`}
                      href={legacyHref(brandKey, category.sourceUrl)}
                    >
                      원문 보기
                    </a>
                  </div>
                ) : null}
              </section>
            ) : (
              <div className={`mt-10 rounded-2xl border ${theme.accentBorder} ${theme.accentSoftBg} p-6 text-sm text-neutral-800`}>
                본문 데이터가 아직 없습니다.
                {category?.sourceUrl ? (
                  <>
                    {" "}
                    <a
                      className={`font-semibold underline underline-offset-4 ${theme.accentUnderline}`}
                      href={legacyHref(brandKey, category.sourceUrl)}
                    >
                      원문 보기
                    </a>
                  </>
                ) : null}
              </div>
            )}

            {brandKey === "abm" && !isTiterLanding ? <AbmViralKitGuide path={pathStr} position="after" sourceHtml={tableHtml} /> : null}

            {isPrimaryAntibodyPage ? (
              <form
                action={`/products/abm/${path.join("/")}`}
                className="mt-6 flex max-w-2xl flex-wrap items-end gap-3"
              >
                <label className="min-w-[220px] flex-1 text-sm font-semibold text-neutral-800">
                  Search our collection using antibody name or catalog number
                  <input
                    name="q"
                    defaultValue={stagedQuery}
                    placeholder="Search primary antibodies"
                    className="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#f2632f]"
                  />
                </label>
                <button
                  type="submit"
                  className="h-11 bg-[#f2632f] px-6 text-sm font-semibold text-white transition hover:bg-[#d95221]"
                >
                  Search
                </button>
              </form>
            ) : null}

            {stagedProductsInCategory.length && !hasEmbeddedProductTable ? (
              <section className="mt-10" aria-label="ABM product list">
                <AbmStagedCatalog
                  kind="product"
                  records={stagedProductsInCategory}
                  query={stagedQuery}
                  page={stagedPage}
                  basePath={`/products/abm/${path.join("/")}`}
                  hideSearch={isPrimaryAntibodyPage}
                />
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
