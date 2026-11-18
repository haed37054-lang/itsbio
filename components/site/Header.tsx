"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BrandLogo from "./BrandLogo";
import ProductsMegaMenu, { MobileProductNavigation } from "./ProductsMegaMenu";
import SearchBox from "./SearchBox";

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);

  return ref;
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useClickOutside<HTMLDivElement>(() => setMobileOpen(false));
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select, textarea, summary, [tabindex="0"]');
      const visible = Array.from(controls || []).filter((el) => el.getClientRects().length > 0);
      const first = visible[0];
      const last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onTab);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onTab);
      (previousFocus?.isConnected ? previousFocus : menuButtonRef.current)?.focus();
    };
  }, [mobileOpen, panelRef]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.prefetch("/products/thistle");

      if (pathname === "/products/thistle" || pathname === "/products/thistle/") {
        router.prefetch("/products/thistle/main-products");
        router.prefetch("/products/thistle/accessories");
      } else if (pathname.startsWith("/products/thistle/main-products")) {
        [
          "/products/thistle/main-products/electrophoresis-systems",
          "/products/thistle/main-products/gel-documentation-imaging",
          "/products/thistle/main-products/general-laboratory-equipment",
          "/products/thistle/main-products/electrophoresis-reagents",
          "/products/thistle/main-products/teaching-education",
        ].forEach((href) => router.prefetch(href));
      } else if (pathname.startsWith("/products/thistle/accessories")) {
        [
          "/products/thistle/accessories/electrophoresis-accessories",
          "/products/thistle/accessories/gel-documentation-accessories",
          "/products/thistle/accessories/general-laboratory-accessories",
          "/products/thistle/accessories/replacement-parts-spares",
        ].forEach((href) => router.prefetch(href));
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  useEffect(() => {
    const prefetched = new Set<string>();
    const onNavigationIntent = (event: PointerEvent | FocusEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (!/^\/products\/(thistle|cleaver|kent|seedburo|aims)(?:\/|$)/.test(url.pathname)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      const href = `${url.pathname}${url.search}`;
      if (prefetched.has(href)) return;
      prefetched.add(href);
      router.prefetch(href);
    };

    document.addEventListener("pointerover", onNavigationIntent, { passive: true });
    document.addEventListener("focusin", onNavigationIntent);
    return () => {
      document.removeEventListener("pointerover", onNavigationIntent);
      document.removeEventListener("focusin", onNavigationIntent);
    };
  }, [router]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-2 px-4 sm:gap-4 md:px-6">
        <button
          type="button"
          ref={menuButtonRef}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-white xl:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <div className="grid gap-1">
            <span className="h-0.5 w-5 bg-slate-900" />
            <span className="h-0.5 w-5 bg-slate-900" />
            <span className="h-0.5 w-5 bg-slate-900" />
          </div>
        </button>

        <BrandLogo className="shrink-0" />

        <nav className="hidden shrink-0 items-center gap-7 text-[15px] font-medium text-slate-700 xl:flex">
          <ProductsMegaMenu />
          <Link href="/promotions" className="transition hover:text-orange-600">Promotions</Link>
          <Link href="/notice" className="transition hover:text-orange-600">Notice</Link>
          <Link href="/about" className="transition hover:text-orange-600">About</Link>
          <Link href="/contact" className="transition hover:text-orange-600">Contact</Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SearchBox className="hidden w-72 md:block xl:w-80 2xl:w-[420px]" />
          <Link
            href="/quote"
            aria-label="Request a Quote"
            className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 sm:px-5"
          >
            <span className="sm:hidden">Quote</span><span className="hidden sm:inline">Request a Quote</span>
          </Link>
        </div>
      </div>

      {mobileOpen && createPortal(
        <div className="fixed inset-0 z-[200] xl:hidden">
          <div
            className="absolute inset-0 bg-white/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            id="mobile-menu"
            className="absolute inset-y-0 left-0 flex w-[min(92vw,380px)] min-w-0 flex-col bg-white shadow-2xl ring-1 ring-black/10"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <div className="flex h-[76px] shrink-0 items-center justify-between border-b px-4">
              <BrandLogo />
              <button
                type="button"
                ref={closeButtonRef}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <SearchBox
                className="w-full"
                placeholder="Search by Product Name, Catalog No..."
                onSubmitted={() => setMobileOpen(false)}
              />

              <nav className="mt-4 space-y-1">
                <Link
                  href="/products"
                  className="block rounded-xl border bg-slate-50 px-3 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Products
                </Link>
                <Link href="/promotions" className="block rounded-xl px-3 py-3 text-base text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Promotions</Link>
                <Link href="/notice" className="block rounded-xl px-3 py-3 text-base text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Notice</Link>
                <Link href="/about" className="block rounded-xl px-3 py-3 text-base text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>About</Link>
                <Link href="/contact" className="block rounded-xl px-3 py-3 text-base text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Contact</Link>
              </nav>

              <MobileProductNavigation onNavigate={() => setMobileOpen(false)} />

              <div className="mt-4 border-t pt-4">
                <Link
                  href="/quote"
                  className="block rounded-xl bg-orange-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-orange-700"
                  onClick={() => setMobileOpen(false)}
                >
                  Request a Quote
                </Link>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </header>
  );
}
