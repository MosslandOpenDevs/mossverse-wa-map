#!/usr/bin/env node
/**
 * Tilemap validator — runs before `npm run buildmap`.
 *
 * Purpose: detect the bug class that caused commits 96d5091 / 598f524 — empty
 * tile (id 0) holes enclosed by an otherwise solid overlay layer (e.g.
 * silentOverlay). When this happens the player sees a bright spot where the
 * overlay should be opaque.
 *
 * Two checks per tile layer:
 *   1. Structural: data.length === width * height (catches truncation).
 *   2. Hole detection: for every layer matching FILL_LAYERS, flood-fill the 0
 *      tiles reachable from the map border ("exterior") and report any 0 tile
 *      that is NOT border-reachable (i.e. enclosed by solid tiles). This finds
 *      holes anywhere — including ones that touch the solid region's edge — and
 *      does not false-positive on the open boundary of a non-rectangular fill.
 *
 * Layers using base64/compressed encoding or infinite-map chunks are skipped
 * with a warning (this validator only understands flat numeric `data` arrays).
 *
 * Add a new RegExp to FILL_LAYERS only when you've confirmed that layer is
 * intended to be solid within its visible region.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

/** Layers known to be solid within their visible region. Add more on demand. */
const FILL_LAYERS = [
    /^silentOverlay$/,
];

const isFillLayer = (name) => FILL_LAYERS.some((p) => p.test(name));

/**
 * Returns the (row, col) coordinates of every 0 tile enclosed by non-zero
 * tiles — i.e. 0 tiles that cannot be reached from the map border by walking
 * through other 0 tiles (4-connectivity). Empty array means "no enclosed
 * holes" (a fully solid layer, or one whose only gaps open to the edge).
 */
function findHoles(layer) {
    const { width, height, data } = layer;
    const isEmpty = (r, c) => data[r * width + c] === 0;

    // Mark every 0 tile reachable from the border as "exterior" background.
    const exterior = new Uint8Array(width * height);
    const stack = [];
    const visit = (r, c) => {
        if (r < 0 || c < 0 || r >= height || c >= width) return;
        const idx = r * width + c;
        if (exterior[idx] || !isEmpty(r, c)) return;
        exterior[idx] = 1;
        stack.push(idx);
    };
    for (let c = 0; c < width; c++) {
        visit(0, c);
        visit(height - 1, c);
    }
    for (let r = 0; r < height; r++) {
        visit(r, 0);
        visit(r, width - 1);
    }
    while (stack.length > 0) {
        const idx = stack.pop();
        const r = Math.floor(idx / width);
        const c = idx % width;
        visit(r - 1, c);
        visit(r + 1, c);
        visit(r, c - 1);
        visit(r, c + 1);
    }

    // Any 0 tile not reached from the border is enclosed → a hole.
    const holes = [];
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            if (isEmpty(r, c) && !exterior[r * width + c]) {
                holes.push({ row: r, col: c });
            }
        }
    }
    return holes;
}

let fillLayerMatches = 0;

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

            // The checks below assume a flat numeric `data` array. Skip (with a
            // warning) layers this validator cannot read rather than reporting a
            // misleading length-mismatch failure.
            if (layer.encoding && layer.encoding !== "csv") {
                console.warn(
                    `[tilemap-validator] skipping "${layer.name}" in ${filePath}: ` +
                        `"${layer.encoding}"-encoded layers are not supported.`
                );
                continue;
            }
            if (Array.isArray(layer.chunks)) {
                console.warn(
                    `[tilemap-validator] skipping "${layer.name}" in ${filePath}: ` +
                        `infinite-map chunked layers are not supported.`
                );
                continue;
            }

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
            fillLayerMatches++;

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

// A rename of every FILL_LAYER would otherwise make the hole check a silent
// no-op while still printing "OK". Surface that so the guard can't quietly die.
if (fillLayerMatches === 0) {
    console.warn(
        `[tilemap-validator] note: no layer matched FILL_LAYERS ` +
            `(${FILL_LAYERS.map((p) => p.toString()).join(", ")}) in any map — ` +
            `hole detection ran on nothing. Check layer names if this is unexpected.`
    );
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
            `  ${e.file} :: layer "${e.layer}" — ${e.count} enclosed hole tile(s) ` +
                `at rows ${r0}-${r1}, cols ${c0}-${c1}`
        );
    }
}
process.exit(1);
