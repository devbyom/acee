"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#000000]/85 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      style={{ borderRadius: "2px" }}
      className={cn(
        "relative border border-[#1c2026] bg-[#0d0f12] p-6 shadow-2xl text-text-primary",
        className
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-text-muted hover:bg-[#131518] hover:text-text-primary transition-colors"
          style={{ borderRadius: "2px" }}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mb-4 space-y-1", className)}>{children}</div>;
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className={cn("text-base font-medium tracking-tight text-text-primary", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-xs text-text-secondary", className)}>{children}</p>;
}
