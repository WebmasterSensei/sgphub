"use client";
import { useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Loader2, RotateCcw, ZoomIn, ZoomOut, X } from "lucide-react";
import { getCroppedImg } from "@/lib/crop";

type AvatarCropModalProps = {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
};

export default function AvatarCropModal({
  imageSrc,
  onCancel,
  onCropped,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!croppedAreaPixels || applying) return;
    try {
      setApplying(true);
      setError(null);
      const file = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropped(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop the image.");
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--overlay)" }}
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <p className="text-sm font-semibold text-ink">Adjust your photo</p>
          <button
            onClick={onCancel}
            className="rounded-full p-1 transition hover:bg-hover"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-ink" />
          </button>
        </div>

        {/* Important: relative + fixed height so Cropper can size correctly */}
        <div className="relative h-72 w-full bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            zoomSpeed={0.05}
            zoomWithScroll
            restrictPosition
            minZoom={1}
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
            // Critical fix for Tailwind / CSS resets
            style={{
              containerStyle: { height: "100%", width: "100%" },
              mediaStyle: { maxWidth: "none" }, // ← this is the usual culprit
              cropAreaStyle: {},
            }}
            classes={{
              containerClassName: "",
              mediaClassName: "",
              cropAreaClassName: "",
            }}
            mediaProps={{}}
            cropperProps={{}}
            keyboardStep={1}
          />
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-ink-soft" />
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="w-full accent-[var(--accent)]"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-ink-soft" />
          </div>

          <div className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 shrink-0 text-ink-soft" />
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              aria-label="Rotate"
              className="w-full accent-[var(--accent)]"
            />
            <span className="w-8 shrink-0 text-right text-xs text-ink-muted">
              {rotation}°
            </span>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-hairline py-2.5 text-sm font-medium text-ink-soft transition hover:bg-hover"
            >
              Cancel
            </button>
            <button
              onClick={apply}
              disabled={applying || !croppedAreaPixels}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
            >
              {applying && <Loader2 className="h-4 w-4 animate-spin" />}
              {applying ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}