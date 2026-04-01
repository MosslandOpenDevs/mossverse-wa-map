/// <reference types="@workadventure/iframe-api-typings" />

const GA4_MEASUREMENT_ID = "G-YJK1MCF4EW";

declare global {
  interface Window {
    dataLayer: any[];
  }
}

import "./roofs";
import "./meeting/doors";
import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.info("Script started successfully");

let currentPopup: any = undefined;

function initializeGa4(): void {
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    script.async = true;
    script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag(..._args: any[]) { window.dataLayer.push(arguments); }
        gtag("js", new Date());
        gtag("config", GA4_MEASUREMENT_ID, {
            send_page_view: false,   
        });

        const roomId = WA.room.id || "unknown";
        gtag("event", "page_view", {
            page_title: roomId,
            page_location: WA.room.mapURL || window.location.href,
            room_id: roomId,
        });
        gtag("event", "session_start_custom", {
            room: roomId,
        });

        console.info("GA4 loaded in main.ts");
    };
    script.onerror = () => {
        console.error("GA4 failed to load - sandbox may be blocking");
    };
    document.head.appendChild(script);
}

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.info("Scripting API ready");
    console.info("Player tags: ", WA.player.tags);

    initializeGa4();

    WA.room.area.onEnter("clock").subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes();
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    });

    WA.room.area.onLeave("clock").subscribe(closePopup);

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra().then(() => {
        console.info("Scripting API Extra ready");
    }).catch((e) => console.error(e));

}).catch((e) => console.error(e));

function closePopup() {
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};
