import { PUBLIC_CATALOG_CACHE, sanityCdnClient } from "@/lib/sanity/sanity.client";
import type { urlFor } from "@/lib/sanity/image";
import { thistlePromotions } from "@/lib/thistle-promotions";

type EditorialImage = Parameters<typeof urlFor>[0];

export type PromotionPost = {
  _id: string;
  title: string;
  campaignLabel?: string;
  summary?: string;
  publishedAt?: string;
  cover?: EditorialImage;
  coverPath?: string;
  dateText?: string;
  startDate?: string;
  endDate?: string;
  slug?: string;
};

export type NoticePost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  _createdAt: string;
  thumbnail?: EditorialImage;
};

const PROMOTION_PAGE_SIZE = 9;
const PROMOTION_FILTER = `_type == "promotion" && coalesce(isActive, true) == true && ($q == "" || title match $q)`;
const PROMOTION_COUNT = `count(*[${PROMOTION_FILTER}])`;
const PROMOTION_LIST = `
  *[${PROMOTION_FILTER}]
    | order(defined(order) desc, order desc, publishedAt desc, _createdAt desc)
    [$start...$end]{
      _id, title, summary, publishedAt, dateText, startDate, endDate,
      "slug": slug.current,
      "cover": coalesce(image, gallery[0])
    }
`;

export async function getPromotionPage(search = "", page = 1) {
  const searchTerms = search.toLowerCase().split(/\s+/);
  const brochures = thistlePromotions.filter(({ campaignLabel, title }) => {
    const searchText = `${campaignLabel} ${title}`.toLowerCase();
    return searchTerms.every((term) => searchText.includes(term));
  });
  const q = search ? `*${search}*` : "";
  const total = brochures.length + await sanityCdnClient.fetch<number>(PROMOTION_COUNT, { q }, PUBLIC_CATALOG_CACHE);
  const totalPages = Math.max(1, Math.ceil(total / PROMOTION_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PROMOTION_PAGE_SIZE;
  const end = start + PROMOTION_PAGE_SIZE;
  const cmsPromotions = await sanityCdnClient.fetch<PromotionPost[]>(PROMOTION_LIST, {
    q,
    start: Math.max(0, start - brochures.length),
    end: Math.max(0, end - brochures.length),
  }, PUBLIC_CATALOG_CACHE);

  const promotions: PromotionPost[] = [...brochures.slice(start, end), ...cmsPromotions];
  return { promotions, total, totalPages, currentPage, start };
}

export const NOTICE_PAGE_SIZE = 10;
const FORCED_PINNED_IDS = ["legacy-notice-33", "legacy-notice-32", "legacy-notice-26"];
const NOTICE_FILTER = `_type == "notice" && coalesce(isActive, true) == true && defined(slug.current)`;
const NOTICE_PINNED = `isPinned == true || _id in ${JSON.stringify(FORCED_PINNED_IDS)}`;
const NOTICE_SEARCH = `($q == "" || title match $q)`;
const NOTICE_FIELDS = `_id, title, "slug": slug.current, publishedAt, _createdAt, thumbnail`;
const NOTICE_PAGE = `{
  "pinnedItems": *[${NOTICE_FILTER} && (${NOTICE_PINNED}) && ${NOTICE_SEARCH}]
    | order(coalesce(order, 0) desc, coalesce(publishedAt, _createdAt) desc){${NOTICE_FIELDS}},
  "normalItems": *[${NOTICE_FILTER} && !(${NOTICE_PINNED}) && ${NOTICE_SEARCH}]
    | order(coalesce(publishedAt, _createdAt) desc)[$start...$end]{${NOTICE_FIELDS}},
  "normalTotal": count(*[${NOTICE_FILTER} && !(${NOTICE_PINNED}) && ${NOTICE_SEARCH}]),
  "globalNormalTotal": count(*[${NOTICE_FILTER} && !(${NOTICE_PINNED})])
}`;

export function getNoticePage(search = "", page = 1) {
  const q = search ? `*${search}*` : "";
  const start = (page - 1) * NOTICE_PAGE_SIZE;
  return sanityCdnClient.fetch<{
    pinnedItems: NoticePost[];
    normalItems: NoticePost[];
    normalTotal: number;
    globalNormalTotal: number;
  }>(NOTICE_PAGE, { q, start, end: start + NOTICE_PAGE_SIZE }, PUBLIC_CATALOG_CACHE);
}
