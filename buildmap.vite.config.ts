import 'dotenv/config';
import { defineConfig } from "vite";
import { getMaps, getMapsOptimizers, getMapsScripts } from "wa-map-optimizer-vite";
import { buildOptimizerOptions } from "./vite.shared";

const maps = getMaps();

const optimizerOptions = buildOptimizerOptions();

export default defineConfig({
    base: "./",
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                ...getMapsScripts(maps),
            },
        },
    },
    plugins: [
        ...getMapsOptimizers(maps, optimizerOptions),
    ],
});
