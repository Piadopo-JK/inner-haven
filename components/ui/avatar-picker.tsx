"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import AvatarEditorLib, { type AvatarEditorRef } from "react-avatar-editor";

export type AvatarPickerHandle = {
  getAdjustedBlob: () => Promise<Blob | null>;
};

type AvatarPickerProps = {
  imageUrl: string | null;
  initials: string;
  initials_bg?: string;
  initials_fg?: string;
  displaySize?: "small" | "large";
};

const SMALL_W = 160;
const SMALL_H = 160;
const LARGE_W = 200;
const LARGE_H = 250;

export const AvatarPicker = forwardRef<AvatarPickerHandle, AvatarPickerProps>(
  function AvatarPicker(
    {
      imageUrl,
      initials,
      initials_bg = "var(--md-sys-color-primary-container)",
      initials_fg = "var(--md-sys-color-on-primary-container)",
      displaySize = "small",
    },
    ref,
  ) {
    const editorRef = useRef<AvatarEditorRef | null>(null);
    const isSizeSmall = displaySize === "small";
    const width  = isSizeSmall ? SMALL_W : LARGE_W;
    const height = isSizeSmall ? SMALL_H : LARGE_H;
    const borderRadius = isSizeSmall ? 80 : 0; // react-avatar-editor uses px integer
    const [scale, setScale] = useState(1);

    useImperativeHandle(ref, () => ({
      getAdjustedBlob: async () => {
        const editor = editorRef.current;
        if (!editor || !imageUrl) return null;
        const canvas = editor.getImage();
        return new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob: Blob | null) => resolve(blob), "image/jpeg", 0.95);
        });
      },
    }));

    if (!imageUrl) {
      return (
        <div
          className="flex items-center justify-center font-bold select-none shrink-0"
          style={{
            width,
            height,
            borderRadius: isSizeSmall ? "50%" : 0,
            background: initials_bg,
            color: initials_fg,
            fontSize: isSizeSmall ? 40 : 64,
          }}
        >
          {initials}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2">
        <AvatarEditorLib
          ref={editorRef}
          image={imageUrl}
          width={width}
          height={height}
          border={0}
          borderRadius={borderRadius}
          scale={scale}
          rotate={0}
          style={{ cursor: "grab" }}
        />
        <div className="flex items-center gap-2 w-full">
          <span className="text-[11px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--md-sys-color-primary)]"
          />
          <span className="text-[11px]" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>+</span>
        </div>
      </div>
    );
  },
);

