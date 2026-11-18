import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Contact ITSBio for product quotations, availability and delivery information.",
  alternates: { canonical: "/quote" },
};

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
