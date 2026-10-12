import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { parseAbmRebuildDetail } from "../lib/abm/rebuild-parser.mjs";
const { applyReviewedAbmProductDetail } = await import("../lib/abm/reviewed-product-details.ts");
const { internalizeAbmHref } = await import("../lib/abm/internal-links.ts");

const fixture = `<main><h1>AaCas12b Lentiviral Vector</h1>
<div class="add-to-cart-section-cat_no-value">G6100</div>
<div class="customize-container">Unrelated checkout configuration $295</div>
<div id="abm-product-information-general_info"><ul>
<li class="abm-product-information-content-section"><h3 class="name">Product Name</h3><div class="value">AaCas12b Lentiviral Vector</div></li>
<li class="abm-product-information-content-section"><h3 class="name">Unit</h3><div class="value">10 µg</div></li>
<li class="abm-product-information-content-section"><h3 class="name">Description</h3><div class="value"><p>AaCas12b expression vector.</p></div></li>
<li class="abm-product-information-content-section"><h3 class="name">Storage Condition</h3><div class="value">-20°C or below.</div></li>
</ul></div>
<div id="reviews-qas-qas"><div class="abm-product-information-faq-section">
<div class="abm-product-information-faq-section-question"><div class="abm-product-information-faq-content">Which PAM is recognized?</div></div>
<div class="abm-product-information-faq-section-answer"><div class="abm-product-information-faq-content">5′-TTN-3′.</div></div>
</div></div>
<div id="sds-documents-documents"><a href="/uploads/document/Vector_Plasmid_MSDS.pdf">Plasmid MSDS</a></div>
<div id="sds-documents-datasheet"><span onclick="ABM_Helpers.printSpecifications(1967267, 'library');">Print/Download Datasheet</span></div></main>`;
const parsed = parseAbmRebuildDetail(fixture, "https://www.abmgood.com/AaCas12b-Lentiviral-Vector-G6100.html", { kind: "product", sku: "G6100" });
assert.equal(parsed.description, "AaCas12b expression vector.");
assert.equal(parsed.unit, "10 µg");
assert.equal(parsed.storage, "-20°C or below.");
assert.equal(parsed.introHtml, "");
assert.equal(parsed.counts.faqs, 1);
assert.equal(parsed.verification.skuMatches, true);
assert.equal(parseAbmRebuildDetail(fixture, parsed.sourceUrl, { sku: "G6101" }).verification.skuMatches, false);
assert.ok(parsed.datasheetHtml.includes("product/printView?product_id=1967267"));
assert.ok(!parsed.specificationsHtml.includes("checkout"));
assert.ok(!parsed.specificationsHtml.includes("$295"));

for (const [sku, count, identity] of [["G6100", 3, "AaCas12b"], ["G6101", 4, "pAAV-CMV-Blank"], ["G6105", 2, "ABE8e"]]) {
  const detail = applyReviewedAbmProductDetail({ kind: "product", sku, title: "Old title", url: "", introHtml: '<div class="customize-container">Old configuration</div>' });
  assert.equal(detail.introHtml, "");
  assert.equal(detail.unit, "10 µg");
  assert.equal(detail.storage, "-20°C or below.");
  assert.ok(detail.specificationsHtml.includes(detail.title));
  assert.equal(cheerio.load(detail.faqsHtml)(".card").length, count);
  assert.equal(detail.documents.length, 0, "Documents HTML supplies the links once");
  assert.ok(readFileSync(new URL(`../public${detail.images[0]}`, import.meta.url), "utf8").includes(identity));
  const href = cheerio.load(detail.datasheetHtml)("a").attr("href");
  assert.equal(internalizeAbmHref(href), href);
  if (sku === "G6101") {
    assert.equal(detail.verification.officialMapType, "manufacturer-displayed-backbone-reference");
    assert.ok(detail.imageCaption.includes("backbone"));
  }
}
const unknown = { kind: "product", sku: "TM205", title: "Keep unresolved product", url: "" };
assert.equal(applyReviewedAbmProductDetail(unknown), unknown);
const service = { kind: "service", sku: "G6100", title: "Keep service", url: "" };
assert.equal(applyReviewedAbmProductDetail(service), service);
assert.equal(internalizeAbmHref("https://www.abmgood.com/CoA-Library.html"), "https://www.abmgood.com/CoA-Library.html");
console.log("ABM modern detail: labeled information, Q&A, live datasheets, reviewed SVG identity and isolated corrections passed.");
