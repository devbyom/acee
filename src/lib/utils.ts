import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shorten a hex hash/address for display: 0x8f92...ab31 */
export function shortHash(value?: string | null, head = 6, tail = 4): string {
  if (!value) return "";
  if (value.length <= head + tail + 2) return value;
  return `${value.slice(0, head + 2)}...${value.slice(-tail)}`;
}

/** Format a token amount string for display. */
export function formatAmount(amount: string | number, maxFractionDigits = 4): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return String(amount);
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}
