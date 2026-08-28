/**
 * Lordicon icons ship in their own palette (navy #121331 + teal #08A88A).
 * This rewrites those two brand colours to the site's own, so the icons match
 * the rest of the page without relying on the <lord-icon colors> attribute,
 * which only some icons honour.
 *
 * Usage:  node scripts/recolor-icons.mjs
 * Source: assets/lordicon-src/*.json  ->  public/icons/*.json
 *
 * Drop a freshly downloaded icon into assets/lordicon-src and re-run.
 */
import fs from "node:fs";
import path from "node:path";

const SRC = "assets/lordicon-src";
const OUT = "public/icons";

// Lordicon's own primary/secondary, mapped to --bone and --accent.
const MAP = new Map([
  ["18,19,49", [0xf1, 0xed, 0xe5]],
  ["8,168,138", [0xff, 0x4a, 0x1c]],
]);

// A few Lordicon icons use their palette the other way round, which would make
// them read as mostly accent. Flip the mapping for those.
const INVERTED = new Set(["gqzfzudq"]);

const key = (rgb) => rgb.map((v) => Math.round(v * 255)).join(",");

function recolor(node, map) {
  if (Array.isArray(node)) {
    node.forEach((child) => recolor(child, map));
    return;
  }
  if (!node || typeof node !== "object") return;

  // Shape fills and strokes.
  const isPaint = node.ty === "fl" || node.ty === "st";
  if (isPaint && node.c) swap(node.c, map);

  // Lordicon tints its layers with "Fill" effects named primary/secondary,
  // and those override the shape colours, so they have to be mapped too.
  if (node.ty === 2 && node.v) swap(node.v, map);

  Object.values(node).forEach((child) => recolor(child, map));
}

function swap(prop, map) {
  if (!Array.isArray(prop.k) || typeof prop.k[0] !== "number") return;
  const replacement = map.get(key(prop.k.slice(0, 3)));
  if (!replacement) return;
  prop.k = [...replacement.map((v) => v / 255), prop.k[3] ?? 1];
}

fs.mkdirSync(OUT, { recursive: true });

let count = 0;
for (const file of fs.readdirSync(SRC)) {
  if (!file.endsWith(".json")) continue;
  const data = JSON.parse(fs.readFileSync(path.join(SRC, file), "utf8"));
  const name = path.basename(file, ".json");
  const map = INVERTED.has(name)
    ? new Map([...MAP.entries()].map(([k, v], i, all) => [k, all[all.length - 1 - i][1]]))
    : MAP;
  recolor(data, map);
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(data));
  count += 1;
}

console.log(`recoloured ${count} icons -> ${OUT}`);
