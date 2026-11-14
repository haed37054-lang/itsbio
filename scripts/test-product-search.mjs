// Test the shared product metadata without a Next.js server or CMS connection.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const helper = stripTypeScriptTypes(readFileSync(new URL("lib/product-search.ts", root), "utf8"))
  .replace(/^import .*;\s*$/gm, "")
  .replace(/^export /gm, "");
const { productSearchMetadata, productSearchStructuredData, productSearchCatalogNumbers, productSearchIdentity, productSearchDescription, productSearchExcerpt, productQuoteHref } = new Function("absoluteSiteUrl", `${helper}\nreturn { productSearchMetadata, productSearchStructuredData, productSearchCatalogNumbers, productSearchIdentity, productSearchDescription, productSearchExcerpt, productQuoteHref };`)(
  (path) => new URL(path, "https://itsbio.co.kr").href,
);
const breast = { name: "Human Breast FFPE Tissue Section", brand: "ABM", sku: "HS0048", path: "/products/abm/staged/product/HS0048", description: "This tissue was fixed in formalin immediately after excision and carefully embedded in paraffin." };

test("exact product name and Cat.No. are retained in search results and canonical metadata", () => {
  const metadata = productSearchMetadata(breast);
  assert.equal(metadata.title.absolute, "Human Breast FFPE Tissue Section (HS0048) | ABM | 이츠바이오");
  assert.equal(metadata.alternates.canonical, "https://itsbio.co.kr/products/abm/staged/product/HS0048");
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.twitter.description, metadata.description);
  assert.ok(metadata.description.includes(breast.description));
  assert.ok(!metadata.description.includes("국내 제품 정보·견적 문의"));
});

test("a catalog number must match a complete token in the product name", () => {
  assert.equal(productSearchIdentity({ ...breast, name: "HS00480 tissue" }), "HS00480 tissue (HS0048)");
  assert.equal(productSearchIdentity({ ...breast, name: "Tissue (HS0048)" }), "Tissue (HS0048)");
  assert.equal(productSearchIdentity({ ...breast, name: "Tissue", sku: "A+B(1)" }), "Tissue (A+B(1))");
});

test("every variant identifier survives even when the snippet has a short model list", () => {
  const models = Array.from({ length: 12 }, (_, i) => `MODEL-${i + 1}`);
  const info = { name: "Instrument family", brand: "Example", path: "/products/example/item/family", modelNumbers: [...models, " model-1 ", "", "—"] };
  assert.equal(productSearchCatalogNumbers(info).length, 12);
  const page = productSearchStructuredData(info, "/products/example")["@graph"][0];
  assert.deepEqual(page.identifier.map(({ value }) => value), models);
  assert.ok(!JSON.stringify(page).includes('"offers"'));
  assert.ok(!JSON.stringify(page).includes('"aggregateRating"'));
});

test("a single model is included in the title even without a separate parent SKU", () => {
  const info = { ...breast, sku: undefined, modelNumbers: ["HS0048", "hs0048"] };
  assert.equal(productSearchMetadata(info).title.absolute, productSearchMetadata(breast).title.absolute);
});

test("headings fall back to existing product features, not generated specifications", () => {
  const info = { ...breast, name: "EZEE Quantum 8 Refrigerated Centrifuge", brand: "Thistle Scientific", sku: "EZEEQUANT8R", description: "PERFORMANCE", descriptionCandidates: ["Max. RCF 31,127 x g, Max. Capacity 4 x 100 ml"] };
  const description = productSearchDescription(info);
  assert.ok(!description.includes("PERFORMANCE"));
  assert.ok(description.includes("31,127 x g"));
  assert.ok(description.includes("EZEEQUANT8R"));
  assert.equal(productSearchExcerpt("Overview", ""), "");
});

test("ABM specification tables supply the actual Description row", () => {
  const table = '<table><tr><td>Cat. No.</td><td>HS0048</td></tr><tr><td><b>Description</b></td><td>This tissue was fixed in formalin.</td></tr><tr><td>Storage</td><td>4°C</td></tr></table>';
  assert.equal(productSearchExcerpt(table), "This tissue was fixed in formalin.");
  assert.equal(productSearchExcerpt("This item is in the authoritative ABM inventory.", "Existing manufacturer description."), "Existing manufacturer description.");
});

test("markup is stripped and long descriptions respect Unicode boundaries", () => {
  const description = productSearchDescription({ ...breast, description: '<h2>Overview</h2><p>세포 🧪 '.repeat(100) + '</p><script>unwanted()</script>' });
  assert.ok(Array.from(description).length <= 240);
  assert.ok(!description.includes("<"));
  assert.ok(!description.includes("unwanted()"));
  assert.ok(!/[\uD800-\uDBFF]$/.test(description));
});

test("quote parameters and identifiers preserve catalog punctuation", () => {
  const info = { ...breast, sku: "ABC/2+1" };
  const url = new URL(productQuoteHref(info), "https://itsbio.co.kr");
  assert.equal(url.searchParams.get("product"), breast.name);
  assert.equal(url.searchParams.get("catNo"), "ABC/2+1");
});

function pages(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    return entry.isDirectory() ? pages(path) : entry.name === "page.tsx" ? [path] : [];
  });
}

test("all product-detail templates keep the shared metadata and no visible SEO boilerplate", () => {
  const details = pages(new URL("app/products/", root)).filter(({ pathname }) => /\/item\/|\/staged\/|\/itschem\/page\.tsx$/.test(pathname));
  assert.ok(details.length >= 13, "Expected every published product-detail template");
  for (const path of details) {
    const source = readFileSync(path, "utf8");
    assert.ok(source.includes("productSearchMetadata"), path.pathname);
    assert.ok(source.includes("<ProductSearchInfo"), path.pathname);
    assert.ok(!source.includes("제품 사양과 Cat.No.를 확인하고 이츠바이오에 국내 견적을 문의하세요."), path.pathname);
  }
  const component = readFileSync(new URL("components/products/ProductSearchInfo.tsx", root), "utf8");
  assert.ok(component.includes('type="application/ld+json"'));
  assert.ok(!/<(?:section|p|div)\b/.test(component), "SEO metadata must not render a promotional block");
  console.log(`Checked ${details.length} product-detail templates.`);
});
