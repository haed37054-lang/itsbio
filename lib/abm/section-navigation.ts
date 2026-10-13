function reviewedSection(hash: string): HTMLElement | null {
  if (!hash || hash === "#") return null;
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
  const target = document.getElementById(id);
  return target?.closest(".abm-general-reviewed") ? target : null;
}

/** Next's hash navigation can skip table rows inside a scrolling region.
 * Scroll reviewed supplier sections directly from both the sidebar and rail. */
export function navigateAbmReviewedSection(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return false;
  const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
  if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return false;
  const current = new URL(window.location.href);
  const destination = new URL(anchor.href, current);
  if (destination.origin !== current.origin || destination.pathname !== current.pathname || destination.search !== current.search) return false;
  const target = reviewedSection(destination.hash);
  if (!target) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  // Repeated clicks should scroll back to the section without adding history.
  if (destination.hash !== current.hash) window.history.pushState(null, "", `${destination.pathname}${destination.search}${destination.hash}`);
  target.scrollIntoView({ block: "start", behavior: "auto" });
  return true;
}

export function scrollToAbmReviewedSection(): boolean {
  const target = reviewedSection(window.location.hash);
  if (!target) return false;
  target.scrollIntoView({ block: "start", behavior: "auto" });
  return true;
}
