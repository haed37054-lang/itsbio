"use client";

import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from "react";
import { findRtProduct } from "@/lib/abm/rt-product-finder";

type FinderProduct = { name: string; href: string; badges: string[]; reason: string; note: string };
type Props = { html: string; className: string; finderProducts?: Record<string, FinderProduct> };
const EMPTY_PRODUCTS: Record<string, FinderProduct> = {};

/** Only reviewed build-time HTML enters this component. Supplier scripts and
 * integrations are removed by refresh-abm-general-landings.mjs. */
export default function AbmGeneralLanding({ html, className, finderProducts = EMPTY_PRODUCTS }: Props) {
  const content = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [image, setImage] = useState<{ src: string; alt: string; description?: string } | null>(null);
  // Dialog state must not replace the HTML DOM and reset choices, tabs or FAQs.
  const reviewedContent = useMemo(() => (
    <div ref={content} className={`abm-general-reviewed ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  ), [html, className]);

  useEffect(() => {
    const root = content.current;
    if (!root) return;
    const form = root.querySelector<HTMLFormElement>("#rtFinderBalanced");
    const conditional = root.querySelector<HTMLElement>("#b-cdna-questions");
    const result = root.querySelector<HTMLElement>("#b-finder-result");
    const message = root.querySelector<HTMLElement>("#b-finder-msg");
    const clear = () => {
      form?.reset();
      if (conditional) conditional.hidden = true;
      if (message) message.textContent = "";
      result?.classList.remove("has-result");
    };
    const onChange = () => {
      if (!form || !conditional) return;
      const application = new FormData(form).get("application");
      conditional.hidden = application !== "cdna";
      if (conditional.hidden) conditional.querySelectorAll<HTMLInputElement>("input").forEach((input) => { input.checked = false; });
    };
    const onSubmit = (event: Event) => {
      event.preventDefault();
      if (!form || !result || !message) return;
      const values = new FormData(form);
      const answers = Object.fromEntries(["application", "gdna", "sample", "format"].map((name) => [name, String(values.get(name) || "")]));
      const sku = findRtProduct(answers);
      const product = sku ? finderProducts[sku] : undefined;
      if (!product) {
        result.classList.remove("has-result");
        message.textContent = answers.application ? "Please answer the three first-strand cDNA questions." : "Choose your application first.";
        return;
      }
      message.textContent = "";
      for (const [selector, value] of [["#b-result-name", product.name], ["#b-result-reason", product.reason], ["#b-result-note", product.note]]) {
        const field = root.querySelector<HTMLElement>(selector);
        if (field) field.textContent = value;
      }
      const link = root.querySelector<HTMLAnchorElement>("#b-result-link");
      if (link) link.href = product.href;
      const badges = root.querySelector<HTMLElement>("#b-result-badges");
      if (badges) badges.replaceChildren(...product.badges.map((text) => {
        const span = document.createElement("span"); span.textContent = text; return span;
      }));
      result.classList.add("has-result");
    };
    const activate = (parent: Element, attribute: string, value: string) => {
      parent.querySelectorAll<HTMLElement>(`[data-${attribute}]`).forEach((button) => {
        const active = button.getAttribute(`data-${attribute}`) === value;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      parent.querySelectorAll<HTMLElement>(`[data-${attribute}-panel]`).forEach((panel) => {
        const active = panel.getAttribute(`data-${attribute}-panel`) === value;
        panel.classList.toggle("active", active); panel.hidden = !active;
      });
    };
    const onClick = (event: Event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLElement>("button") : null;
      if (!button) return;
      if (button.id === "b-finder-reset") clear();
      if (button.dataset.family) activate(root, "family", button.dataset.family);
      if (button.dataset.product) activate(button.closest(".family-panel") || root, "product", button.dataset.product);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[role='tab']") : null;
      if (!button || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const parent = button.parentElement;
      const tabs = parent ? Array.from(parent.querySelectorAll<HTMLButtonElement>("button[role='tab']")) : [];
      const current = tabs.indexOf(button);
      if (current < 0 || tabs.length < 2) return;
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[index].click(); tabs[index].focus();
    };
    form?.addEventListener("change", onChange);
    form?.addEventListener("submit", onSubmit);
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      form?.removeEventListener("change", onChange);
      form?.removeEventListener("submit", onSubmit);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [html, finderProducts]);

  const openImage = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-general-image]");
    const img = button?.querySelector<HTMLImageElement>("img");
    if (!img || !img.getAttribute("src")?.startsWith("/images/abm/general/")) return;
    setImage({ src: button?.getAttribute("data-full-image") || img.getAttribute("src")!, alt: img.alt,
      description: button?.getAttribute("data-caption") || img.closest(".figure-card")?.querySelector(".figure-details")?.textContent?.trim() });
    dialog.current?.showModal();
  };

  return (
    <div onClick={openImage}>
      {reviewedContent}
      <dialog ref={dialog} className="abm-general-image-dialog" aria-labelledby={titleId} onClose={() => setImage(null)}>
        <div className="abm-general-dialog-heading">
          <h2 id={titleId}>{image?.alt || "Official ABM image"}</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close expanded image">×</button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image.src} alt={image.alt} /> : null}
        {image?.description ? <p className="mt-5 leading-7 text-[#374151]">{image.description}</p> : null}
      </dialog>
    </div>
  );
}
