import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card border border-line shadow-card p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "danger" | "warning" | "info" | "critical";
}) {
  const tones = {
    neutral: "bg-line-strong text-subtle",
    success: "bg-[#113324] text-success border border-[#10b8804c]",
    danger: "bg-[#451a1a] text-danger border border-[#652a2a]",
    warning: "bg-[#3d2f15] text-amber-300 border border-[#5a4520]",
    info: "bg-[#1a2b4b] text-blue-300 border border-[#2a4365]",
    critical: "bg-pink-950/40 text-pink-300 border border-pink-900/50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="animate-spin text-subtle"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
      </svg>
      {label && <span className="text-sm text-subtle">{label}</span>}
    </div>
  );
}
