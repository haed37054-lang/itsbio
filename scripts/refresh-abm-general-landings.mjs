// Rebuild only from reviewed, locally saved official HTML. This never writes
// to Sanity or promotes production. Run with node --import tsx and --source-dir.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import * as cheerio from "cheerio";
import postcss from "postcss";
const { internalizeAbmHref } = await import("../lib/abm/internal-links.ts");

const input = process.argv[process.argv.indexOf("--source-dir") + 1];
if (!process.argv.includes("--source-dir") || !input) throw new Error("--source-dir is required");
const sourceDir = path.resolve(input);
const categories = JSON.parse(await fs.readFile(path.join(sourceDir, "categories.json"), "utf8"));
const nav = JSON.parse(await fs.readFile(path.join(sourceDir, "nav.json"), "utf8"));
const selected = ["pcr-enzymes/rt-and-rt-pcr", "rna-tracking", "gel-documentation", "transfection-reagents", "dna-and-protein-ladders", "dna-rna-purification", "buffers-and-general-chemicals"];
const reviewedPaths = [
  ...selected.map((key) => ["general-materials", ...key.split("/")]),
  ["general-materials", "enzymes-and-kits"],
  ["general-materials", "circrna"],
  ["cellular-materials", "3d-and-organoid", "neurological-system"],
];
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const outDir = "public/images/abm/general";
await fs.mkdir(outDir, { recursive: true });
const assets = new Map();
const landings = [];
const styles = [];
const rtUrls = {
  "all-in-one-5x-rt-mastermix.html": "G592", "onescript-hot-rt-mastermix.html": "G590",
  "onescriptr-hot-cdna-synthesis-kit.html": "G594", "onescript-plus-cdna-synthesis-kit.html": "G236",
  "onescriptr-hot-reverse-transcriptase.html": "G593", "onescript-plus-reverse-transcriptase.html": "G237",
  "megafi-one-step-rt-pcr.html": "G597", "mirna-all-in-one-cdna-synthesis-kit.html": "G898",
};
const finderProducts = {};
// Newly added supplier products without a local inventory/detail record use
// their exact official product URLs while detail collection continues.
const neuralExternalSkus = new Set(["TM216", "TM217", "TM226", "TM227", "TM228", "R0500", "R0501", "R0502", "TM097"]);
const needsOfficialDetail = (sku, from) => from.endsWith("/neurological-system") && neuralExternalSkus.has(sku);

function localHref(raw, source, from) {
  if (!raw || raw.startsWith("#")) return raw;
  const url = new URL(raw, source);
  if (url.protocol === "mailto:") return "mailto:info@itsbio.co.kr";
  if (!["https:", "http:"].includes(url.protocol)) return "";
  if (!/(^|\.)abmgood\.com$/.test(url.hostname)) return url.href;
  if (url.pathname === "/pcr-competitor-cross-reference-tool") return url.href;
  if (/\.(?:pdf|docx?|xlsx?|pptx?|zip)$/i.test(url.pathname)) return url.href;
  const filename = url.pathname.split("/").pop();
  const sku = rtUrls[filename] || filename?.match(/-([A-Z]{1,4}\d{2,}[A-Z]*(?:-[A-Z0-9]+)?)(?:\.html)?$/i)?.[1]?.toUpperCase();
  if (needsOfficialDetail(sku, from)) return url.href;
  if (sku) return `/products/abm/staged/product/${sku}?from=${encodeURIComponent(from)}`;
  const category = categories.find((item) => item.sourceUrl === `${url.origin}${url.pathname}` && (nav.find((n) => n._id === item._id)?.isActive !== false || item.path.at(-1) === "dna-and-protein-ladders"));
  return category ? `/products/abm/${category.path.join("/")}${url.hash}` : internalizeAbmHref(url.href, source);
}

