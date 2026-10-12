import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
const { findRtProduct } = await import("../lib/abm/rt-product-finder.ts");
const { normalizeAbmGeneralSidebar, ABM_GENERAL_MENU_ITEMS } = await import("../lib/abm/general-navigation.ts");
const { default: AbmGeneralLanding } = await import("../components/products/AbmGeneralLanding.tsx");
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
assert.equal(tree.length, 11);
assert.deepEqual(tree.map((node) => node.path[1]), ["pcr-enzymes", "enzymes-and-kits", "antibodies", "biorepository", "transfection-reagents", "dna-rna-purification", "gel-documentation", "rna-tracking", "buffers-and-general-chemicals", "equipment", "dna-and-protein-ladders"]);
assert.equal(tree[0].children[0].title, "RT & RT-PCR");
assert.ok(tree[0].children[0].aliases.includes("Reverse Transcriptase & RT-PCR"));
assert.equal(tree.at(-1).sourceUrl, "https://www.abmgood.com/DNA-and-Protein-Ladders.html");
assert.equal(ABM_GENERAL_MENU_ITEMS.find((item) => item.label === "RNA Tracking (RNA Mango)").href, "/products/abm/general-materials/rna-tracking");
assert.equal(ABM_GENERAL_MENU_ITEMS.at(-1).href, "/products/abm/general-materials/dna-and-protein-ladders");

assert.equal(data.landings.length, 5);
assert.equal(data.assets.length, 37);
const expectedFaqs = { "pcr-enzymes/rt-and-rt-pcr": 8, "rna-tracking": 7, "gel-documentation": 11, "transfection-reagents": 9, "dna-and-protein-ladders": 0 };
for (const landing of data.landings) {
  const doc = new JSDOM(landing.html).window.document;
  assert.equal(doc.querySelectorAll("script,style,.hs-form-frame").length, 0);
  assert.equal(doc.querySelectorAll("details").length, expectedFaqs[landing.key]);
  assert.doesNotMatch(doc.body.textContent, /\$\d|Q4RT15|Save 15%/);
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
for (const sku of ["G016", "G193", "G106", "G248", "G624", "G623", "G523"]) assert.ok(ladders.querySelector(`a[href^='/products/abm/staged/product/${sku}?']`));

// Exercise actual DOM events against the reviewed RT form and performance tabs.
const rt = data.landings[0];
const dom = new JSDOM("<div id='test-root'></div>", { url: "https://itsbio.vercel.app" });
globalThis.React = React;
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.FormData = dom.window.FormData;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
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
await act(async () => document.querySelector("#b-finder-reset").click());
assert.equal(document.querySelector("#b-cdna-questions").hidden, true);
assert.equal(document.querySelector("#b-finder-result").classList.contains("has-result"), false);
await act(async () => mount.unmount());
console.log("ABM General Materials: source integrity, links, menu, RT recommendations/reset and performance tabs passed.");
