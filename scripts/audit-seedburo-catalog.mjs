import { isSeedburoPlaceholder, seedburoDisplayTitle, sortSeedburoProducts } from "../lib/seedburo/presentation.ts";
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => JSON.parse(readFileSync(new URL(`../data/seedburo/${file}`, import.meta.url), 'utf8'));
const products = read('catalog.json');
const collections = read('collections.json');
const navigation = read('navigation.json');
const report = read('migration-report.json');
const handles = new Set(products.map((product) => product.handle));
const categories = new Set(collections.map((collection) => collection.handle));
assert.equal(handles.size, products.length, 'Duplicate product routes');
assert.equal(categories.size, collections.length, 'Duplicate category routes');
assert.equal(products.length, report.products, 'Product census differs from source report');
assert.equal(products.reduce((n, product) => n + product.variants.length, 0), report.variants, 'Variant census differs from source report');
assert.equal(report.collectionErrors.length + report.sectionErrors.length, 0, 'Failed source requests');
assert.equal(report.unverifiedGallerySourceUrls, 0, 'Source photos need URL verification');
for (const item of [...navigation.categories, ...navigation.phases]) assert.ok(categories.has(item.handle), `Menu route missing: ${item.handle}`);
for (const collection of collections) {
  assert.equal(collection.count, collection.productHandles.length, `Count mismatch: ${collection.handle}`);
  assert.equal(new Set(collection.productHandles).size, collection.count, `Duplicate cards: ${collection.handle}`);
  for (const handle of collection.productHandles) assert.ok(handles.has(handle), `Missing product: ${handle}`);
}
let galleries = 0;
let media = 0;
for (const product of products) {
  assert.ok(product.title && product.sourceUrl === `https://seedburo.com/products/${product.handle}`, `Invalid source identity: ${product.handle}`);
  assert.ok(product.variants.length, `Missing model data: ${product.handle}`);
  for (const category of product.categoryHandles) assert.ok(categories.has(category));
  for (const image of product.images) {
    const url = new URL(image.url);
    assert.equal(url.hostname, 'cdn.shopify.com', `Unexpected gallery host: ${product.handle}`);
    assert.ok(url.pathname.startsWith('/s/files/1/0070/8041/1191/'), `Unexpected gallery tenant: ${product.handle}`);
    galleries++;
  }
  for (const variant of product.variants) {
    for (const key of ['price','compare_at_price','available','inventory_quantity']) assert.ok(!(key in variant), `Commerce data exposed: ${key}`);
  }
  for (const html of [product.descriptionHtml, ...product.tabs.map((tab) => tab.html)]) {
    assert.ok(!/<(?:script|style|form|button|input|object)\b/i.test(html), `Storefront markup: ${product.handle}`);
    assert.ok(!/\son[a-z]+\s*=/i.test(html), `Event handler in content: ${product.handle}`);
    assert.ok(!/(?:href|src)="javascript:/i.test(html), `Unsafe content URL: ${product.handle}`);
    assert.ok(!/\$\s*\d/.test(html), `Price in content: ${product.handle}`);
    for (const [, href] of html.matchAll(/href="(\/products\/seedburo\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
      const path = href.slice('/products/seedburo/'.length);
      assert.ok(path.startsWith('item/') ? handles.has(path.slice(5)) : categories.has(path) || path === 'all-products', `Broken internal link: ${href}`);
    }
    media += (html.match(/<iframe\b/g) || []).length;
  }
}
console.log(JSON.stringify({ products: products.length, models: report.variants, collections: collections.length, galleryPhotos: galleries, embeddedMedia: media, menuCategories: navigation.categories.length, status: 'passed' }));

// Presentation must retain identities and actual photos, without treating source logos as photos.
const presented = products.map((product) => ({
  ...product, title: seedburoDisplayTitle(product),
  images: product.images.filter((image) => !isSeedburoPlaceholder(image.url)),
}));
const ordered = sortSeedburoProducts(presented);
assert.equal(new Set(ordered.map((product) => product.id)).size, products.length, 'Presentation lost a source record');
assert.deepEqual(products.map((product) => product.handle), read('catalog.json').map((product) => product.handle), 'Source catalog was mutated');
for (const product of presented) {
  const source = products.find((item) => item.id === product.id);
  assert.deepEqual(product.images, source.images.filter((image) => !isSeedburoPlaceholder(image.url)), `A product photo was substituted: ${product.handle}`);
}
const firstMissing = ordered.findIndex((product) => !product.images.length);
assert.ok(firstMissing < 0 || ordered.slice(firstMissing).every((product) => !product.images.length), 'Photo ordering differs between pages');
const replacementPoint = presented.find((product) => product.handle === '000-02ld-b');
assert.equal(replacementPoint.title, 'L.D. Outside Plain Brass Replacement Point');
assert.equal(replacementPoint.images.length, 0, 'Replacement point must not inherit another item photograph');
assert.equal(replacementPoint.variants[0].sku, '000-02LD-B');
console.log(JSON.stringify({actualPhotoProducts: presented.filter((product) => product.images.length).length, sourceWithoutProductPhoto: presented.filter((product) => !product.images.length).length, sourcePlaceholdersOmitted: products.reduce((n, product) => n + product.images.filter((image) => isSeedburoPlaceholder(image.url)).length, 0), presentation: 'passed'}));

// The source renders these outside Product Description, with Best sellers only as fallback.
const recommendations = read('recommendations.json');
const recommendationReport = read('recommendations-report.json');
assert.equal(recommendationReport.checkedProducts, products.length, 'Recommendation coverage is incomplete');
assert.deepEqual(recommendationReport.errors, [], 'Recommendation collection failed');
assert.deepEqual(recommendationReport.unknownTargets, [], 'Recommendation targets have not been migrated');
assert.deepEqual(Object.keys(recommendations).sort(), [...handles].sort(), 'Missing recommendation snapshot');
let relationCount = 0;
for (const [handle, record] of Object.entries(recommendations)) {
  const sourceUrl = new URL(record.sourceUrl);
  assert.equal(sourceUrl.origin, "https://seedburo.com");
  assert.equal(decodeURIComponent(sourceUrl.pathname), `/products/${handle}`);
  assert.ok(['bought-together', 'best-sellers', 'none'].includes(record.kind));
  assert.equal(record.heading, record.kind === 'bought-together' ? 'Customers who bought this item also bought' : record.kind === 'best-sellers' ? 'Best sellers' : '');
  assert.equal(new Set(record.items.map((item) => `${item.handle}:${item.variantId || ''}`)).size, record.items.length, `Duplicate recommendations: ${handle}`);
  for (const item of record.items) {
    assert.ok(handles.has(item.handle), `Recommendation route missing: ${handle} -> ${item.handle}`);
    if (item.variantId) assert.ok(products.find((product) => product.handle === item.handle)?.variants.some((variant) => variant.id === item.variantId), `Unknown recommended model: ${handle}`);
  }
  relationCount += record.items.length;
}
assert.equal(relationCount, recommendationReport.relations);
assert.equal(recommendations['3210'].kind, 'bought-together', 'Probe page must not show the hidden Best sellers fallback');
assert.deepEqual(recommendations['3210'].items.map((item) => item.handle), ['3191', 'triangular-sample-pans', '3202-2', 'grain-grading-training-mats'], 'Probe recommendations differ from the reviewed source order');
console.log(JSON.stringify({recommendationProducts: recommendationReport.checkedProducts, recommendationLinks: relationCount, recommendationAudit: 'passed'}));
