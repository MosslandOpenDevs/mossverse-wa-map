/// <reference types="@workadventure/iframe-api-typings" />

console.info("Doors script loaded");

type DoorConfig = {
    area: string;
    closedLayer: string;
    openLayer: string;
};

type AreaBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

// Each area swaps a "closed" door layer for an "open" one while the player is
// inside. These layers live under the Tiled "doors" group, so they must be
// addressed by their full group path.
//
// Note: `roof_coworking_area` is ALSO handled in roofs.ts (it reveals the
// coworking roof/sign layers for the same area). The two files touch disjoint
// layers, so they don't conflict — but if you rename that area, update BOTH.
const doorConfigs: DoorConfig[] = [
    {
        area: "zone_office_meeting",
        closedLayer: "doors/door_office_meeting_closed",
        openLayer: "doors/door_office_meeting_opened",
    },
    {
        area: "roof_coworking_area",
        closedLayer: "doors/door_coworking_closed",
        openLayer: "doors/door_coworking_open",
    },
];

const setDoorOpen = (config: DoorConfig, open: boolean) => {
    if (open) {
        WA.room.hideLayer(config.closedLayer);
        WA.room.showLayer(config.openLayer);
    } else {
        WA.room.showLayer(config.closedLayer);
        WA.room.hideLayer(config.openLayer);
    }
};

const isInsideArea = (position: { x: number; y: number }, area: AreaBounds) => {
    return (
        position.x >= area.x &&
        position.x < area.x + area.width &&
        position.y >= area.y &&
        position.y < area.y + area.height
    );
};

type LayerLike = { name?: string; layers?: readonly LayerLike[] };

// Walks the Tiled layer tree and returns every layer's full path. Group layers
// prefix their children (e.g. "doors/door_coworking_open"), matching the names
// passed to WA.room.showLayer/hideLayer.
const collectLayerPaths = (
    layers: readonly LayerLike[],
    prefix = "",
    acc: Set<string> = new Set(),
): Set<string> => {
    for (const layer of layers) {
        if (typeof layer.name !== "string") continue;
        const path = prefix ? `${prefix}/${layer.name}` : layer.name;
        acc.add(path);
        if (Array.isArray(layer.layers)) collectLayerPaths(layer.layers, path, acc);
    }
    return acc;
};

// Logs (does not throw) when a referenced door layer no longer exists in the
// tilemap — catches the "renamed in Tiled, forgot to update doors.ts" class of
// bug early. WA.room.showLayer/hideLayer silently no-op on an unknown name, so
// without this a rename would break the doors with no signal. Mirrors roofs.ts.
const warnOnMissingLayers = async (): Promise<void> => {
    try {
        const tiledMap = (await WA.room.getTiledMap()) as { layers?: readonly LayerLike[] };
        const paths = collectLayerPaths(tiledMap.layers ?? []);
        const expected = doorConfigs.flatMap((c) => [c.closedLayer, c.openLayer]);
        const missing = expected.filter((name) => !paths.has(name));
        if (missing.length > 0) {
            console.error(
                `[doors] tilemap is missing expected layer(s): ${missing.join(", ")}. ` +
                    `show/hide calls for these layers will silently no-op.`,
            );
        }
    } catch (e) {
        console.warn("[doors] could not validate layer names:", e);
    }
};

// Waiting for the API to be ready
WA.onInit()
    .then(async () => {
        await warnOnMissingLayers();

        const initialPosition = await WA.player.getPosition();

        for (const config of doorConfigs) {
            const area = await WA.room.area.get(config.area);
            let isInside = isInsideArea(initialPosition, area);

            // Seed the door to match where the player actually spawns, rather
            // than relying on onEnter firing (it does not fire for an area the
            // player already starts inside). Without this, spawning inside a
            // zone would show a closed door across the doorway.
            setDoorOpen(config, isInside);

            WA.room.area.onEnter(config.area).subscribe(() => {
                if (isInside) return;
                isInside = true;
                setDoorOpen(config, true);
            });

            WA.room.area.onLeave(config.area).subscribe(() => {
                if (!isInside) return;
                isInside = false;
                setDoorOpen(config, false);
            });
        }
    })
    .catch((e) => console.error(e));

export {};
