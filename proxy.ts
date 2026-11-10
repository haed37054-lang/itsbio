import { NextResponse, type NextRequest } from "next/server";

const LEGACY_PAGES = new Map([
  ["80", "/notice"],
  ["99", "/promotions"],
  ["113", "/about#ceo-message"],
  ["172", "/contact"],
  ["249", "/products/abm/cellular-materials"],
  ["347", "/products/kent"],
]);

export function proxy(request: NextRequest) {
  const pageId = request.nextUrl.searchParams.get("page_id");
  const path = pageId && LEGACY_PAGES.get(pageId);

  if (path) {
    const destination = new URL(path, request.url);
    destination.search = request.nextUrl.search;
    destination.searchParams.delete("page_id");
    return NextResponse.redirect(destination, 308);
  }

  if (pageId === "165") {
    return new NextResponse(
      '<!doctype html><html lang="ko"><meta charset="utf-8"><title>페이지를 찾을 수 없습니다 | ITS BIO</title><h1>페이지를 찾을 수 없습니다</h1><p><a href="/">ITS BIO 홈</a> · <a href="/products">제품 보기</a></p></html>',
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [{ source: "/", has: [{ type: "query", key: "page_id" }] }],
};
