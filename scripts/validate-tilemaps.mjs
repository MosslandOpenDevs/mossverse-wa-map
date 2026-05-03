#!/usr/bin/env node
/**
 * Tilemap validator — runs before `npm run buildmap`.
 *
 * Purpose: detect the bug class that caused commits 96d5091 / 598f524 — empty
 * tile (id 0) holes inside the bounding box of an otherwise solid overlay
 * layer (e.g. silentOverlay). When this happens the player sees a bright spot
 * where the overlay should be opaque.
 *
 * Two checks per tile layer:
 *   1. Structural: data.length === width * height (catches truncation).
 *   2. Hole detection: for every layer matching FILL_LAYERS, scan inside the
 *      bounding box of non-zero tiles and report any 0 tiles.
 *
 * Add a new RegExp to FILL_LAYERS only when you've confirmed that layer is
 * intended to be solid within its visible region. Conservative defaults
 * avoid false positives on irregular shapes.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

/** Layers known to be solid within their bounding box. Add more on demand. */
const FILL_LAYERS = [
    /^silentOverlay$/,
];

const isFillLayer = (name) => FILL_LAYERS.some((p) => p.test(name));

/**
 * Returns the list of (row, col) coordinates that are 0 inside the bounding
 * box of non-zero tiles. Empty array means "no holes" or "layer is empty".
 */
function findHoles(layer) {
    const { width, height, data } = layer;
    let minR = Infinity;
    let maxR = -1;
    let minC = Infinity;
    let maxC = -1;

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            if (data[r * width + c] !== 0) {
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
                if (c < minC) minC = c;
                if (c > maxC) maxC = c;
            }
        }
    }
    if (maxR < 0) return []; // layer has no non-zero tiles, nothing to check

    const holes = [];
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            if (data[r * width + c] === 0) {
                holes.push({ row: r, col: c });
            }
        }
    }
    return holes;
}

function validateMap(filePath) {
    const map = JSON.parse(readFileSync(filePath, "utf8"));
    const errors = [];

    const walk = (layers) => {
        for (const layer of layers) {
            if (layer.type === "group" && Array.isArray(layer.layers)) {
                walk(layer.layers);
                continue;
            }
            if (layer.type !== "tilelayer") continue;

            const expected = layer.width * layer.height;
            if (!Array.isArray(layer.data) || layer.data.length !== expected) {
                errors.push({
                    file: filePath,
                    layer: layer.name,
                    kind: "length-mismatch",
                    expected,
                    actual: Array.isArray(layer.data) ? layer.data.length : "non-array",
                });
                continue;
            }

            if (!isFillLayer(layer.name)) continue;

            const holes = findHoles(layer);
            if (holes.length > 0) {
                const rows = holes.map((h) => h.row);
                const cols = holes.map((h) => h.col);
                errors.push({
                    file: filePath,
                    layer: layer.name,
                    kind: "holes",
                    count: holes.length,
                    rowRange: [Math.min(...rows), Math.max(...rows)],
                    colRange: [Math.min(...cols), Math.max(...cols)],
                });
            }
        }
    };

    walk(map.layers ?? []);
    return errors;
}

const tmjFiles = readdirSync(ROOT).filter((f) => f.endsWith(".tmj"));
if (tmjFiles.length === 0) {
    console.warn("[tilemap-validator] no .tmj files found in", ROOT);
    process.exit(0);
}

const allErrors = [];
for (const f of tmjFiles) {
    allErrors.push(...validateMap(join(ROOT, f)));
}

if (allErrors.length === 0) {
    console.info(`[tilemap-validator] OK (${tmjFiles.length} file(s) checked)`);
    process.exit(0);
}

console.error(`[tilemap-validator] FAIL — ${allErrors.length} issue(s):`);
for (const e of allErrors) {
    if (e.kind === "length-mismatch") {
        console.error(
            `  ${e.file} :: layer "${e.layer}" — data length ${e.actual} != expected ${e.expected}`
        );
    } else if (e.kind === "holes") {
        const [r0, r1] = e.rowRange;
        const [c0, c1] = e.colRange;
        console.error(
            `  ${e.file} :: layer "${e.layer}" — ${e.count} hole tile(s) ` +
                `at rows ${r0}-${r1}, cols ${c0}-${c1}`
        );
    }
}
process.exit(1);
