export type CleaverImageIdentity = {
  sourceTitle?: string;
  sourceUrl?: string;
  sourceSlug?: string;
  images?: string[];
};

export type CleaverImageRelation = {
  title?: string;
  sku?: string;
  sourceUrl?: string;
  imageUrl?: string;
  internalHref?: string;
};

function titleKey(value = "") {
  return value.normalize("NFKC").toLowerCase().replace(/&amp;/g, "&")
    .replace(/×/g, "x").replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s*([(),])\s*/g, "$1").replace(/\s+/g, " ").trim();
}

function sourceKey(value = "") {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}

export function createCleaverRelationImageResolver(
  sources: Record<string, CleaverImageIdentity>,
  inventory: Array<{ sku: string; title: string }>,
) {
  const byUrl = new Map<string, CleaverImageIdentity[]>();
  const byTitle = new Map<string, CleaverImageIdentity[]>();
  const add = (index: Map<string, CleaverImageIdentity[]>, key: string, identity: CleaverImageIdentity) => {
    if (key) index.set(key, [...(index.get(key) || []), identity]);
  };
  for (const identity of Object.values(sources)) {
    add(byUrl, sourceKey(identity.sourceUrl), identity);
    add(byTitle, titleKey(identity.sourceTitle), identity);
  }
  for (const row of inventory) {
    const identity = sources[row.sku.toUpperCase()];
    if (identity) add(byTitle, titleKey(row.title), identity);
  }

  // A title may identify several variants. Accept it only when they agree on
  // the exact source page and primary photograph; never guess between variants.
  function unambiguous(identities: CleaverImageIdentity[]) {
    if (!identities.length) return undefined;
    const keys = new Set(identities.map((identity) =>
      `${sourceKey(identity.sourceUrl)}|${identity.images?.[0] || ""}`,
    ));
    return keys.size === 1 ? identities[0] : undefined;
  }

  function identityFor(item: CleaverImageRelation) {
    const sku = String(item.sku || "").normalize("NFKC").trim().toUpperCase();
    if (sku && sources[sku]) return sources[sku];
    const title = titleKey(item.title).replace(/^please select a variation\s+/i, "");
    // Included cards carry "parent product - selected variant". The complete
    // variant name must match an inventory title, including dimensions/sizes.
    const separator = title.indexOf(" - ");
    const named = unambiguous(byTitle.get(title) || [])
      || (separator >= 0 ? unambiguous(byTitle.get(title.slice(separator + 3)) || []) : undefined);
    const urlKey = sourceKey(item.sourceUrl);
    if (named && (!urlKey || sourceKey(named.sourceUrl) === urlKey)) return named;
    const urlMatches = byUrl.get(urlKey) || [];
    if (urlMatches.length) return urlMatches.find((identity) => identity.images?.length) || urlMatches[0];
    return undefined;
  }

  function resolve(item: CleaverImageRelation, related: CleaverImageRelation[] = [], preserveIncludedPhoto = false) {
    const identity = identityFor(item);
    const relatedItem = related.find((candidate) =>
      (sourceKey(item.sourceUrl) && sourceKey(item.sourceUrl) === sourceKey(candidate.sourceUrl))
      || titleKey(item.title) === titleKey(candidate.title),
    );
    const relatedIdentity = relatedItem ? identityFor(relatedItem) : undefined;
    const resolvedIdentity = identity || relatedIdentity;
    const imageUrl = preserveIncludedPhoto && item.imageUrl ? item.imageUrl
      : resolvedIdentity ? resolvedIdentity.images?.[0] || ""
        : item.imageUrl || relatedItem?.imageUrl || "";
    return {
      imageUrl,
      internalHref: item.internalHref || relatedItem?.internalHref
        || (resolvedIdentity?.sourceSlug ? `/products/cleaver/item/${resolvedIdentity.sourceSlug}` : undefined),
      status: imageUrl ? "resolved" : resolvedIdentity ? "source-without-image" : "unresolved",
    };
  }

  return { resolve };
}
