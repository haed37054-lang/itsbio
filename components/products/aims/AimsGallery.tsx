"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type GalleryImage = { url: string; width: number; height: number };
export default function AimsGallery({ images, title, application = false, accent = "sky", compact = false }: { images: GalleryImage[]; title: string; application?: boolean; accent?: "sky" | "red"; compact?: boolean }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const image = images[index] || images[0];
  if (!image) return null;
  return <div className="min-w-0">
    <button type="button" ref={trigger} onClick={() => dialog.current?.showModal()} aria-label={`Enlarge ${title} image ${index + 1}`} className={`relative block w-full overflow-hidden border border-slate-200 bg-white ${compact ? "aspect-[4/3] max-h-[380px] rounded-lg" : application ? "aspect-[4/3] max-h-[620px] rounded-2xl" : "aspect-square rounded-2xl"}`}><Image src={image.url} alt={`${title} image ${index + 1}`} fill quality={90} sizes={compact ? "(min-width: 1280px) 490px, (min-width: 1024px) 740px, (min-width: 768px) 45vw, 90vw" : application ? "(max-width: 1024px) 90vw, 900px" : "(max-width: 1024px) 90vw, 610px"} priority={!application} className={compact ? "object-contain p-2" : "object-contain p-5"} /></button>
    {images.length > 1 ? <div className="mt-4 flex gap-3 overflow-x-auto pb-2">{images.map((item, itemIndex) => <button type="button" key={item.url} onClick={() => setIndex(itemIndex)} aria-label={`View ${title} image ${itemIndex + 1}`} aria-pressed={index === itemIndex} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white ${index === itemIndex ? (accent === "red" ? "border-red-700 ring-1 ring-red-700" : "border-sky-700 ring-1 ring-sky-700") : (accent === "red" ? "border-slate-200 hover:border-red-300" : "border-slate-200 hover:border-sky-300")}`}><Image src={item.url} alt="" fill quality={90} sizes="80px" className="object-contain p-1" /></button>)}</div> : null}
    <dialog ref={dialog} onClose={() => trigger.current?.focus()} className="m-auto max-h-[94vh] w-[min(94vw,1100px)] max-w-none rounded-2xl border-0 bg-white p-4 shadow-xl backdrop:bg-slate-950/80">
      <div className="mb-2 flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-600">{title}{images.length > 1 ? ` · ${index + 1} / ${images.length}` : ""}</p><button type="button" onClick={() => dialog.current?.close()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Close ×</button></div>
      <div className="relative h-[75vh] w-full"><Image src={image.url} alt={`${title} image ${index + 1}`} fill quality={90} sizes="90vw" className="object-contain" /></div>
    </dialog>
  </div>;
}
