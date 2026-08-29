import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 text-xs font-medium transition-colors mono",
  {
    variants: {
      variant: {
        default: "border-[#298dff]/40 bg-[#298dff]/10 text-[#54a6ff]",
        secondary: "border-[#1c2026] bg-[#131518] text-text-secondary",
        success: "border-[#298dff]/40 bg-[#298dff]/10 text-[#54a6ff]",
        warning: "border-[#ff6c3d]/40 bg-[#ff6c3d]/10 text-[#ff6c3d]",
        destructive: "border-[#ff3d3d]/40 bg-[#ff3d3d]/10 text-[#ff3d3d]",
        outline: "border-[#1c2026] text-text-primary",
        private: "border-[#298dff]/40 bg-[#298dff]/10 text-[#54a6ff]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      style={{ borderRadius: "2px" }}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
