import type { Metadata } from "next";

type CategoryMetadata = {
  title: string;
  brand: string;
  path: string;
  description?: string;
  noIndex?: boolean;
};

/** One canonical URL per browsable category; search results remain followable. */
export function catalogCategoryMetadata({ title, brand, path, description, noIndex = false }: CategoryMetadata): Metadata {
  const heading = `${title} | ${brand}`;
  const summary = description?.trim() || `Explore ${title} from ${brand}, including product information and specifications at ITSBio.`;
  return {
    title: heading,
    description: summary,
    alternates: { canonical: path },
    openGraph: { title: heading, description: summary, url: path },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
