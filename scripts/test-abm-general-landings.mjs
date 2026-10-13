import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
const { findRtProduct } = await import("../lib/abm/rt-product-finder.ts");
const { normalizeAbmGeneralSidebar, ABM_GENERAL_MENU_ITEMS } = await import("../lib/abm/general-navigation.ts");
const { default: AbmGeneralLanding } = await import("../components/products/AbmGeneralLanding.tsx");
const { rewriteMegaMenuLinks } = await import("../components/site/AbmLinkResolverClient.tsx");
const data = JSON.parse(await fs.readFile(new URL("../data/abm-general-landings.json", import.meta.url), "utf8"));

const defaults = { application: "cdna", gdna: "no", sample: "routine", format: "mastermix" };
for (const [answers, expected] of [
  [{ application: "rtpcr" }, "G597"], [{ application: "mirna" }, "G898"],
  [{ ...defaults, gdna: "yes", format: "enzyme" }, "G592"],
  [{ ...defaults, gdna: "unsure", sample: "challenging", format: "kit" }, "G592"],
  [defaults, "G590"], [{ ...defaults, format: "kit" }, "G236"],
  [{ ...defaults, format: "kit", sample: "challenging" }, "G594"],
  [{ ...defaults, format: "enzyme" }, "G237"],
  [{ ...defaults, format: "enzyme", sample: "challenging" }, "G593"],
  [{ ...defaults, format: "any", sample: "unsure" }, "G594"],
  [{ ...defaults, format: "any" }, "G590"],
  [{ application: "cdna", gdna: "yes" }, undefined], [{}, undefined],
]) assert.equal(findRtProduct(answers), expected);

const tree = normalizeAbmGeneralSidebar([{ _id: "pcr", key: "general-materials/pcr-enzymes", path: ["general-materials", "pcr-enzymes"], title: "PCR Enzymes", children: [
  { _id: "rt", key: "rt", path: ["general-materials", "pcr-enzymes", "rt-and-rt-pcr"], title: "Reverse Transcriptase & RT-PCR", children: [] },
] }]);
assert.equal(tree.length, 12);
assert.deepEqual(tree.map((node) => node.path[1]), ["pcr-enzymes", "enzymes-and-kits", "antibodies", "biorepository", "transfection-reagents", "dna-rna-purification", "gel-documentation", "rna-tracking", "buffers-and-general-chemicals", "equipment", "dna-and-protein-ladders", "circrna"]);
assert.equal(tree[0].children[2].title, "RT & RT-PCR");
assert.ok(tree[0].children[2].aliases.includes("Reverse Transcriptase & RT-PCR"));
assert.equal(tree.at(-1).sourceUrl, "https://www.abmgood.com/abm-circRNA.html");
assert.equal(ABM_GENERAL_MENU_ITEMS.find((item) => item.label === "RNA Tracking (RNA Mango)").href, "/products/abm/general-materials/rna-tracking");
assert.equal(ABM_GENERAL_MENU_ITEMS.at(-1).href, "/products/abm/general-materials/circrna");

assert.equal(data.landings.length, 10);
assert.equal(data.assets.length, 55);
const expectedFaqs = { "pcr-enzymes/rt-and-rt-pcr": 8, "rna-tracking": 7, "gel-documentation": 11, "transfection-reagents": 9, "dna-and-protein-ladders": 0, "dna-rna-purification": 0, "buffers-and-general-chemicals": 0, "enzymes-and-kits": 0, "circrna": 0, "3d-and-organoid/neurological-system": 15 };
for (const landing of data.landings) {
  const doc = new JSDOM(landing.html).window.document;
  assert.equal(doc.querySelectorAll("script,style,.hs-form-frame").length, 0);
  assert.equal(doc.querySelectorAll("main").length, 0, "One main landmark belongs to the host page");
  assert.equal(doc.querySelectorAll("details").length, expectedFaqs[landing.key]);
  assert.doesNotMatch(doc.body.textContent, /\$\d|Q4RT15|Save 15%|Wholesale Prices/);
  for (const el of doc.querySelectorAll("*")) for (const attribute of el.attributes) assert.ok(!/^on/i.test(attribute.name));
  for (const image of doc.querySelectorAll("img[src]")) assert.ok(image.getAttribute("src").startsWith("/images/abm/general/"));
  for (const table of doc.querySelectorAll("table")) {
    assert.ok(table.querySelector("thead"));
    assert.doesNotMatch(table.querySelector("thead").textContent, /Price/);
  }
  for (const anchor of doc.querySelectorAll("a[href^='#']")) {
    if (anchor.getAttribute("href") !== "#") assert.ok(doc.getElementById(anchor.getAttribute("href").slice(1)), `${landing.key}: valid anchor`);
  }
  for (const iframe of doc.querySelectorAll("iframe")) assert.equal(iframe.getAttribute("src"), "https://www.youtube.com/embed/M1_8mYwuBeE");
  assert.ok(!doc.querySelector("form") || landing.key === "pcr-enzymes/rt-and-rt-pcr");
}
for (const asset of data.assets) {
  const bytes = await fs.readFile(new URL(`../public${asset.localPath}`, import.meta.url));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), asset.sha256);
  assert.ok(bytes.length > 500);
}
const ladders = new JSDOM(data.landings.find((item) => item.key === "dna-and-protein-ladders").html).window.document;
assert.ok(new JSDOM(data.landings.find((item) => item.key === "gel-documentation").html).window.document.getElementById("safeview-dna-stains"));
for (const sku of ["G016", "G193", "G106", "G248", "G624", "G623", "G523"]) assert.ok(ladders.querySelector(`a[href^='/products/abm/staged/product/${sku}?']`));

