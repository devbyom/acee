import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#298dff] disabled:pointer-events-none disabled:opacity-40 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-[#298dff] text-white hover:bg-[#1a7ae6] shadow-[0_0_20px_rgba(41,141,255,0.35)]",
        destructive:
          "bg-[#ff3d3d] text-white hover:bg-[#e02e2e] shadow-[0_0_20px_rgba(255,61,61,0.35)]",
        outline:
          "border border-[#1c2026] bg-[#0d0f12] text-text-primary hover:bg-[#131518] hover:border-[#298dff]/50",
        secondary:
          "border border-[#1c2026] bg-[#131518] text-text-primary hover:bg-[#1c2026]",
        ghost: "hover:bg-[#131518] text-text-primary hover:text-[#298dff]",
        success:
          "bg-[#298dff] text-white hover:bg-[#1a7ae6] shadow-[0_0_20px_rgba(41,141,255,0.35)]",
        link: "text-[#298dff] underline-offset-4 hover:underline",
        suiOutline:
          "border border-[#298dff]/50 bg-[#298dff]/10 text-[#54a6ff] hover:bg-[#298dff]/20 hover:border-[#298dff]",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-sm font-medium",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        style={{ borderRadius: "2px" }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