for (const categoryPath of reviewedPaths) {
  const rootSlug = categoryPath[0];
  const key = categoryPath.slice(1).join("/");
  const category = categories.find((item) => item.path.join("/") === categoryPath.join("/"));
  const filename = key.replaceAll("/", "__");
  const bytes = await fs.readFile(path.join(sourceDir, `${filename}.html`));
  const $ = cheerio.load(bytes.toString());
  const root = $("#abm-category-right-outer");
  if (!root.length) throw new Error(`Official content unavailable: ${key}`);
  const className = `abm-general-${key.split("/").pop()}`;
  const scope = `.abm-general-reviewed.${className}`;
  const sourceStyles = root.find("style").map((_, item) => $(item).text()).get().join("\n");
  if (sourceStyles) {
    const sheet = postcss.parse(sourceStyles);
    sheet.walkDecls((decl) => {
      if (/^font(?:-|$)|^color$/.test(decl.prop)) decl.remove();
    });
    sheet.walkRules((rule) => {
      if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
      rule.selectors = rule.selectors.map((selector) => {
        if (/^(?:html|body|:root)$/.test(selector.trim())) return scope;
        return `${scope} ${selector}`;
      });
    });
    styles.push(sheet.toString());
  }
  // The supplier's seasonal discount and sample forms belong to its store.
  root.find("#free_sample #abm-category-section5").each((_, item) => { $("#free_sample").before($(item)); });
  root.find("script,style,.promo,#free-sample,#free_sample,#b-modal,#image-lightbox,#image-modal,#default-product-type").remove();
  root.find(".hs-form-frame").remove();
  root.find("h2.abm-categories-title-h2,ul.abm-page-category-nav-list").remove();
  root.find("[href*='free-sample'],[href*='free_sample']").remove();
  root.find("[id='rt-free-sample-form'],.offer,.offer-card,.bundle-offer").remove();
  root.find("h1").first().remove(); // shared page heading is the canonical menu label
  root.find("main").each((_, item) => { item.tagName = "div"; $(item).addClass("abm-general-body"); });
  if (key === "gel-documentation") {
    root.find("h2,h3,h4").filter((_, item) => /^SafeView.*DNA Stains$/i.test($(item).text().trim())).first().before('<span id="safeview-dna-stains" class="abm-general-anchor" aria-hidden="true"></span>');
  }
  root.find("li,p,span,div").filter((_, item) => /^Wholesale\s+Prices?$/i.test($(item).text().trim())).remove();
  root.find("iframe").each((_, item) => {
    const frame = $(item);
    if (frame.attr("src") === "https://www.youtube.com/embed/M1_8mYwuBeE") {
      frame.attr({ loading: "lazy", referrerpolicy: "strict-origin-when-cross-origin", allow: "fullscreen", class: "abm-general-video" });
    } else frame.remove();
  });
  root.find("form").each((_, item) => { if ($(item).attr("id") !== "rtFinderBalanced") $(item).remove(); });
  root.find("*").each((_, item) => {
    const el = $(item);
    for (const attr of Object.keys(item.attribs || {})) {
      if (/^on/i.test(attr) || ["srcset", "data-srcset"].includes(attr)) el.removeAttr(attr);
    }
    const inline = el.attr("style");
    if (inline) el.attr("style", inline.split(";").filter((declaration) => !/^\s*(?:font(?:-|\s*:)|color\s*:)/i.test(declaration)).join(";"));
  });
  const from = `/products/abm/${categoryPath.join("/")}`;
  root.find("a[href]").each((_, item) => {
    const anchor = $(item);
    const raw = anchor.attr("href");
    const href = localHref(raw, category.sourceUrl, from);
    if (!href) { anchor.removeAttr("href"); return; }
    anchor.attr("href", href);
    if (/youtube\.com/.test(href)) anchor.closest("li").find(".abm-category-image-title i").text("Video");
    if (href.startsWith("/") || href.startsWith("#")) anchor.removeAttr("target rel");
    else anchor.attr({ target: "_blank", rel: "noopener noreferrer" });
    if (href.startsWith("mailto:")) anchor.text("info@itsbio.co.kr");
  });
  // Preserve supplier figure content and colours byte-for-byte as local assets.
  root.find("img[src]").each((_, item) => {
    const img = $(item);
    const url = new URL(img.attr("src"), category.sourceUrl).href;
    const extension = path.extname(new URL(url).pathname).toLowerCase();
    if (!/\.(?:png|jpe?g|gif|webp|svg)$/.test(extension)) throw new Error(`Unexpected image: ${url}`);
    const local = `/images/abm/general/${sha(url).slice(0, 14)}${extension}`;
    assets.set(url, { sourceUrl: url, localPath: local });
    img.attr({ src: local, loading: "lazy", decoding: "async" });
    const imageButton = img.closest("button.image-tile");
    if (imageButton.length) {
      const fullImage = imageButton.attr("data-full-image");
      if (fullImage) {
        const fullUrl = new URL(fullImage, category.sourceUrl).href;
        const fullLocal = `/images/abm/general/${sha(fullUrl).slice(0, 14)}${path.extname(new URL(fullUrl).pathname).toLowerCase()}`;
        assets.set(fullUrl, { sourceUrl: fullUrl, localPath: fullLocal });
        imageButton.attr("data-full-image", fullLocal);
      }
      imageButton.attr("data-general-image", "");
    }
    if (!img.attr("alt")) img.attr("alt", img.closest("figure,article,.abm-custom-page-tr").find("h2,h3,h4").first().text().trim() || category.title);
    if (!img.closest("a,button").length && !/(?:icon|dr-peter-unrau)/.test(url)) {
      img.wrap(`<button type="button" data-general-image aria-label="Enlarge image" class="abm-general-image-trigger"></button>`);
      img.parent().attr("aria-label", `Enlarge ${img.attr("alt")}`);
    }
  });
  root.find("table").each((_, item) => {
    const table = $(item);
    const rows = table.find("tr");
    const commerce = [];
    rows.first().children().each((index, cell) => {
      if (/^(?:price|cost|buy|quantity to order|add to cart)$/i.test($(cell).text().trim())) commerce.push(index);
    });
    rows.each((_, row) => {
      const cells = $(row).children();
      for (const index of commerce.toSorted((a, b) => b - a)) {
        if (cells.length > index) cells.eq(index).remove();
        else cells.each((_, cell) => {
          const colspan = Number($(cell).attr("colspan"));
          if (colspan > 1) $(cell).attr("colspan", String(Math.max(1, colspan - 1)));
        });
      }
    });
    // Supplier row navigation becomes ordinary, keyboard-accessible links.
    rows.filter("[data-href],[data-link]").each((_, row) => {
      const r = $(row);
      const href = localHref(r.attr("data-href") || r.attr("data-link"), category.sourceUrl, from);
      const cell = r.children().first();
      if (!cell.find("a").length) {
        const content = cell.html();
        cell.empty().append($("<a></a>").attr("href", href).html(content));
      }
      r.removeAttr("data-href data-link role tabindex");
    });
    const skuIndex = table.find("tr").first().children().toArray().findIndex((cell) => /Cat\.?\s*(?:No\.?|#)/i.test($(cell).text()));
    if (skuIndex >= 0) table.find("tr").slice(1).each((_, row) => {
      const sku = $(row).children().eq(skuIndex).text().trim();
      if (!/^[A-Z]{1,4}\d{2,}[A-Z]*(?:-[A-Z0-9]+)?$/i.test(sku)) return;
      if (needsOfficialDetail(sku, from)) return;
      $(row).find("a[href]").each((_, item) => {
        const anchor = $(item);
        if (/\.(pdf|zip|png|jpe?g)(?:$|\?)/i.test(anchor.attr("href"))) return;
        anchor.attr("href", `/products/abm/staged/product/${sku}?from=${encodeURIComponent(from)}`).removeAttr("target rel");
      });
    });
    const header = table.find("tr").first();
    if (!header.closest("thead").length) {
      header.children("td").each((_, cell) => { cell.tagName = "th"; $(cell).attr("scope", "col"); });
      table.prepend($("<thead></thead>").append(header));
    }
    table.find("tbody tr").each((_, row) => {
      if ($(row).children().length === 1 && Number($(row).children().first().attr("colspan")) > 1) $(row).addClass("abm-table-section-row");
    });
    table.addClass("abm-data-table");
    table.wrap('<div class="abm-table-scroll" role="region" aria-label="Scrollable product comparison table" tabindex="0"></div>');
  });
  root.find("button").each((_, item) => {
    const button = $(item);
    const anchor = button.closest("a[href]");
    if (anchor.length) button.replaceWith(button.html());
  });
  if (key.includes("rt-and-rt-pcr")) {
    root.find("[data-family-panel],[data-product-panel]").each((_, item) => {
      const panel = $(item);
      const type = panel.attr("data-family-panel") ? "family" : "product";
      const value = panel.attr(`data-${type}-panel`);
      const id = `abm-rt-${type}-${value}`;
      panel.attr({ id, role: "tabpanel" });
      root.find(`[data-${type}="${value}"]`).attr("aria-controls", id);
    });
    // Copy reviewed result metadata as plain data; never execute supplier JS.
    const script = await fs.readFile(path.join(sourceDir, `${filename}.script.js`), "utf8");
    for (const [sku, body] of [...script.matchAll(/(G\d+):\{name:'([^']+)',url:'([^']+)',badges:\[([^\]]+)\],reason:'([^']+)',note:'([^']+)'\}/g)].map((m) => [m[1], m])) {
      finderProducts[sku] = { name: body[2], href: localHref(body[3], category.sourceUrl, from), badges: [...body[4].matchAll(/'([^']+)'/g)].map((m) => m[1]), reason: body[5], note: body[6] };
    }
    if (Object.keys(finderProducts).length !== 8) throw new Error("RT finder result metadata changed; review it before rebuilding");
  }
  let html = root.html().replaceAll("technical@abmgood.com", "info@itsbio.co.kr").replaceAll("quotes@abmgood.com", "info@itsbio.co.kr");
  const final = cheerio.load(html);
  // Remove empty supplier integration remnants and obsolete seasonal CTA copy.
  final("p").each((_, item) => { if (!final(item).attr("id") && !final(item).text().trim() && !final(item).find("img,iframe").length) final(item).remove(); });
  final("section,div").filter((_, item) => final(item).children("h2").text().includes("Build Your RT Workflow and Save")).remove();
  html = final("body").html();
  landings.push({ root: rootSlug, key, sourceUrl: category.sourceUrl, sourceSha256: sha(bytes), className, html, imageCount: final("img[src]").length, faqCount: final("details").length });
}

// Two workers, one request per original asset. A failed asset aborts promotion.
let next = 0;
const downloads = [...assets.values()];
await Promise.all(Array.from({ length: 2 }, async () => {
  while (next < downloads.length) {
    const asset = downloads[next++];
    const destination = `public${asset.localPath}`;
    let bytes;
    try { bytes = await fs.readFile(destination); } catch {
      const response = await fetch(asset.sourceUrl, { signal: AbortSignal.timeout(30000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error(`Image unavailable: ${response.status} ${asset.sourceUrl}`);
      bytes = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(destination, bytes);
    }
    asset.sha256 = sha(bytes); asset.bytes = bytes.length;
    console.log("asset", asset.localPath, asset.bytes);
  }
}));

await fs.writeFile("data/abm-general-landings.json", JSON.stringify({ checkedAt: new Date().toISOString(), landings, assets: downloads, finderProducts }, null, 2) + "\n");
await fs.writeFile("app/products/abm/abm-general-source.css", `/* Scoped official layouts; typography and table colours use the fixed ABM theme. */\n${styles.join("\n").trimEnd()}\n`);
const audit = JSON.parse(await fs.readFile(path.join(sourceDir, "audit.json"), "utf8"));
// Freshly reviewed sources supersede earlier rate-limit entries.
for (const landing of landings) {
  const row = audit.find((item) => item.path === `${landing.root}/${landing.key}`);
  if (row && row.status !== 200) {
    row.status = 200;
    row.root = true;
    row.recheckedAt = new Date().toISOString();
    row.sourceSha256 = landing.sourceSha256;
  }
}
await fs.writeFile("data/abm-general-review-2026-10-13.json", JSON.stringify({ checkedAt: new Date().toISOString(), auditScope: "Reviewed official category bodies and missing navigation destinations. Structured resource/publication blocks are separate, so raw image-count differences alone are not missing-image defects.", categoryAudit: audit, repairedPaths: reviewedPaths.map((parts) => parts.join("/")), unresolved: audit.filter((row) => row.status !== 200).map((row) => ({ path: row.path, status: row.status, reason: "Official HTTP request returned a rate limit; current content preserved pending verification." })) }, null, 2) + "\n");
console.log("Reviewed", landings.length, "landings and", downloads.length, "official images");
