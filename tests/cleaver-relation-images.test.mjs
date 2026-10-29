import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createCleaverRelationImageResolver } from '../lib/cleaver/relation-images.ts';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const sources = read('../data/cleaver-source-map.json');
const resolver = createCleaverRelationImageResolver(sources, read('../data/cleaver-product-catalog.json'));

test('included variant names select the correct official photograph', () => {
  const cases = [
    ['Agarose, Low EEO - Agarose 100g', 'CSL-AG100'],
    ['Kb PLUS DNA ladder, 100-10Kb - 1Kb PLUS DNA ladder, 100-10Kb, 1 x 500ul vial', 'CSL-MDNA-1KBPLUS'],
    ['SAFE Safe DNA staining reagent - runSAFE stain 1ml/vial', 'CSL-RUNSAFE'],
    ['multiSUB Midi, Midi Horizontal Electrophoresis System - multiSUB Midi with 10 x 7cm & 10 x 10cm Gel tray', 'MSMIDIDUO'],
    ['Glass Plates for the omniPAGE Mini - 10 x 10cm Plain Glass Plates with 1mm Bonded Spacers ( Pack of 2)', 'VS10PGS1'],
  ];
  for (const [title, sku] of cases) {
    const result = resolver.resolve({ title });
    assert.equal(result.imageUrl, sources[sku].images[0], title);
    assert.equal(result.internalHref, `/products/cleaver/item/${sources[sku].sourceSlug}`);
  }
});

test('a selected variant stays specific when its source URL is a shared product page', () => {
  const result = resolver.resolve({
    title: 'multiSUB Midi, Midi Horizontal Electrophoresis System - multiSUB Midi with 10 x 7cm & 10 x 10cm Gel tray',
    sourceUrl: sources.MSMIDIDUO.sourceUrl,
  });
  assert.equal(result.imageUrl, sources.MSMIDIDUO.images[0]);
});

test('typographic dash differences do not break an accessory photo', () => {
  assert.equal(resolver.resolve({ title: 'multiSUB Midi - 10cm UV Gel Scoop' }).imageUrl, sources['MS10-UVS'].images[0]);
});

test('a verified source without a photograph does not inherit an unrelated stored photo', () => {
  const result = resolver.resolve({ sku: 'CSQ20-S0.25', imageUrl: 'https://example.com/wrong-product.jpg' });
  assert.equal(result.imageUrl, '');
  assert.equal(result.status, 'source-without-image');
});

test('unknown titles and ambiguous variants stay flagged instead of receiving a guessed image', () => {
  assert.equal(resolver.resolve({ title: 'Agarose 123g' }).status, 'unresolved');
  const ambiguous = createCleaverRelationImageResolver({
    A: { sourceTitle: 'Comb', sourceUrl: 'https://example.com/product/comb/', images: ['one.jpg'] },
    B: { sourceTitle: 'Comb', sourceUrl: 'https://example.com/product/comb/', images: ['two.jpg'] },
  }, []);
  assert.equal(ambiguous.resolve({ title: 'Comb' }).status, 'unresolved');
});

test('an existing included-card photograph is preserved during resolution', () => {
  const imageUrl = 'https://cdn.sanity.io/images/9b5twpc8/production/verified-photo.jpg';
  assert.equal(resolver.resolve({ title: 'An included component', imageUrl }, [], true).imageUrl, imageUrl);
});
