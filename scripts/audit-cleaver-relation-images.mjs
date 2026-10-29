import { readFileSync, writeFileSync } from 'node:fs';
import { createCleaverRelationImageResolver } from '../lib/cleaver/relation-images.ts';

const argument = (name) => process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
const input = argument('--input');
if (!input) throw new Error('Pass --input=/path/to/catalog-snapshot.json (public Cleaver product data).');
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const resolver = createCleaverRelationImageResolver(
  read(new URL('../data/cleaver-source-map.json', import.meta.url)),
  read(new URL('../data/cleaver-product-catalog.json', import.meta.url)),
);
const products = read(input);
const sections = ['cleaverIncludedItems', 'cleaverAccessories', 'cleaverVariations', 'cleaverWorksWith'];
const counts = {};
const issues = [];
for (const product of products) {
  for (const section of sections) {
    for (const item of product[section] || []) {
      const related = section === 'cleaverIncludedItems'
        ? [...(product.cleaverAccessories || []), ...(product.cleaverVariations || [])] : [];
      const result = resolver.resolve(item, related, section === 'cleaverIncludedItems');
      counts[section] ??= {};
      counts[section][result.status] = (counts[section][result.status] || 0) + 1;
      if (result.status !== 'resolved') issues.push({ sku: product.sku, section, title: item.title, sourceUrl: item.sourceUrl, status: result.status });
    }
  }
}
const report = { products: products.length, counts, issues };
const destination = argument('--report');
if (destination) writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ products: report.products, counts, unresolved: issues.filter((item) => item.status === 'unresolved').length }, null, 2));
// A strict catalog release audit must resolve or explicitly review every unknown.
if (process.argv.includes('--strict') && issues.some((item) => item.status === 'unresolved')) process.exitCode = 1;
