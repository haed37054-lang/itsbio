import reviewed from "@/data/abm-product-detail-review-2026-10-13.json";
import type { AbmStagedDetail } from "./rebuild-staging";

// Reviewed corrections are applied after legacy data is merged. An explicit
// empty introduction removes the old configurator dump and keeps Description
// in Specifications without adding a duplicate Overview.
export function applyReviewedAbmProductDetail(detail: AbmStagedDetail): AbmStagedDetail {
  if (detail.kind !== "product") return detail;
  const record = reviewed.records.find((item) => item.sku.toLowerCase() === detail.sku?.toLowerCase());
  if (!record) return detail;
  return {
    ...detail,
    ...record.patch,
    verification: {
      ...detail.verification,
      source: "reviewed-current-abm-product-page",
      checkedAt: reviewed.checkedAt,
      skuMatches: true,
      hasSpecifications: true,
      hasDocuments: true,
      hasOfficialImages: true,
      officialMapType: record.review.mapType,
    },
  };
}
