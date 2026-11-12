// Import saved official product pages; never infer specifications or model numbers.
// Usage: node scripts/import-thistle-2026.mjs /absolute/path/to/saved-pages
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { load } from "cheerio";
import sanitize from "sanitize-html";

const directory = process.argv[2];
if (!directory || !path.isAbsolute(directory)) throw new Error("An absolute source directory is required.");
const urls = JSON.parse(fs.readFileSync(path.join(directory, "urls.json"), "utf8"));
const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
const unique = (values) => [...new Set(values.filter(Boolean))];
const products = [];
for (const sourceUrl of urls) {
  if (new URL(sourceUrl).hostname !== "www.thistlescientific.com") throw new Error("Unapproved source host.");
  const sourceSlug = new URL(sourceUrl).pathname.split("/").filter(Boolean).at(-1);
  const html = fs.readFileSync(path.join(directory, `${sourceSlug}.html`), "utf8");
  const $ = load(html);
  const title = clean($("h1.product_title").text());
  const section = (key) => $(`.wp-block-accordion-item--${key} .wp-block-accordion-panel`).first();
  const image = (element) => {
    const img = $(element).find("img").first();
    const value = img.attr("data-large_image") || img.attr("data-lazy-src") || img.attr("src") || "";
    return /placeholder|^data:/i.test(value) ? "" : value;
  };
  const variations = JSON.parse($("[data-product_variations]").attr("data-product_variations") || "[]");
  const skuText = clean($("body").text().match(/SKU:\s*([^\n\t]*)/)?.[1]);
  const sku = variations.find((row) => row.sku && !row.sku.endsWith("$"))?.sku || skuText;
  if (!title || !sku) throw new Error(`Missing official identity: ${sourceUrl}`);
  const photoUrls = unique($(".woocommerce-product-gallery__image a[data-fancybox='product-gallery']").map((_, e) => $(e).attr("href")).get());
  const safeHtml = (element) => {
    const copy = element.clone();
    copy.find("noscript,script,style,form,button").remove();
    copy.find("img").each((_, e) => { const src = $(e).attr("data-lazy-src") || $(e).attr("src"); if (src && !src.startsWith("data:")) $(e).attr("src", src); else $(e).remove(); });
    copy.find("a[href]").each((_, e) => {
      const href = $(e).attr("href");
      if (/add-to-cart=|\/cart\/|\/checkout\//i.test(href)) $(e).remove();
    });
    return sanitize(copy.html() || "", {
      allowedTags: [...sanitize.defaults.allowedTags, "img"],
      allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"] },
      allowedSchemes: ["https", "http", "mailto"],
    }).trim();
  };
  const overviewHtml = safeHtml(section("description"));
  const specsHtml = safeHtml(section("specifications"));
  const atAGlance = $(".woocommerce-product-details__short-description li").map((_, e) => clean($(e).text())).get();
  const docs = [];
  section("documents").find(".document_type_wrapper").each((_, e) => {
    const group = clean($(e).find(".document_type_title").text());
    $(e).find("a[href]").each((_, a) => docs.push({ group, title: clean($(a).text()).replace(/\s*\(PDF\)\s*$/i, ""), url: $(a).attr("href") }));
  });
  const videos = [];
  section("video").find("iframe").each((_, e) => {
    const embedUrl = $(e).attr("data-lazy-src") || $(e).attr("src") || "";
    if (/youtube(?:-nocookie)?\.com\/embed\//.test(embedUrl) && !videos.some((v) => v.embedUrl === embedUrl)) videos.push({ title: $(e).attr("title") || title, url: embedUrl, embedUrl });
  });
  const relations = (key) => section(key).find(".grid-table--body > .grid-table--row").map((_, e) => {
    const row = $(e), desc = row.find(".grid-col-desc");
    const id = row.find("a[name='variant_atc_button']").attr("href")?.match(/variation_id=(\d+)/)?.[1];
    const variant = variations.find((v) => String(v.variation_id) === id);
    return { title: clean(desc.text()), ...(variant?.sku ? { sku: variant.sku } : {}), packSize: clean(row.find(".grid-col-unit").text()), imageUrl: image(e) || variant?.image?.full_src || "", ...(desc.find("a[href]").length ? { sourceUrl: desc.find("a[href]").first().attr("href") } : {}) };
  }).get().filter((row) => row.title);
  const localPhotos = photoUrls.map((url) => {
    const name = createHash("sha256").update(url).digest("hex").slice(0, 16) + path.extname(new URL(url).pathname);
    const localPath = `/products/thistle/2026/${name}`;
    return fs.existsSync(`public${localPath}`) ? localPath : url;
  });
  const product = {
    title, sku, slug: sourceSlug, sourceUrl, sourceRetrievedAt: "2026-11-12",
    sourceSha256: createHash("sha256").update(html).digest("hex"),
    modelSkus: unique([sku, ...variations.map((v) => v.sku)]),
    summary: clean(section("description").find("p").first().text()).slice(0, 600),
    sourceImages: photoUrls, image: localPhotos[0], images: localPhotos, overviewHtml, specsHtml,
    cleaverSourceTitle: title, cleaverAtAGlance: atAGlance,
    cleaverSourceSectionOrder: $(".wp-block-accordion-heading__toggle-title").map((_, e) => clean($(e).text())).get(),
    docs, cleaverVideos: videos, cleaverVariations: relations("variations"),
    cleaverAccessories: relations("accessories"), cleaverWorksWith: relations("works-with"),
  };
  if (!overviewHtml || !section("specifications").find("tr").length || !photoUrls.length) throw new Error(`Incomplete official page: ${sourceUrl}`);
  products.push(product);
}
fs.writeFileSync("data/thistle-2026-products.json", `${JSON.stringify(products, null, 2)}\n`);
const sourceMap = JSON.parse(fs.readFileSync("data/cleaver-source-map.json", "utf8"));
for (const product of products) {
  for (const sku of product.modelSkus) sourceMap[sku] = {
    sourceTitle: product.title, sourceUrl: product.sourceUrl, sourceSlug: product.slug, images: product.images,
  };
}
fs.writeFileSync("data/cleaver-source-map.json", `${JSON.stringify(sourceMap, null, 2)}\n`);
console.log(JSON.stringify(products.map((p) => ({ title: p.title, sku: p.sku, models: p.modelSkus.length, images: p.images.length, docs: p.docs.length, videos: p.cleaverVideos.length })), null, 2));
