/// <reference types="@workadventure/iframe-api-typings/iframe_api" />

console.info("Roofs Script started successfully");

type RoofConfig = {
    area: string;
    layers: string[];
};

type AreaBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const roofConfigs: RoofConfig[] = [
    {
        area: "roof_conference_area",
        layers: ["roof_conference", "sign_conference"],
    },
    {
        area: "roof_office_area",
        layers: ["roof_office", "sign_office"],
    },
    {
        area: "roof_coworking_area",
        layers: ["roof_coworking", "sign_coworking"],
    },
    {
        area: "roof_meeting_area",
        layers: ["roof_meeting", "sign_meeting"],
    },
    {
        area: "roof_show_area",
        layers: ["roof_show", "sign_show"],
    },
];

const setLayersVisible = (layers: string[], visible: boolean) => {
    for (const layer of layers) {
        if (visible) {
            WA.room.showLayer(layer);
        } else {
            WA.room.hideLayer(layer);
        }
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

WA.onInit()
    .then(async () => {
        const initialPosition = await WA.player.getPosition();

        for (const config of roofConfigs) {
            const area = await WA.room.area.get(config.area);
            let isInside = isInsideArea(initialPosition, area);

            setLayersVisible(config.layers, !isInside);

            WA.room.area.onEnter(config.area).subscribe(() => {
                if (isInside) return;
                isInside = true;
                setLayersVisible(config.layers, false);
            });

            WA.room.area.onLeave(config.area).subscribe(() => {
                if (!isInside) return;
                isInside = false;
                setLayersVisible(config.layers, true);
            });
        }

        const silentOfficeArea = await WA.room.area.get("silentOffice_area");
        if (isInsideArea(initialPosition, silentOfficeArea)) {
            WA.room.showLayer("silentOverlay");
        } else {
            WA.room.hideLayer("silentOverlay");
        }

        WA.room.area.onEnter("silentOffice_area").subscribe(() => {
            WA.room.showLayer("silentOverlay");
        });

        WA.room.area.onLeave("silentOffice_area").subscribe(() => {
            WA.room.hideLayer("silentOverlay");
        });
    })
    .catch((error) => console.error(error));

export {};
