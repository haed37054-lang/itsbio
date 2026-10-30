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
