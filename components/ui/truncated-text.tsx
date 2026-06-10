interface TruncatedTextProps {
  text: string;
  lines?: number;
  italic?: boolean;
  className?: string;
}

export function TruncatedText({
  text,
  lines = 2,
  italic = false,
  className = "",
}: TruncatedTextProps) {
  // for single-line truncation, use tailwind's truncate utility
  if (lines === 1) {
    return (
      <span
        className={`block min-w-0 w-full overflow-hidden truncate text-[var(--md-sys-color-on-surface-variant)] ${
          italic ? "italic" : ""
        } ${className}`}
        style={{
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {text}
      </span>
    );
  }

  // for multi-line truncation, use webkit box clamping
  return (
    <div
      className={`block min-w-0 w-full overflow-hidden text-sm text-[var(--md-sys-color-on-surface-variant)] ${
        italic ? "italic" : ""
      } ${className}`}
      style={{
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
      }}
    >
      {text}
    </div>
  );
}
