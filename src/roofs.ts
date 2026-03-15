/// <reference types="@workadventure/iframe-api-typings/iframe_api" />

console.info('Roofs Script started successfully');

/**
 * 건물별 roof 토글
 * 
 * 레이어 구조:
 *   📁 roof
 *     ├── conference  (1882 tiles)
 *     ├── meeting     (1438 tiles)
 *     ├── office      (1692 tiles)
 *     ├── showroom    (803 tiles)
 *     └── coworking   (1378 tiles)
 */

const ROOF_CONFIG = [
    { area: "roof_conference_area", layer: "roof/conference" },
    { area: "roof_office_area",     layer: "roof/office" },
    { area: "roof_meeting_area",    layer: "roof/meeting" },
    { area: "roof_show_area",       layer: "roof/showroom" },
    { area: "roof_coworking_area",  layer: "roof/coworking" },
];

// Waiting for the API to be ready
WA.onInit().then(() => {
    
    for (const { area, layer } of ROOF_CONFIG) {
        WA.room.area.onEnter(area).subscribe(() => {
            WA.room.hideLayer(layer);
        });
        WA.room.area.onLeave(area).subscribe(() => {
            WA.room.showLayer(layer);
        });
    }

    WA.room.area.onEnter("silentOffice_area").subscribe(() => {
        WA.room.showLayer("silentOverlay");
    });
    WA.room.area.onLeave("silentOffice_area").subscribe(() => {
        WA.room.hideLayer("silentOverlay"); 
    });

    /*
    WA.room.onEnterLayer("doorstep/zone_office").subscribe(() => {
        const players = WA.players.list();
        console.log("players");
        console.log(players);
        let admin: any;
        for (const player of players) {
            console.log(`Player ${player.name} is near you`);
            console.log(player);
            console.log(player.state.outlineColor);
            if(player.state._outlineColor == 1780289) {
                admin++
            }
        }
        if(admin != 0) {
            console.log("There is no admin");
        }
    }); 
      */
}).catch(e => console.error(e));

/*
const hideRoof1 = () => {
    WA.room.hideLayer("roof1");
    WA.room.hideLayer("sign1");
    WA.room.hideLayer("winter2");
}
const showRoof1 = () => {
    WA.room.showLayer("roof1");
    WA.room.showLayer("sign1");
    WA.room.showLayer("winter2");
}
const showRoof2 = () => {
    WA.room.showLayer("roof2");
    WA.room.showLayer("sign2");
    WA.room.showLayer("winter2");
}
const hideRoof2 = () => {
    WA.room.hideLayer("roof2");
    WA.room.hideLayer("sign2");
    WA.room.hideLayer("winter2");
}
*/

export {}
