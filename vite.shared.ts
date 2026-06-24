import { LogLevel, OptimizeOptions } from "wa-map-optimizer-vite";

// Shared optimizer-options construction for both vite configs (web + buildmap),
// so the env parsing — including the tileset quality parseFloat — lives in one
// place instead of being copy-pasted (and fixed) twice.
export function buildOptimizerOptions(): OptimizeOptions {
    const optimizerOptions: OptimizeOptions = {
        logs:
            process.env.LOG_LEVEL && process.env.LOG_LEVEL in LogLevel
                ? LogLevel[process.env.LOG_LEVEL]
                : LogLevel.NORMAL,
    };

    if (process.env.TILESET_OPTIMIZATION && process.env.TILESET_OPTIMIZATION === "true") {
        // quality is a 0.0-1.0 fraction, so parse as float — parseInt("0.9") is 0,
        // which would silently collapse the range to [0, 1] and crush tileset quality.
        const qualityMin = process.env.TILESET_OPTIMIZATION_QUALITY_MIN ? parseFloat(process.env.TILESET_OPTIMIZATION_QUALITY_MIN) : 0.9;
        const qualityMax = process.env.TILESET_OPTIMIZATION_QUALITY_MAX ? parseFloat(process.env.TILESET_OPTIMIZATION_QUALITY_MAX) : 1;

        optimizerOptions.output = {
            tileset: {
                compress: {
                    quality: [qualityMin, qualityMax],
                },
            },
        };
    }

    return optimizerOptions;
}
