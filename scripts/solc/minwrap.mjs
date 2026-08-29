// Minimal solc-js wrapper: loads the soljson emscripten module and exposes
// version() and compile(jsonString). Sufficient for standard-JSON compilation.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadSolc() {
  const soljson = require(resolve(__dirname, "soljson.js"));

  const version = soljson.cwrap("solidity_version", "string", []);

  // solidity_compile signature changed across versions; support the common one
  // (string, callbackPtr) and the newer (string, callbackPtr, contextPtr).
  const compileNative = soljson.cwrap("solidity_compile", "string", [
    "string",
    "number",
    "number",
  ]);

  function compile(input) {
    // No import callback needed: all sources are provided inline.
    return compileNative(input, 0, 0);
  }

  return { version: () => version(), compile };
}
