"use client";

import { useId, useRef, useState, type MouseEvent, type ReactNode } from "react";

export default function AbmLibraryMediaClient({ children }: { children: ReactNode }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  const openImage = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[data-library-preview]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const src = link.getAttribute("href") || "";
    if (!src.startsWith("/images/abm/library/")) return;
    event.preventDefault();
    setImage({ src, alt: link.dataset.alt || "Library resource image" });
    dialog.current?.showModal();
  };
  return (
    <div className="abm-library-content" onClick={openImage}>
      {children}
      <dialog ref={dialog} className="abm-library-image-dialog" aria-labelledby={titleId} onClose={() => setImage(null)}>
        <div className="abm-library-dialog-heading">
          <h2 id={titleId}>{image?.alt || "Library resource image"}</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close expanded library image">×</button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image.src} alt={image.alt} /> : null}
        <button type="button" className="abm-library-dialog-close" onClick={() => dialog.current?.close()}>Close</button>
      </dialog>
    </div>
  );
}
