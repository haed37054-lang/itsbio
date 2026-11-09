import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { load } from "cheerio";

const cache = ".cache/bioplastics-complete";
fs.mkdirSync(cache, { recursive: true });
const origin = "https://www.bioplastics.com/";
const hash = value => crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
const clean = value => String(value || "").replace(/\s+/g, " ").trim();
async function pool(items, mapper, count = 8) {
  const out = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: count }, async () => { while (next < items.length) { const i = next++; out[i] = await mapper(items[i], i); } }));
  return out;
}
async function get(url, file, binary = false) {
  if (fs.existsSync(file)) return binary ? fs.readFileSync(file) : fs.readFileSync(file, "utf8");
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (response.status === 404 && binary) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      const data = binary ? Buffer.from(await response.arrayBuffer()) : await response.text();
      if (!binary && /<title>.*(?:error|forbidden)/i.test(data)) throw new Error(`Error page: ${url}`);
      fs.writeFileSync(file, data); return data;
    } catch (error) { last = error; }
  }
  throw last;
}
const menu = load(await get(`${origin}Products.aspx`, `${cache}/menu.html`));
const leaves = menu('a[href*="grp="]').map((_, element) => {
  const link = menu(element), source = new URL(link.attr("href"), origin);
  const parent = link.parents('div[id$="Items"]').first().attr("id")?.replace(/Items$/, "");
  return { sourceUrl: source.href, family: clean(link.text()), groupCode: source.searchParams.get("grp"), group: clean(menu(`#${parent}`).find("a").first().text()) };
}).get();
const visibleLeaves = leaves.filter(leaf => leaf.family);
const categoryFor = group => group.startsWith("PCR") ? "qpcr" : group.startsWith("FT") ? "filter-tips" : /^(?:TR|TL)/.test(group) ? "pipette-tips" : /^(?:MT|LT|ST|TT)/.test(group) ? "tubes" : group.startsWith("SOR") ? "racks-boxes" : group.startsWith("BOX") ? "debox" : null;
const inventory = await pool(visibleLeaves, async (leaf, index) => {
  const $ = load(await get(leaf.sourceUrl, `${cache}/leaf-${hash(leaf.sourceUrl)}.html`));
  const products = $('#ctl00_cphMain_ProductTable tr').slice(1).map((_, row) => {
    const cells = $(row).children("td"), href = $(row).find('a[href*="productdetails"]').first().attr("href");
    if (!href) return null;
    return { sku: clean(cells.eq(0).text()), title: clean(cells.eq(1).text()), pack: clean(cells.eq(2).text()), family: clean(cells.eq(3).text()), source: new URL(href, origin).href, category: categoryFor(leaf.groupCode), group: leaf.group, groupCode: leaf.groupCode };
  }).get().filter(Boolean);
  if ((index + 1) % 40 === 0) console.log(`Menu leaves ${index + 1}/${visibleLeaves.length}`);
  return { ...leaf, products };
});
fs.writeFileSync(`${cache}/inventory.json`, JSON.stringify({ collectedAt: new Date().toISOString(), leaves: inventory, emptyNavigationEntries: leaves.filter(leaf => !leaf.family) }, null, 2));
const bySku = new Map();
for (const leaf of inventory) for (const product of leaf.products) {
  if (!bySku.has(product.sku)) bySku.set(product.sku, { ...product, groupCodes: [], groups: [] });
  const current = bySku.get(product.sku);
  if (!current.groupCodes.includes(product.groupCode)) { current.groupCodes.push(product.groupCode); current.groups.push(product.group); }
}
const sourceProducts = [...bySku.values()];
console.log(`Official menu inventory: ${visibleLeaves.length} leaves, ${sourceProducts.length} unique SKUs`);
if (process.argv.includes("--inventory-only")) process.exit(0);
const previous = new Map(JSON.parse(fs.readFileSync("data/bioplastics/catalog.json", "utf8")).map(product => [product.sku, product]));
const fitTables = {};
const unavailableImages = [];
const products = await pool(sourceProducts, async (listing, index) => {
  const key = encodeURIComponent(listing.sku);
  const previousFile = `.cache/bioplastics-audit/${listing.sku}.html`;
  const detailFile = `${cache}/product-${key}.html`;
  if (!fs.existsSync(detailFile) && fs.existsSync(previousFile)) fs.copyFileSync(previousFile, detailFile);
  const $ = load(await get(listing.source, detailFile));
  const sku = clean($("#ctl00_cphMain_lblArticle").text());
  if (sku.toLowerCase() !== listing.sku.toLowerCase()) throw new Error(`SKU mismatch: ${listing.sku} / ${sku}`);
  const getText = field => clean($(`#ctl00_cphMain_myDescription_${field}`).text());
  const properties = $('[id^="ctl00_cphMain_myProperties_"][onmouseover]').map((_, element) => {
    const match = ($(element).attr("onmouseover") || "").match(/set_detail\('((?:\\.|[^'])*)',\s*'((?:\\.|[^'])*)'\)/);
    return match ? [[match[1].replace(/\\'/g, "'"), match[2].replace(/\\'/g, "'")]] : [];
  }).get();
  const imagePath = $("#ctl00_cphMain_imgProduct").attr("src");
  const imageSource = imagePath ? new URL(imagePath, origin).href : null;
  let image = null;
  if (imageSource && !/no_image/i.test(imageSource)) {
    const old = previous.get(listing.sku);
    if (old?.imageSource === imageSource && old.image && fs.existsSync(path.join("public", old.image))) image = old.image;
    else {
      const extension = path.extname(new URL(imageSource).pathname).toLowerCase() || ".jpg";
      image = `/images/bioplastics/${hash(imageSource)}${extension}`;
      const bytes = await get(imageSource, `${cache}/image-${hash(imageSource)}${extension}`, true);
      if (bytes) { fs.mkdirSync("public/images/bioplastics", { recursive: true }); fs.writeFileSync(`public${image}`, bytes); }
      else { unavailableImages.push({ sku, source: imageSource, status: 404 }); image = null; }
    }
  }
  const fitUrl = `${origin}components/instruments.aspx?code='${encodeURIComponent(sku)}'&list='FULL'`;
  const fitFile = `${cache}/fit-${key}.html`;
  const oldFit = `.cache/bioplastics-audit/${sku}-fits.html`;
  if (!fs.existsSync(fitFile) && fs.existsSync(oldFit)) fs.copyFileSync(oldFit, fitFile);
  const f = load(await get(fitUrl, fitFile));
  const fitNote = clean(f("body").text()).match(/This product fits\s+\d+\s+\(q\)PCR instruments/i)?.[0];
  const fits = f("table tr").map((_, row) => {
    const cells = f(row).children("td");
    if (cells.length < 4) return null;
    const markers = cells.eq(3).find("img").map((_, element) => path.basename(f(element).attr("src") || "").replace(/\.[^.]+$/, "")).get();
    return [[clean(cells.eq(0).text()), clean(cells.eq(1).text()), clean(cells.eq(2).text()), markers]];
  }).get().filter(Boolean);
  const fitKey = fits.length ? hash(JSON.stringify(fits)) : undefined;
  if (fitKey) fitTables[fitKey] = fits;
  const result = { ...listing, title: getText("txtMain") || listing.title, pack: getText("txtDetails") || listing.pack, configuration: getText("txtCategory") || listing.family, overview: getText("txtItem"), specs: previous.get(sku)?.specs || {}, properties, image, imageSource, ...(fitKey ? { fitKey, fitNote } : {}) };
  fs.writeFileSync(`${cache}/parsed-${key}.json`, JSON.stringify(result));
  if ((index + 1) % 40 === 0) console.log(`Product details and compatibility ${index + 1}/${sourceProducts.length}`);
  return result;
});
fs.writeFileSync(`${cache}/catalog.json`, JSON.stringify(products, null, 2));
fs.writeFileSync(`${cache}/instruments.json`, JSON.stringify(fitTables, null, 2));
fs.writeFileSync(`${cache}/summary.json`, JSON.stringify({ collectedAt: new Date().toISOString(), menuLeaves: visibleLeaves.length, products: products.length, groups: new Set(products.flatMap(p => p.groupCodes)).size, categories: new Set(products.map(p => p.category)).size, images: new Set(products.map(p => p.image).filter(Boolean)).size, unavailableImages, fitProducts: products.filter(p => p.fitKey).length, compatibilityMatrices: Object.keys(fitTables).length }, null, 2));
console.log(fs.readFileSync(`${cache}/summary.json`, "utf8"));
