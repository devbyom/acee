import { isAddress, getAddress } from "viem";

export class ValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Validate + checksum an EVM address. Throws ValidationError if invalid. */
export function validateAddress(value: unknown, field = "address"): `0x${string}` {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new ValidationError(`Invalid ${field}: not a valid EVM address.`);
  }
  return getAddress(value);
}

/**
 * Validate a positive token amount (decimal string).
 * Rejects zero, negative, NaN, and non-finite values.
 */
export function validateAmount(value: unknown, field = "amount"): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ValidationError(`Invalid ${field}: must be a string or number.`);
  }
  const str = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(str)) {
    throw new ValidationError(`Invalid ${field}: must be a positive decimal number.`);
  }
  const n = Number(str);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidationError(`Invalid ${field}: must be greater than zero.`);
  }
  return str;
}

export function validateAsset(value: unknown): string {
  const allowed = ["USDC", "MON"];
  const asset = typeof value === "string" ? value.toUpperCase() : "";
  if (!allowed.includes(asset)) {
    throw new ValidationError(`Invalid asset: must be one of ${allowed.join(", ")}.`);
  }
  return asset;
}

export function validateOutcome(value: unknown): string {
  const outcome = typeof value === "string" ? value.toUpperCase() : "";
  if (outcome !== "YES" && outcome !== "NO") {
    throw new ValidationError("Invalid outcome: must be YES or NO.");
  }
  return outcome;
}

export function validateNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`Invalid ${field}: must be a non-empty string.`);
  }
  return value.trim();
}
