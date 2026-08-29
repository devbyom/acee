import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        style={{ borderRadius: "2px" }}
        className={cn(
          "flex h-10 w-full border border-[#1c2026] bg-[#000000] px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:border-[#298dff] focus-visible:ring-1 focus-visible:ring-[#298dff] disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
