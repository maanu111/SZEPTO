"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { formatBytes, readImageDownscaled, validateImage } from "@/lib/imageFile";
import { CheckIcon, CloseIcon } from "@/components/icons";

type Props = {
  value: string | null;
  /** The File is passed through so checkout can upload the original to storage. */
  onChange: (
    dataUrl: string | null,
    meta: { name: string; size: number } | null,
    file: File | null
  ) => void;
  fileMeta: { name: string; size: number } | null;
};

/** Drop/choose a UPI payment screenshot, with preview and validation. */
export function PaymentUpload({ value, onChange, fileMeta }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    const invalid = validateImage(file);
    if (invalid) {
      setError(invalid);
      onChange(null, null, null);
      return;
    }

    setBusy(true);
    try {
      const { dataUrl } = await readImageDownscaled(file);
      onChange(dataUrl, { name: file.name, size: file.size }, file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
      onChange(null, null, null);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    onChange(null, null, null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-label="Payment screenshot"
      />

      {value ? (
        <div className="flex items-start gap-3 rounded-xl border border-save-500 bg-save-50 p-3">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-white">
            <Image src={value} alt="Payment screenshot preview" fill sizes="80px" className="object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-save-500">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-save-500 text-white">
                <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />
              </span>
              Screenshot uploaded
            </p>
            {fileMeta && (
              <p className="mt-1 truncate text-[11px] text-ink-500">
                {fileMeta.name} &middot; {formatBytes(fileMeta.size)}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={clear}
                className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
              >
                <CloseIcon className="h-2.5 w-2.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
            dragging
              ? "border-accent-500 bg-accent-50"
              : error
                ? "border-red-300 bg-red-50"
                : "border-ink-200 hover:border-accent-500 hover:bg-accent-50"
          }`}
        >
          <span className="text-[13px] font-bold text-ink-900">
            {busy ? "Processing…" : "Upload payment screenshot"}
          </span>
          <span className="text-[11px] text-ink-500">
            Tap to choose, or drag an image here &middot; PNG, JPG or WEBP
          </span>
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
