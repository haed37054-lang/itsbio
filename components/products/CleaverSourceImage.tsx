"use client";

import Image from "next/image";
import { useState } from "react";
import verifiedImageCopies from "@/data/cleaver-verified-image-copies.json";

type Props = {
  src: string;
  alt: string;
  size: number;
  className?: string;
};

function isManufacturerImage(url: string) {
  try {
    return /(^|\.)thistlescientific\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function deliveryUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)thistlescientific\.com$/i.test(parsed.hostname) || !parsed.pathname.startsWith("/wp-content/uploads/")) return url;
    return `https://i0.wp.com/${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export default function CleaverSourceImage({ src, alt, size, className = "object-contain p-1" }: Props) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  // Only use a managed copy whose recorded source URL matches this exact photograph.
  const managed = (verifiedImageCopies as Record<string, string>)[src];
  const proxy = deliveryUrl(src);
  const sources = Array.from(new Set([managed, src, proxy].filter(Boolean)));
  const resolvedSrc = sources.find((source) => !failedSources.includes(source));

  if (!resolvedSrc) {
    return <span className="absolute inset-0 flex items-center justify-center bg-[#faf8fc] px-2 text-center text-xs text-slate-400">Image unavailable</span>;
  }

  return (
    <Image
      key={resolvedSrc}
      src={resolvedSrc}
      alt={alt}
      fill
      unoptimized={isManufacturerImage(resolvedSrc) || (proxy !== src && resolvedSrc === proxy)}
      quality={90}
      sizes={`${size}px`}
      className={className}
      onError={() => {
        setFailedSources((current) => current.includes(resolvedSrc) ? current : [...current, resolvedSrc]);
      }}
    />
  );
}
