import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
const { normalizeAbmGeneralSidebar } = await import('../lib/abm/general-navigation.ts');
const { buildTreeFromDescendants, normalizeAbmCellularSidebar, normalizeAbmGeneticSidebar, includeVerifiedSpecializedVectorPages } = await import('../lib/abm/sidebar-tree.ts');
const { resolveAbmProductPath, productCategoryBreadcrumbs } = await import('../lib/abm/product-navigation.ts');
const { default: AbmCategorySideNav } = await import('../components/products/AbmCategorySideNav.tsx');
const source = JSON.parse(await fs.readFile(new URL('../data/abm-menu-review-2026-10-13.json', import.meta.url)));
const landings = JSON.parse(await fs.readFile(new URL('../data/abm-general-landings.json', import.meta.url)));
const general = normalizeAbmGeneralSidebar([]);
const cellular = normalizeAbmCellularSidebar([]);
// The source snapshot is independent of the navigation implementation.
const matchChildren = (expected, actual) => {
  for (const node of expected) {
    const match = actual.find(n => n.title === node.title);
    assert.ok(match, `Missing official menu: ${node.title}`);
    matchChildren(node.children, match.children);
  }
};
matchChildren(source.officialNavigation[0].children, general);
matchChildren(source.officialNavigation[1].children, cellular);
const enzymes = general.find(n => n.title === 'Enzymes & Kits');
const enzymeHtml = new JSDOM(landings.landings.find(l => l.key === 'enzymes-and-kits').html).window.document;
for (const node of enzymes.children.slice(0, 3)) {
  const url = new URL(node.href, 'https://itsbio.vercel.app');
  assert.equal(url.pathname, '/products/abm/general-materials/enzymes-and-kits');
  assert.ok(enzymeHtml.getElementById(url.hash.slice(1)), `${node.title}: matching body section`);
}
const rnase = new URL(enzymes.children[3].href, 'https://itsbio.vercel.app');
assert.equal(rnase.pathname, '/products/abm/staged/product/E049');
assert.equal(rnase.searchParams.get('from'), '/products/abm/general-materials/enzymes-and-kits');
assert.equal(enzymes.children[4].href, '/products/abm/genetic-materials/crispr/cas-proteins-and-crispr-screening');
const root = {_id:'general',key:'general-materials',title:'General Materials',path:['general-materials'],children:general};
assert.deepEqual(resolveAbmProductPath({trees:[root],paths:[],hints:['RNase R'],from:rnase.searchParams.get('from')}), enzymes.path);
assert.equal(productCategoryBreadcrumbs([root], enzymes.children[0].path).at(-1).href, enzymes.children[0].href);
globalThis.React = React;
const html = renderToStaticMarkup(React.createElement(AbmCategorySideNav, {brandKey:'abm',roots:[root],activePath:enzymes.path,activeRootTree:general,theme:{accentText:'text-orange-600',accentActiveBg:'bg-orange-100',accentActiveText:'text-orange-700',accentSoftBg:'bg-orange-50'},isKentMode:false}));
const doc = new JSDOM(html).window.document;
for (const node of enzymes.children) assert.ok([...doc.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===node.href));
assert.ok(doc.querySelector('a[aria-current="page"]').closest('.abm-category-row').textContent.includes('RNase R'));
const sirnaRoot = ['genetic-materials','expression-ready-libraries'];
const genetic = normalizeAbmGeneticSidebar(buildTreeFromDescendants(['genetic-materials'],[
  {_id:'lib',title:'Expression-Ready Libraries',path:sirnaRoot},
  {_id:'si',title:'siRNA',path:[...sirnaRoot,'sirna']},
  {_id:'oligo',title:'siRNA dsRNA Oligo Library',path:[...sirnaRoot,'sirna','sirna-oligo-dsrna-library']},
]));
assert.equal(genetic[0].children[0].children[0].title,'siRNA dsRNA Oligo');
const neural = new JSDOM(landings.landings.find(l=>l.root==='cellular-materials').html).window.document;
assert.ok(neural.querySelector('a[href="https://www.abmgood.com/human-midbrain-organoid-differentiation-medium-kit-tm216.html"][target="_blank"]'));
assert.ok(neural.querySelector('a[href^="/products/abm/staged/product/G7540?"]'));
const circ = new JSDOM(landings.landings.find(l=>l.key==='circrna').html).window.document;
assert.equal(circ.querySelectorAll('table a[href]').length,7);
console.log('ABM official menu completeness, section destinations, product context and restored-page links passed.');
