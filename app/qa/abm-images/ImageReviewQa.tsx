"use client";

import { useState } from "react";
import ProductGalleryClient from "@/components/products/ProductGalleryClient";

type ImageResult = { url: string; ok: boolean; width?: number; height?: number; reason?: string };
const good = ["/images/abm/T1186-official.png", "/images/abm/T7063-official.png"];
const missing = "/qa/intentional-missing-image.png";

export default function ImageReviewQa({ urls }: { urls: string[] }) {
  const [scenario, setScenario] = useState("partial");
  const [report, setReport] = useState<{ completed: number; total: number; failed: ImageResult[]; running: boolean }>();
  const images = scenario === "partial" ? [missing, ...good] : scenario === "all-fail" ? [missing] : scenario === "empty" ? [] : good;

  async function runChecks() {
    let next = 0;
    let completed = 0;
    const failed: ImageResult[] = [];
    setReport({ completed, total: urls.length, failed: [], running: true });
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (next < urls.length) {
        const url = urls[next++];
        const result = await new Promise<ImageResult>((resolve) => {
          const image = new Image();
          let done = false;
          const finish = (result: ImageResult) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            image.onload = null;
            image.onerror = null;
            image.src = "";
            resolve(result);
          };
          const timer = setTimeout(() => finish({ url, ok: false, reason: "timeout" }), 30000);
          image.onload = () => finish({ url, ok: image.naturalWidth > 0, width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => finish({ url, ok: false, reason: "load-error" });
          image.src = url;
        });
        if (!result.ok) failed.push(result);
        completed++;
        if (completed % 25 === 0 || completed === urls.length) setReport({ completed, total: urls.length, failed: [...failed], running: true });
      }
    }));
    setReport({ completed, total: urls.length, failed, running: false });
  }

  return <main className="mx-auto max-w-6xl px-6 py-8">
    <h1 className="text-2xl font-bold">Image integrity QA</h1>
    <div className="my-6 flex flex-wrap gap-3">
      {[["partial", "Broken first image"], ["all-fail", "All images fail"], ["empty", "No source images"], ["good", "Restored originals"]].map(([id, label]) =>
        <button className="rounded border px-4 py-2" key={id} onClick={() => setScenario(id)}>{label}</button>
      )}
    </div>
    <p data-testid="scenario">{scenario}</p>
    <div className="abm-product-media-layout grid gap-8 md:grid-cols-[minmax(0,1fr)_360px]">
      <div className="abm-product-media-container min-h-[320px]">
        <ProductGalleryClient key={scenario} images={images.map((url) => ({ url, alt: "Reviewed original" }))} />
      </div>
      <aside data-testid="information" className="rounded border p-5">Product information remains accessible.</aside>
    </div>
    <button className="my-8 rounded border px-4 py-2" disabled={report?.running} onClick={runChecks}>Run remaining image checks</button>
    <pre id="image-report" className="whitespace-pre-wrap break-all">{JSON.stringify(report || { total: urls.length, running: false }, null, 2)}</pre>
  </main>;
}
