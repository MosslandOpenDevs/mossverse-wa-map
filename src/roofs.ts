/// <reference types="@workadventure/iframe-api-typings/iframe_api" />

console.info("Roofs Script started successfully");

type RoofConfig = {
    area: string;
    layers: string[];
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

WA.onInit()
    .then(() => {
        for (const config of roofConfigs) {
            let activeVisitors = 0;

            WA.room.area.onEnter(config.area).subscribe(() => {
                activeVisitors += 1;
                if (activeVisitors === 1) {
                    setLayersVisible(config.layers, false);
                }
            });

            WA.room.area.onLeave(config.area).subscribe(() => {
                activeVisitors = Math.max(0, activeVisitors - 1);
                if (activeVisitors === 0) {
                    setLayersVisible(config.layers, true);
                }
            });
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
