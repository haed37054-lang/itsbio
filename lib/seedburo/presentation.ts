// Source placeholders are branding graphics, not photographs of the product.
export function isSeedburoPlaceholder(url: string) {
  return /\/(?:NOPICTURE|No_Image_Available(?:_[^/?]+)?)\.(?:png|jpe?g|webp)(?:\?|$)/i.test(url);
}

export function seedburoDisplayTitle(product: { title: string; summary: string; variants: Array<{ sku: string; title: string }> }) {
  const sameSku = product.variants.find((variant) => variant.sku.trim().toLowerCase() === product.title.trim().toLowerCase());
  if (!sameSku) return product.title;
  return product.summary || (sameSku.title !== "Default Title" ? sameSku.title : "") || product.title;
}

export function sortSeedburoProducts<T extends { images: unknown[] }>(products: T[]): T[] {
  // Keep every source record searchable; show photographs before records without one.
  return [...products].sort((a, b) => Number(Boolean(b.images.length)) - Number(Boolean(a.images.length)));
}
