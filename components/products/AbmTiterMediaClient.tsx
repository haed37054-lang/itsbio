"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";

export default function AbmTiterMediaClient({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);

  const openImage = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[data-titer-preview]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setImage({ src: link.getAttribute("href") || "", alt: link.dataset.alt || "Performance data" });
    dialog.current?.showModal();
  };

  return (
    <div id="qpcr-virus-titer-kits" className="qv-titer-lp" data-abm-titer-landing onClick={openImage}>
      {children}
      <dialog ref={dialog} className="titer-image-dialog" aria-labelledby="titer-image-title" onClose={() => setImage(null)}>
        <div className="titer-image-dialog-header">
          <h2 id="titer-image-title">{image?.alt || "Performance data"}</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close expanded data image">×</button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image.src} alt={image.alt} /> : null}
        <button className="orange-button" type="button" onClick={() => dialog.current?.close()}>Close</button>
      </dialog>
    </div>
  );
}
