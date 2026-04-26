import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  rightSlot?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightSlot, className, id, ...props }, ref) => {
    const genId = useId();
    const inputId = id ?? genId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-body">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center gap-2 px-3 h-11 rounded-xl bg-input border transition-colors",
            error ? "border-danger/60 focus-within:border-danger" : "border-line focus-within:border-accent",
            className
          )}
        >
          <input
            id={inputId}
            ref={ref}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-faint disabled:opacity-60"
            {...props}
          />
          {rightSlot && <div className="text-subtle">{rightSlot}</div>}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
