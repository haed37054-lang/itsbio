import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (name) => JSON.parse(readFileSync(new URL(`../data/aims/${name}`, import.meta.url), 'utf8'));
const products = read('catalog.json');
const media = read('source-media.json');
const checks = read('media-checks.json');
const navigation = read('navigation.json');
assert.deepEqual(products.map((product) => product.sku), ['ATS-3', 'NEO-9', 'ATS-3L']);
assert.deepEqual(products[0].models.map((model) => model.sku), ['ATS-3', 'NEO-AP', 'LLA-AP']);
assert.ok(products.slice(1).every((product) => product.models.length === 1));
const models = new Map(products.flatMap((product) => product.models.map((model) => [model.sku, product.slug])));
assert.equal(models.size, 5);
const urls = new Set();
let photos = 0, videos = 0, brochures = 0;
for (const product of products) {
  const source = media[product.slug];
  assert.ok(source && source.sourceUrl.startsWith('https://animalid.com/portfolio/'));
  assert.equal(source.images.length, 1, `Missing exact equipment photograph: ${product.sku}`);
  assert.equal(source.brochures.length, 1);
  assert.equal(product.models[0].sku, product.sku);
  assert.ok(product.description && product.features.length && product.specifications.every((row) => row.length === 2));
  assert.ok(!/\$\s*\d|add to cart|checkout|price/i.test(JSON.stringify(product)));
  for (const image of [...source.images, ...source.gallery]) {
    assert.ok(image.width > 0 && image.height > 0);
    assert.ok(checks.assets[image.url]?.contentType.startsWith('image/'));
    assert.equal(checks.assets[image.url]?.width, image.width);
    assert.equal(checks.assets[image.url]?.height, image.height);
    photos++; urls.add(image.url);
  }
  for (const url of source.brochures) { assert.ok(checks.assets[url]?.contentType.includes('pdf')); brochures++; urls.add(url); }
  for (const url of source.videos) { assert.ok(checks.assets[url]?.contentType.includes('video/')); videos++; urls.add(url); }
}
for (const url of urls) {
  const u = new URL(url);
  assert.equal(u.origin, 'https://animalid.com');
  assert.ok(u.pathname.startsWith('/wp-content/uploads/'));
  assert.equal(checks.assets[url]?.status, 200, `Unverified media: ${url}`);
}
assert.equal(urls.size, Object.keys(checks.assets).length);
for (const section of navigation) for (const item of section.links) {
  const target = new URL(item.href, 'https://itsbio.vercel.app');
  const slug = target.pathname.split('/').at(-1);
  assert.ok(products.some((product) => product.slug === slug));
  if (target.hash) assert.equal(models.get(decodeURIComponent(target.hash.slice(7))), slug);
}
assert.equal(videos, 5);
assert.equal(brochures, 3);
console.log(JSON.stringify({ products: products.length, upgrades: 2, photographs: photos, brochures, videos, verifiedAssets: urls.size, status: 'passed' }));
