import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
const { buildTreeFromDescendants, normalizeAbmGeneticSidebar } = await import("../lib/abm/sidebar-tree.ts");
const { resolveAbmProductPath, productCategoryBreadcrumbs, withAbmProductSource } = await import("../lib/abm/product-navigation.ts");
const { default: AbmCategorySideNav } = await import("../components/products/AbmCategorySideNav.tsx");

globalThis.React = React;
const root = { _id: "genetic", title: "Genetic Materials", path: ["genetic-materials"] };
const category = (path, title) => ({ _id: path.join("/"), title, path: ["genetic-materials", ...path] });
const categories = [
  category(["kits-for-viral-vectors"], "Kits for Viral Vectors"),
  category(["kits-for-viral-vectors", "virus-packaging-dna-mixes"], "Virus Packaging DNA Mixes"),
  category(["kits-for-viral-vectors", "qpcr-virus-titer-kits"], "qPCR Virus Titer Kits"),
  category(["expression-systems"], "Expression Systems"),
  category(["expression-systems", "lentiviral-vectors"], "Lentiviral Vectors"),
];
const tree = { ...root, key: root.path.join("/"), children: normalizeAbmGeneticSidebar(buildTreeFromDescendants(root.path, categories)) };
const trees = [tree];
const packaging = categories[1].path;
const lentiviral = categories[4].path;
const base = { trees, paths: [["Genetic Materials", "Kits for Viral Vectors"]], hints: [] };
assert.deepEqual(resolveAbmProductPath({ ...base, matchingCategoryPaths: [packaging] }), packaging);
assert.deepEqual(resolveAbmProductPath({ ...base, hints: ["Virus Packaging DNA Mixes"] }), packaging);
assert.deepEqual(resolveAbmProductPath({ ...base, hints: ["Virus Packaging Mixes"], matchingCategoryPaths: [lentiviral] }), packaging);
for (const from of ["https://evil.example/products/abm/genetic-materials", "/products/kent", "/products/abm/genetic-materials/missing", "/products/abm/genetic-materials/%ZZ"]) {
  assert.deepEqual(resolveAbmProductPath({ ...base, from, matchingCategoryPaths: [packaging] }), packaging);
}
assert.deepEqual(resolveAbmProductPath({ ...base, from: `/products/abm/${lentiviral.join("/")}`, matchingCategoryPaths: [packaging] }), lentiviral);
assert.equal(productCategoryBreadcrumbs(trees, lentiviral).at(-1).label, "Lentiviral Vectors & Virus");
const href = "/products/abm/staged/product/LV003?unit=200#specifications";
const contextual = withAbmProductSource(href, `/products/abm/${packaging.join("/")}`);
const parsed = new URL(contextual, "https://www.itsbio.co.kr");
assert.equal(parsed.searchParams.get("unit"), "200");
assert.equal(parsed.hash, "#specifications");
assert.equal(parsed.searchParams.get("from"), `/products/abm/${packaging.join("/")}`);
assert.equal(withAbmProductSource(contextual, parsed.searchParams.get("from")), contextual);
assert.equal(withAbmProductSource("https://www.abmgood.com/product.html", parsed.searchParams.get("from")), "https://www.abmgood.com/product.html");
const props = { brandKey: "abm", roots: [root], activePath: packaging, activeRootTree: tree.children,
  theme: { accentText: "text-orange-600", accentActiveBg: "bg-orange-100", accentActiveText: "text-orange-700", accentSoftBg: "bg-orange-50" }, isKentMode: false };
const dom = new JSDOM(renderToStaticMarkup(React.createElement(AbmCategorySideNav, props))).window.document;
assert.equal(dom.querySelector('[aria-current="page"]').getAttribute("href"), `/products/abm/${packaging.join("/")}`);
const expanded = dom.querySelector('[aria-current="page"]').closest('div.group\\/tree-row').parentElement;
assert.ok(expanded.className.includes("border-l"), "Leaf category is inside the expanded parent tree");
assert.ok(dom.querySelector(`a[href="/products/abm/${categories[2].path.join("/")}"]`));
console.log("ABM product navigation: direct links, source category, invalid input, shared expanded sidebar passed.");
