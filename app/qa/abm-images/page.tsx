import type { Metadata } from "next";
import ImageReviewQa from "./ImageReviewQa";
import urls from "./audit-urls.json";
import "@/app/products/abm/abm-content-theme.css";

export const metadata: Metadata = { title: "Image integrity QA", robots: { index: false, follow: false } };

export default function ImageReviewQaPage() {
  return <ImageReviewQa urls={urls} />;
}
