import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
const { navigateAbmReviewedSection, scrollToAbmReviewedSection } = await import("../lib/abm/section-navigation.ts");
const data = JSON.parse(await fs.readFile(new URL("../data/abm-general-landings.json", import.meta.url), "utf8"));
const enzymes = data.landings.find((item) => item.key === "enzymes-and-kits");
const pathname = "/products/abm/general-materials/enzymes-and-kits";
const dom = new JSDOM(`<nav></nav><main><div class="abm-general-reviewed">${enzymes.html}</div></main>`, { url: `https://itsbio.vercel.app${pathname}` });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
let scrolled = [];
dom.window.HTMLElement.prototype.scrollIntoView = function (options) { scrolled.push({ id: this.id, options }); };
document.addEventListener("click", navigateAbmReviewedSection, true);
const click = (href, options = {}, target = "") => {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = target;
  anchor.innerHTML = "<span>Menu section</span>";
  document.querySelector("nav").replaceChildren(anchor);
  const event = new dom.window.MouseEvent("click", { bubbles: true, cancelable: true, ...options });
  // Avoid JSDOM's unimplemented native navigation after checking our handler.
  let intercepted;
  anchor.addEventListener("click", (event) => { intercepted = false; event.preventDefault(); });
  anchor.querySelector("span").dispatchEvent(event);
  return { handled: intercepted !== false, prevented: event.defaultPrevented };
};
for (const id of ["Cloning-Applications", "DNA-RNA-Applications", "in-vitro-Kits-Proteases"]) {
  const before = window.history.length;
  assert.ok(click(`${pathname}#${id}`).handled);
  assert.equal(window.location.hash, `#${id}`);
  assert.equal(scrolled.at(-1).id, id);
  assert.deepEqual(scrolled.at(-1).options, { block: "start", behavior: "auto" });
  assert.equal(window.history.length, before + 1);
  assert.ok(click(`${pathname}#${id}`).handled, "Repeated selection still scrolls");
  assert.equal(window.history.length, before + 1, "Repeated selection does not add history");
}
for (const [href, options, target] of [
  [`${pathname}#Cloning-Applications`, { ctrlKey: true }],
  [`${pathname}#Cloning-Applications`, { metaKey: true }],
  [`${pathname}#Cloning-Applications`, { shiftKey: true }],
  [`${pathname}#Cloning-Applications`, { altKey: true }],
  [`${pathname}#Cloning-Applications`, { button: 1 }],
  [`${pathname}#Cloning-Applications`, {}, "_blank"],
  [`${pathname}#missing`], [`${pathname}#%ZZ`],
  ["https://www.abmgood.com/Molecular-Biology-Enzymes-and-Kits.html#Cloning-Applications"],
  ["/products/abm/general-materials/equipment#Cloning-Applications"],
  [`${pathname}?query=different#Cloning-Applications`],
  ["/products/abm/staged/product/E049"],
]) {
  const count = scrolled.length;
  assert.equal(click(href, options, target).handled, false, href);
  assert.equal(scrolled.length, count, "Other navigation and new-tab gestures stay native");
}
window.history.replaceState(null, "", `${pathname}#DNA-RNA-Applications`);
assert.equal(scrollToAbmReviewedSection(), true, "Direct hash entry and history navigation restore the section");
assert.equal(scrolled.at(-1).id, "DNA-RNA-Applications");
console.log("ABM sections: sidebar/rail clicks scroll all three product groups; repeat/history/new-tab navigation passed.");
