#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

// Run with node --import tsx scripts/audit-migrated-production.mjs.
const require = createRequire(import.meta.url);
dotenv.config({ path: ".env.local", quiet: true });
const base = process.env.AUDIT_BASE_URL || "https://itsbio.vercel.app";
const targets = new Map();
const add = (url, brand, expected = "") => targets.set(url, { url, brand, expected });
const sample = (rows, count) => rows.filter((_, i) => i % Math.max(1, Math.floor(rows.length / count)) === 0).slice(0, count);
const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const manufacturerHosts = /(?:^|\.)(?:kentscientific\.com|thistlescientific\.com|thistlescientific\.co\.uk|seedburo\.com|seedburo-com\.myshopify\.com|affinityimmuno\.com|aimslabproducts\.com|animalid\.com|dogenbio\.com|plas-labs\.com|cfsciences\.com|bioplastics\.com)$/i;
const downloadable = /\.(?:pdf|jpe?g|png|webp|gif|svg|mp4|webm|mov|zip|docx?|xlsx?|pptx?|txt|fasta|gbk?)$/i;
const brands = ["abm", "kent", "cleaver", "seedburo", "affinity", "aims", "animalid", "itschem", "dogen", "plaslabs", "cellfree", "bioplastics"];
for (const brand of brands) add(`/products/${brand}`, brand);
for (const url of ["/", "/products", "/contact", "/about", "/promotions", "/notice", "/quote"]) add(url, "site");
for (const brand of ["aims", "animalid", "dogen", "plaslabs", "bioplastics"]) {
  for (const row of json(`data/${brand}/catalog.json`)) {
    add(`/products/${brand}/item/${row.slug || row.sku.toLowerCase()}`, brand, row.sku || row.title);
  }
}
for (const brand of ["affinityimmuno", "seedburo"]) {
  const route = brand === "affinityimmuno" ? "affinity" : brand;
  for (const row of sample(brand === "seedburo" ? require("../lib/seedburo/catalog.ts").SEEDBURO_PRODUCTS : json(`data/${brand}/catalog.json`), 24)) add(`/products/${route}/item/${row.slug || row.handle}`, route, row.sku || row.title);
}
for (const row of require("../lib/cellfree/catalog.ts").CELLFREE_PRODUCTS) add(`/products/cellfree/item/${row.slug}`, "cellfree", row.title);
for (const slug of ["830-series", "810-series", "cp-series"]) add(`/products/plaslabs/item/${slug}`, "plaslabs");
add("/products/plaslabs/item/compact-glove-box", "plaslabs");

if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET) {
  const sanity = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: "2026-01-01", useCdn: false });
  for (const brand of ["kent", "cleaver"]) {
    const rows = await sanity.fetch(`*[_type == "product" && (!defined(isActive) || isActive == true) && (brandSlug == $brand || brand->slug.current == $brand || brand->themeKey == $brand)] | order(slug.current asc){"slug":slug.current,sku}`, { brand });
    for (const row of sample(rows, 14)) if (row.slug) add(`/products/${brand}/item/${row.slug}`, brand, row.sku || "");
  }
}
for (const sku of ["G265", "TM205", "CH004", "G087"]) add(`/products/abm/staged/product/${sku}`, "abm", sku);

// Inspect all local asset references, including unsampled products.
const missingLocalAssets = new Map();
const localAssets = new Set();
function inspect(value, file) {
  if (Array.isArray(value)) { for (const v of value) inspect(v, file); return; }
  if (value && typeof value === "object") { for (const v of Object.values(value)) inspect(v, file); return; }
  if (typeof value !== "string") return;
  for (const hit of value.matchAll(/https?:\/\/[^\s"'<>]+|\/(?:images|files|documents|pdfs|aims-lab|affinityimmuno|itschem|dogen)\/[^\s"'<>]+/g)) {
    if (hit[0].startsWith("http")) continue;
    const url = hit[0].replace(/&amp;/g, "&").split(/[?#]/)[0];
    localAssets.add(url);
    const disk = path.join("public", decodeURIComponent(url));
    if (!fs.existsSync(disk)) missingLocalAssets.set(url, file);
  }
}
for (const brand of ["affinityimmuno", "aims", "animalid", "seedburo", "dogen", "plaslabs", "bioplastics"]) {
  for (const file of fs.readdirSync(`data/${brand}`).filter(f => f.endsWith(".json"))) inspect(json(`data/${brand}/${file}`), `data/${brand}/${file}`);
}
inspect(require("../lib/cellfree/catalog.ts").CELLFREE_PRODUCTS, "lib/cellfree/catalog.ts");

async function fetchPage(target) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(new URL(target.url, base), { signal: AbortSignal.timeout(45000) });
      if (response.status >= 500 && attempt === 0) continue;
      const html = await response.text();
      const $ = cheerio.load(html);
      $("script,style,template,noscript").remove();
      const main = $("main").first().length ? $("main").first() : $("body");
      const text = (main.text().trim() ? main.text() : $("body").text()).replace(/\s+/g, " ").trim();
      const headings = main.find("h1,h2").map((_, e) => $(e).text().trim()).get();
      const defects = [];
      if (!response.ok) defects.push(`HTTP ${response.status}`);
      if (headings.some(h => /^(?:404(?:\s.*)?|page not found|not found|페이지를 찾을 수 없습니다)$/i.test(h))) defects.push("not-found-page");
      if (text.length < 40) defects.push("empty-main");
      const normalize = v => v.normalize("NFKC").toLowerCase().replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
      if (target.expected && !normalize(text).includes(normalize(target.expected))) defects.push("expected-product-not-rendered");
      if (/Product details are being migrated/i.test(text)) defects.push("migration-placeholder");
      const outbound = main.find("a[href^='http']").map((_, e) => $(e).attr("href")).get().filter(url => !url.startsWith(base));
      const manufacturerPages = outbound.filter(href => { const url = new URL(href); return manufacturerHosts.test(url.hostname) && !downloadable.test(url.pathname) && !/\/download\//i.test(url.pathname); });
      if (manufacturerPages.length) defects.push("manufacturer-page-outbound-links");
      const images = main.find("img").map((_, e) => $(e).attr("src")).get().filter(Boolean);
      return { ...target, status: response.status, finalUrl: response.url, headings: headings.slice(0, 8), textLength: text.length, defects, images: [...new Set(images)], outbound: [...new Set(outbound)] };
    } catch (error) { if (attempt === 1) return { ...target, status: 0, defects: [error.message] }; }
  }
}
const rows = [...targets.values()];
const results = new Array(rows.length);
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < rows.length) {
    const i = next++;
    results[i] = await fetchPage(rows[i]);
    if ((i + 1) % 40 === 0) console.log(`Checked ${i + 1}/${rows.length}`);
  }
}));
const summary = { generatedAt: new Date().toISOString(), base, pages: results.length, byBrand: {}, localAssets: localAssets.size, missingLocalAssets: [...missingLocalAssets].map(([url, file]) => ({url, file})), failures: results.filter(r => r.defects.length) };
for (const brand of [...brands, "site"]) summary.byBrand[brand] = { checked: results.filter(r => r.brand === brand).length, failed: results.filter(r => r.brand === brand && r.defects.length).length };
fs.mkdirSync(".cache/overall-review", { recursive: true });
fs.writeFileSync(".cache/overall-review/production.json", JSON.stringify({ ...summary, results }, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.failures.length || summary.missingLocalAssets.length ? 1 : 0;