// Each table's product name and catalog number must reach the same detail.
for (const key of ["dna-rna-purification", "buffers-and-general-chemicals"]) {
  const doc = new JSDOM(data.landings.find((item) => item.key === key).html).window.document;
  for (const row of doc.querySelectorAll("tbody tr")) {
    const sku = row.children[1]?.textContent.trim();
    if (!/^[A-Z]{1,4}\d{2,}[A-Z]*(?:-[A-Z0-9]+)?$/.test(sku || "")) continue;
    for (const anchor of row.querySelectorAll("a[href]")) {
      const url = new URL(anchor.getAttribute("href"), "https://itsbio.vercel.app");
      assert.equal(url.pathname, `/products/abm/staged/product/${sku}`, `${key}: ${sku}`);
      assert.equal(url.searchParams.get("from"), `/products/abm/general-materials/${key}`);
    }
  }
}
const buffers = new JSDOM(data.landings.find((item) => item.key === "buffers-and-general-chemicals").html).window.document;
for (const sku of ["CH110-10", "G135E", "G129", "G945"]) assert.ok(buffers.querySelector(`a[href^='/products/abm/staged/product/${sku}?']`));
assert.ok(!buffers.querySelector("a[href*='/CH001?']"), "Removed supplier catalog rows must not remain listed");

// Exercise actual DOM events against the reviewed RT form and performance tabs.
const rt = data.landings[0];
const dom = new JSDOM("<div id='test-root'></div>", { url: "https://itsbio.vercel.app" });
globalThis.React = React;
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.FormData = dom.window.FormData;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const header = document.createElement("header");
header.innerHTML = '<a href="/products/abm/general-materials/dna-and-protein-ladders">DNA &amp; Protein Ladders</a><a href="/products/abm/general-materials/rna-tracking">RNA Tracking (RNA Mango)</a>';
document.body.prepend(header);
const main = document.createElement("main");
main.innerHTML = '<header><a href="/products/abm/general-materials/pcr-enzymes/rt-and-rt-pcr#finder">Product Finder</a></header>';
document.body.append(main);
rewriteMegaMenuLinks([]);
assert.equal(header.querySelector("a").getAttribute("href"), "/products/abm/general-materials/dna-and-protein-ladders");
assert.equal(header.querySelectorAll("a")[1].getAttribute("href"), "/products/abm/general-materials/rna-tracking");
assert.equal(main.querySelector("a").getAttribute("href"), "/products/abm/general-materials/pcr-enzymes/rt-and-rt-pcr#finder");
const mount = createRoot(document.getElementById("test-root"));
await act(async () => mount.render(React.createElement(AbmGeneralLanding, { html: rt.html, className: rt.className, finderProducts: data.finderProducts })));
const form = document.querySelector("#rtFinderBalanced");
const choose = (name, value) => {
  const input = form.querySelector(`input[name='${name}'][value='${value}']`);
  assert.ok(input); input.checked = true; input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
};
await act(async () => {
  choose("application", "cdna"); choose("gdna", "no"); choose("sample", "routine"); choose("format", "enzyme");
  form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
});
assert.match(document.querySelector("#b-result-name").textContent, /^G237/);
assert.ok(document.querySelector("#b-result-link").getAttribute("href").startsWith("/products/abm/staged/product/G237?"));
assert.ok(document.querySelector("#b-finder-result").classList.contains("has-result"));
await act(async () => document.querySelector("[data-family='plus']").click());
assert.equal(document.querySelector("[data-family-panel='hot']").hidden, true);
assert.equal(document.querySelector("[data-family-panel='plus']").hidden, false);
const contentBefore = document.querySelector(".abm-general-reviewed");
// JSDOM does not implement native dialogs; the real browser is checked separately.
dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false; this.dispatchEvent(new dom.window.Event("close"));
};
await act(async () => document.querySelector("button[data-general-image]").click());
assert.ok(document.querySelector("dialog").open);
assert.equal(document.querySelector(".abm-general-reviewed"), contentBefore);
assert.equal(form.querySelectorAll("input:checked").length, 4);
assert.match(document.querySelector("#b-result-name").textContent, /^G237/);
await act(async () => document.querySelector('[aria-label="Close expanded image"]').click());
assert.ok(!document.querySelector("dialog").open);
assert.equal(document.querySelector("[data-family-panel='plus']").hidden, false);
assert.match(document.querySelector("#b-result-name").textContent, /^G237/);
await act(async () => document.querySelector("#b-finder-reset").click());
assert.equal(document.querySelector("#b-cdna-questions").hidden, true);
assert.equal(document.querySelector("#b-finder-result").classList.contains("has-result"), false);
await act(async () => mount.unmount());
console.log("ABM General Materials: source integrity, links, menu, RT recommendations/reset and performance tabs passed.");
