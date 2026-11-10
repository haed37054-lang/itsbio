import { PUBLIC_CATALOG_CACHE, sanityClient } from "@/lib/sanity/sanity.client";
import type { urlFor } from "@/lib/sanity/image";
import { thistlePromotions } from "@/lib/thistle-promotions";

type EditorialImage = Parameters<typeof urlFor>[0];

export type PromotionPost = {
  _id: string;
  title: string;
  campaignLabel?: string;
  summary?: string;
  publishedAt?: string;
  _createdAt?: string;
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
  isPinned: boolean;
  thumbnail?: EditorialImage;
};

const PROMOTION_PAGE_SIZE = 9;
const PROMOTION_LIST = `
  *[_type == "promotion" && coalesce(isActive, true) == true && ($q == "" || title match $q)]
    | order(coalesce(order, 0) desc, _createdAt desc, _id asc){
      _id, title, summary, publishedAt, _createdAt, dateText, startDate, endDate,
      "slug": slug.current,
      "cover": coalesce(image, gallery[0])
    }
`;

function promotionTime(promotion: PromotionPost) {
  const publishedAt = Date.parse(promotion.publishedAt ?? "");
  return Number.isFinite(publishedAt) ? publishedAt : Date.parse(promotion._createdAt ?? "") || 0;
}

export async function getPromotionPage(search = "", page = 1) {
  const searchTerms = search.toLowerCase().split(/\s+/);
  const brochures = thistlePromotions.filter(({ campaignLabel, title }) => {
    const searchText = `${campaignLabel} ${title}`.toLowerCase();
    return searchTerms.every((term) => searchText.includes(term));
  });
  const q = search ? `*${search}*` : "";
  const cmsPromotions = await sanityClient.fetch<PromotionPost[]>(PROMOTION_LIST, { q }, PUBLIC_CATALOG_CACHE);
  const allPromotions: PromotionPost[] = [...brochures, ...cmsPromotions];
  allPromotions.sort((a, b) => promotionTime(b) - promotionTime(a));
  const total = allPromotions.length;
  const totalPages = Math.max(1, Math.ceil(total / PROMOTION_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PROMOTION_PAGE_SIZE;
  const promotions = allPromotions.slice(start, start + PROMOTION_PAGE_SIZE);
  return { promotions, total, totalPages, currentPage, start };
}

export const NOTICE_PAGE_SIZE = 10;
const FORCED_PINNED_IDS = ["legacy-notice-33", "legacy-notice-32", "legacy-notice-26"];
const NOTICE_FILTER = `_type == "notice" && coalesce(isActive, true) == true && defined(slug.current) && ($q == "" || title match $q)`;
const NOTICE_PINNED = `isPinned == true || _id in ${JSON.stringify(FORCED_PINNED_IDS)}`;
const NOTICE_PAGE = `{
  "items": *[${NOTICE_FILTER}]
    | order((${NOTICE_PINNED}) desc, coalesce(dateTime(publishedAt), dateTime(_createdAt)) desc, _createdAt desc, _id asc)[$start...$end]{
      _id, title, "slug": slug.current, _createdAt, thumbnail,
      "publishedAt": select(defined(dateTime(publishedAt)) => publishedAt),
      "isPinned": ${NOTICE_PINNED}
    },
  "total": count(*[${NOTICE_FILTER}])
}`;

export function getNoticePage(search = "", page = 1) {
  const q = search ? `*${search}*` : "";
  const start = (page - 1) * NOTICE_PAGE_SIZE;
  return sanityClient.fetch<{ items: NoticePost[]; total: number }>(
    NOTICE_PAGE,
    { q, start, end: start + NOTICE_PAGE_SIZE },
    PUBLIC_CATALOG_CACHE,
  );
}
