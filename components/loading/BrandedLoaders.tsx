"use client";

type LoaderProps = {
  message: string;
  className?: string;
};

function LoaderMessage({ message }: { message: string }) {
  return (
    <p
      className="text-center text-base"
      style={{ color: "var(--md-sys-color-on-surface-variant)", letterSpacing: "0.01em" }}
    >
      {message}
      <span className="ml-1 inline-flex">
        <span className="animate-loader-dot-1">.</span>
        <span className="animate-loader-dot-2">.</span>
        <span className="animate-loader-dot-3">.</span>
      </span>
    </p>
  );
}

export function GentleWaveLoader({ message, className }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={`${message}, please wait`}
      className={className ?? "flex min-h-[40vh] items-center justify-center"}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative h-40 w-40 overflow-hidden rounded-full"
          style={{
            background: "var(--md-sys-color-surface)",
            boxShadow:
              "0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary-container) 35%, transparent), 0 8px 28px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent)",
          }}
        >
          <svg className="absolute left-0 top-0 h-full w-[200%]" viewBox="0 0 320 160" preserveAspectRatio="none">
            <path
              className="animate-wave-fill"
              d="M0 110 Q40 90 80 110 Q120 130 160 110 Q200 90 240 110 Q280 130 320 110 L320 160 L0 160 Z"
              fill="var(--md-sys-color-primary-container)"
              opacity="0.55"
            />
            <path
              className="animate-wave-secondary"
              d="M0 100 Q40 80 80 100 Q120 120 160 100 Q200 80 240 100 Q280 120 320 100 Q360 80 400 100 Q440 120 480 100 Q520 80 560 100 Q600 120 640 100"
              fill="none"
              stroke="var(--md-sys-color-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              className="animate-wave-primary"
              d="M0 90 Q40 68 80 90 Q120 112 160 90 Q200 68 240 90 Q280 112 320 90 Q360 68 400 90 Q440 112 480 90 Q520 68 560 90 Q600 112 640 90"
              fill="none"
              stroke="var(--md-sys-color-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <LoaderMessage message={message} />
      </div>
    </div>
  );
}

export function EnvelopeLoader({ message, className }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={`${message}, please wait`}
      className={className ?? "flex min-h-[40vh] items-center justify-center"}
    >
      <div className="flex flex-col items-center gap-7">
        <div className="relative flex h-[clamp(180px,32vw,360px)] w-[clamp(180px,32vw,360px)] items-center justify-center">
          <span className="absolute h-[clamp(55px,10vw,110px)] w-[clamp(80px,15vw,160px)] rounded-[6px] border-[2px] border-[var(--md-sys-color-primary)] animate-envelope-ring-1" />
          <span className="absolute h-[clamp(55px,10vw,110px)] w-[clamp(80px,15vw,160px)] rounded-[6px] border-[2px] border-[var(--md-sys-color-primary)] animate-envelope-ring-2" />
          <span className="absolute h-[clamp(55px,10vw,110px)] w-[clamp(80px,15vw,160px)] rounded-[6px] border-[2px] border-[var(--md-sys-color-primary)] animate-envelope-ring-3" />

          <div className="relative z-10 h-[clamp(55px,10vw,110px)] w-[clamp(80px,15vw,160px)] animate-envelope-pulse">
            <div
              className="absolute inset-0 overflow-hidden rounded-[3px] border-[1.5px]"
              style={{
                background: "var(--md-sys-color-surface)",
                borderColor: "color-mix(in srgb, var(--md-sys-color-primary) 40%, var(--md-sys-color-outline-variant))",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--md-sys-color-primary-container) 85%, transparent) 50%, transparent 50%), linear-gradient(225deg, color-mix(in srgb, var(--md-sys-color-primary-container) 85%, transparent) 50%, transparent 50%)",
                  backgroundSize: "50% 100%",
                  backgroundPosition: "left, right",
                  backgroundRepeat: "no-repeat",
                }}
              />
              <div
                className="absolute left-0 right-0 top-0 h-1/2"
                style={{
                  background: "color-mix(in srgb, var(--md-sys-color-primary) 38%, var(--md-sys-color-surface))",
                  clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
                }}
              />
            </div>
          </div>
        </div>

        <LoaderMessage message={message} />
      </div>
    </div>
  );
}

export default function LoaderAnimations() {
  return (
    <style jsx global>{`
      @keyframes loader-ellipsis {
        0%, 80%, 100% { opacity: 0.2; }
        40% { opacity: 1; }
      }

      @keyframes wave-drift {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      @keyframes envelope-pulse {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent));
        }
        40% {
          transform: scale(1.12);
          filter: drop-shadow(0 8px 24px color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent));
        }
      }

      @keyframes envelope-ring {
        0% {
          transform: scale(1);
          opacity: 0.55;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      .animate-loader-dot-1,
      .animate-loader-dot-2,
      .animate-loader-dot-3 {
        animation: loader-ellipsis 1.6s ease-in-out infinite;
      }

      .animate-loader-dot-2 { animation-delay: 0.2s; }
      .animate-loader-dot-3 { animation-delay: 0.4s; }

      .animate-wave-primary {
        animation: wave-drift 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }

      .animate-wave-secondary {
        animation: wave-drift 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite reverse;
      }

      .animate-wave-fill {
        animation: wave-drift 4.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }

      .animate-envelope-pulse {
        animation: envelope-pulse 2.4s ease-in-out infinite;
      }

      .animate-envelope-ring-1,
      .animate-envelope-ring-2,
      .animate-envelope-ring-3 {
        animation: envelope-ring 2.4s ease-out infinite;
      }

      .animate-envelope-ring-2 { animation-delay: 0.7s; }
      .animate-envelope-ring-3 { animation-delay: 1.4s; }
    `}</style>
  );
}
