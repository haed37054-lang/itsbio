import { NextResponse, type NextRequest } from "next/server";

import legacyWordPressRedirects from "@/data/legacy-wordpress-redirects.json";

// WordPress IDs were matched to the current catalog and notice records.
const LEGACY_PAGES = new Map([
  ...Object.entries(legacyWordPressRedirects.pages),
  ["80", "/notice"],
  ["99", "/promotions"],
  ["113", "/about#ceo-message"],
  ["172", "/contact"],
  ["249", "/products/abm/cellular-materials"],
  ["347", "/products/kent"],
]);
const LEGACY_NOTICES = new Map(Object.entries(legacyWordPressRedirects.notices));
const LEGACY_SUGGESTIONS = new Map(Object.entries(legacyWordPressRedirects.suggestions));

export function proxy(request: NextRequest) {
  const query = new URLSearchParams(request.nextUrl.search);
  const pageId = query.get("page_id")?.replace(/\/$/, "");
  if (!pageId || !/^\d+$/.test(pageId)) return NextResponse.next();

  const noticeId = pageId === "80" ? query.get("vid") : null;
  const path = noticeId ? LEGACY_NOTICES.get(noticeId) : LEGACY_PAGES.get(pageId);
  if (path) {
    const destination = new URL(path, request.url);
    query.delete("page_id");
    if (noticeId) {
      query.delete("vid");
      query.delete("mod");
    }
    for (const key of destination.searchParams.keys()) query.delete(key);
    for (const [key, value] of query) destination.searchParams.append(key, value);
    return NextResponse.redirect(destination, 308);
  }

  const suggestion = LEGACY_SUGGESTIONS.get(pageId);
  const catalogLink = suggestion
    ? `<a href="${suggestion.replaceAll("&", "&amp;")}">관련 제품 보기</a>`
    : '<a href="/products">제품 보기</a>';

  return new NextResponse(
    `<!doctype html><html lang="ko"><meta charset="utf-8"><title>페이지를 찾을 수 없습니다 | ITS BIO</title><h1>페이지를 찾을 수 없습니다</h1><p><a href="/">ITS BIO 홈</a> · ${catalogLink}</p></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const config = {
  matcher: [{ source: "/", has: [{ type: "query", key: "page_id" }] }],
};
