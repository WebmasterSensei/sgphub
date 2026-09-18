// components/imagelightbox.tsx — fullscreen image preview with navigation
"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ImageLightboxProps = {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
};

export default function ImageLightbox({
  images,
  initialIndex = 0,
  onClose
}: ImageLightboxProps) {
  const [index, setIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0))
  );
  const count = images.length;

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  if (count === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={onClose}
          className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close preview"
        >
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium text-white/80">
          {count > 1 ? `${index + 1} / ${count}` : "1 / 1"}
        </span>
        <div className="w-10" />
      </div>

      {/* Image */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-2 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt="preview"
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Controls */}
      {count > 1 && (
        <div
          className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={prev}
            aria-label="Previous image"
            className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Thumbnails */}
      {count > 1 && (
        <div
          className="flex items-center justify-center gap-2 pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`h-12 w-12 overflow-hidden rounded-lg transition ${
                i === index
                  ? "ring-2 ring-white"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}