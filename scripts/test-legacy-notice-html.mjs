import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { load } from "cheerio";

const source = stripTypeScriptTypes(readFileSync(new URL("../lib/notice/legacy-html.ts", import.meta.url), "utf8"))
  .replace(/^import .*;\s*$/gm, "").replace(/^export /gm, "");
const normalize = new Function("load", `${source}\nreturn normalizeLegacyNoticeHtml;`)(load);
const card = (i) => `<div style="float:left;width:200px;padding-left:30px"><a href="https://example.com/collections/${i}" target="_blank" rel="noopener noreferrer"><span style="height:184px"><div style="padding-top:184px"><img src="/images/${i}.jpg" alt="Product ${i}" style="width:170px"></div></span><p>Product ${i}</p></a></div>`;

test("floating image cards become one responsive group without obsolete spacers", () => {
  const html = `<p>Original announcement</p>${Array.from({ length: 5 }, (_, i) => card(i)).join("")}`;
  const $ = load(normalize(html));
  assert.equal($(".legacy-notice-card-grid").length, 1);
  assert.equal($(".legacy-notice-card").length, 5);
  assert.equal($("[style]").length, 0);
  assert.equal($("body > p").text(), "Original announcement");
  for (let i = 0; i < 5; i++) {
    const link = $(".legacy-notice-card").eq(i);
    assert.equal(link.attr("href"), `https://example.com/collections/${i}`);
    assert.equal(link.attr("target"), "_blank");
    assert.equal(link.find("img").attr("src"), `/images/${i}.jpg`);
    assert.equal(link.find("img").attr("alt"), `Product ${i}`);
    assert.equal(link.find("p").text(), `Product ${i}`);
  }
});

test("unrelated newsletters and mixed content retain their original HTML", () => {
  for (const html of [
    '<table width="600"><tr><td align="left">Newsletter<img src="/newsletter.jpg"></td></tr></table>',
    '<div style="float:left"><a href="/detail"><img src="/item.jpg"><p>Item</p></a><p>Additional content</p></div>',
  ]) assert.equal(normalize(html), html);
});

test("text between groups stays in its original position", () => {
  const $ = load(normalize(`${card(1)}<p>Second group</p>${card(2)}`));
  assert.equal($(".legacy-notice-card-grid").length, 2);
  assert.equal($("body").children().eq(1).text(), "Second group");
});

test("normalization can be repeated without duplicating content", () => {
  const html = normalize(card(1));
  assert.equal(normalize(html), html);
});
