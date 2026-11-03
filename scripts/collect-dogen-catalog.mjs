import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";

const source = process.argv[2];
assert(source, "Pass the directory containing the reviewed DoGen HTML and inventory.");
const origin = "https://www.dogenbio.com";
const categories = [
  { id: "01", slug: "cell-viability-cytotoxicity-assay", title: "Cell Viability / Cytotoxicity Assay" },
  { id: "02", slug: "protein-analysis", title: "Protein Analysis" },
  { id: "03", slug: "assay-kit", title: "Assay Kit" },
];
const input = JSON.parse(await fs.readFile(path.join(source, "review-inventory.json"), "utf8"));
const clean = (value) => value.replace(/\s+/g, " ").trim();
const groups = new Map();
for (const category of categories) {
  const $ = load(await fs.readFile(path.join(source, `index-${category.id}.html`)));
  for (const heading of $(".conbody h3")) {
    const group = clean($(heading).text());
    $(heading).parent().find('a[href*="/product/view/"]').each((_, anchor) => {
      groups.set($(anchor).attr("href"), group);
    });
  }
}

const assetUrl = (value) => {
  const url = new URL(value, origin);
  assert.equal(url.origin, origin);
  return url.href;
};
const products = [];
const usedSlugs = new Set();
for (const entry of input) {
  const $ = load(await fs.readFile(path.join(source, `view-${entry.id}.html`)));
  const category = categories.find((item) => item.id === entry.category);
  const slug = entry.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  assert(category && slug && !usedSlugs.has(slug) && groups.get(entry.url), entry.title);
  usedSlugs.add(slug);
  const details = $(".product_view_wrap .con02 .tab-con > .txt");
  assert.equal(details.length, 1, entry.title);
  const figures = details.find("img").toArray();
  for (const [index, element] of figures.entries()) {
    const image = $(element);
    const src = image.attr("src");
    if (src.startsWith("data:")) {
      const match = /^data:image\/(?:png|jpe?g|webp|gif);base64,(.+)$/i.exec(src);
      assert(match, `Unsupported embedded image for ${entry.title}`);
      const bytes = Buffer.from(match[1], "base64");
      const name = createHash("sha256").update(bytes).digest("hex").slice(0, 20) + ".webp";
      const meta = await sharp(bytes).metadata();
      assert(meta.width && meta.height, entry.title);
      await sharp(bytes).webp({ lossless: true }).toFile(path.join("public/dogen", name));
      image.attr({ src: `/dogen/${name}`, width: String(meta.width), height: String(meta.height) });
    } else {
      image.attr("src", assetUrl(src));
    }
    image.attr({ alt: image.attr("alt") || `${entry.title} figure ${index + 1}`, loading: "lazy", decoding: "async" });
  }
  details.find("p").each((_, element) => {
    const node = $(element);
    const value = clean(node.text());
    if (!node.find("img, table").length && !value && !node.find("br").length) node.remove();
    if (/^[⊙◉]\s*(Description|Advantages|Features|Applications|Principle|Protocol|Assay Procedure|Kit Components|Example Data)\s*$/i.test(value)) {
      node.replaceWith($("<h3>").text(value.replace(/^[⊙◉]\s*/, "")));
    }
  });
  const descriptionHtml = sanitizeHtml(details.html() || "", {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "sub", "sup", "figure", "figcaption"],
    allowedAttributes: {
      img: ["src", "alt", "width", "height", "loading", "decoding"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["https"],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === "a" ? "excludeTag" : false,
  });
  const [headers, ...options] = entry.rows;
  const models = options.map(([catalog, ...values]) => {
    const [sku, ...label] = catalog.split(/\s+/);
    assert(/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(sku), catalog);
    return { sku, label: label.join(" "), values };
  });
  products.push({
    slug,
    title: entry.title,
    summary: entry.subtitle,
    category: category.slug,
    group: groups.get(entry.url),
    sourceUrl: entry.url,
    image: assetUrl(entry.mainImage),
    optionLabels: headers.slice(1),
    models,
    descriptionHtml,
    documents: entry.docs.map(({ url, label }) => ({ url: assetUrl(url), label })),
  });
}

assert.equal(products.length, 38);
assert.equal(products.flatMap((product) => product.models).length, 50);
assert.equal(new Set(products.flatMap((product) => product.models.map(({ sku }) => sku))).size, 50);
await fs.writeFile("data/dogen/catalog.json", JSON.stringify(products, null, 2) + "\n");
await fs.writeFile("data/dogen/categories.json", JSON.stringify(categories, null, 2) + "\n");
console.log(`Collected ${products.length} products and ${products.flatMap((product) => product.documents).length} document links.`);
