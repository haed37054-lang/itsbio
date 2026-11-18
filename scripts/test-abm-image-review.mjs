import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const review = JSON.parse(readFileSync(new URL("data/abm-product-image-review-2026-11-18.json", root)));
const manifest = JSON.parse(readFileSync(new URL("data/abm-reviewed-asset-parts/manifest.json", root)));
const source = stripTypeScriptTypes(readFileSync(new URL("lib/abm/product-image-review.ts", root), "utf8"))
  .replace(/^import .*;\s*$/gm, "").replace(/^export /gm, "");
const { reviewedAbmProductImages, applyReviewedAbmProductImages } = new Function("review", `${source}\nreturn { reviewedAbmProductImages, applyReviewedAbmProductImages };`)(review);

test("reviewed media matches complete catalog numbers only", () => {
  assert.deepEqual(reviewedAbmProductImages(" t1186 "), ["/images/abm/T1186-official.png"]);
  assert.deepEqual(reviewedAbmProductImages("T7063"), ["/images/abm/T7063-official.png"]);
  assert.deepEqual(reviewedAbmProductImages("T11860"), []);
  assert.deepEqual(reviewedAbmProductImages("C096"), []);
});

test("only product image fields change; services and other products retain their data", () => {
  const original = { kind: "product", sku: "T1186", title: "GP5d Cells", specificationsHtml: "Original specifications", images: [] };
  const updated = applyReviewedAbmProductImages(original);
  assert.equal(updated.title, original.title);
  assert.equal(updated.specificationsHtml, original.specificationsHtml);
  assert.deepEqual(updated.images, reviewedAbmProductImages("T1186"));
  assert.equal(updated.previewImage, updated.images[0]);
  const service = { ...original, kind: "service" };
  assert.equal(applyReviewedAbmProductImages(service), service);
  const other = { ...original, sku: "T0003" };
  assert.equal(applyReviewedAbmProductImages(other), other);
});

test("every restored image reassembles to its exact reviewed original bytes", () => {
  const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
  for (const record of review.records) {
    const asset = manifest.assets.find((item) => item.path === `public${record.images[0]}`);
    assert.ok(asset, record.sku);
    const bytes = Buffer.concat(asset.parts.map((part) => {
      const bytes = readFileSync(new URL(`data/abm-reviewed-asset-parts/${part.path}`, root));
      assert.equal(bytes.length, part.bytes);
      assert.equal(sha(bytes), part.sha256);
      return bytes;
    }));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(sha(bytes), record.sha256);
    assert.equal(sha(bytes), asset.sha256);
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.readUInt32BE(16), 2047);
    assert.equal(bytes.readUInt32BE(20), 1680);
  }
});
