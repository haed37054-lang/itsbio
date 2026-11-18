import review from "@/data/abm-product-image-review-2026-11-18.json";
import type { AbmStagedDetail } from "./rebuild-staging";

export function reviewedAbmProductImages(sku?: string) {
  const key = String(sku || "").trim().toLowerCase();
  return review.records.find((record) => record.sku.toLowerCase() === key)?.images || [];
}

export function applyReviewedAbmProductImages(detail: AbmStagedDetail): AbmStagedDetail {
  if (detail.kind !== "product") return detail;
  const images = reviewedAbmProductImages(detail.sku);
  if (!images.length) return detail;
  return { ...detail, images, previewImage: images[0] };
}
