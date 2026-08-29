import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(process.cwd(), "node_modules");
let bad = [];

function checkDir(dir) {
  const pkgPath = join(dir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg.name && (pkg.version === undefined || pkg.version === "" || typeof pkg.version !== "string")) {
        bad.push(`${dir} -> name=${pkg.name} version=${JSON.stringify(pkg.version)}`);
      }
    } catch (e) {
      bad.push(`${dir} -> UNPARSEABLE package.json: ${e.message}`);
    }
  }
}

function walk(dir, depth) {
  if (depth > 4) return;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = join(dir, e.name);
    if (e.name === ".bin") continue;
    checkDir(full);
    if (e.name.startsWith("@") || e.name === "node_modules") {
      walk(full, depth + 1);
    }
  }
}

walk(root, 0);
console.log("Bad packages found:", bad.length);
bad.forEach((b) => console.log(" ", b));
