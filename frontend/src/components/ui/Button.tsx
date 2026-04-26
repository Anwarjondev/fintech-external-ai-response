import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
};

const variants = {
  primary: "bg-accent text-white hover:bg-blue-600",
  secondary: "bg-input border border-line-stronger text-white hover:bg-[#333]",
  ghost: "text-body hover:bg-input",
  success: "bg-[#1a3a24] border border-[#2a5a3a] text-success hover:bg-[#1f4a2c]",
  danger: "bg-[#451a1a] border border-[#652a2a] text-danger hover:bg-[#5a2222]",
};

const sizes = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-[15px] rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-ring disabled:opacity-60",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

function Spinner({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
    </svg>
  );
}
