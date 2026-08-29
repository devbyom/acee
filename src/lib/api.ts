import { NextResponse } from "next/server";
import { ValidationError } from "./validation";

/** Standard error -> JSON response mapping for API routes. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  // Never leak stack traces or secrets; return a clean message.
  return NextResponse.json({ error: message }, { status: 500 });
}
