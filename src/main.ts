/// <reference types="@workadventure/iframe-api-typings" />

type Gtag = (...args: unknown[]) => void;

const GA4_MEASUREMENT_ID = "G-MZ2G3PKPEK";
const GA4_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;

declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: Gtag;
  }
}

import "./roofs";
import "./meeting/doors";
import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.info("Script started successfully");

let currentPopup: any = undefined;

function getGtag(): Gtag {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
        window.gtag = (...args: unknown[]) => {
            window.dataLayer.push(args);
        };
    }

    return window.gtag;
}

function getRoomAnalyticsContext() {
    const roomId = WA.room.id || "unknown";
    const mapUrl = WA.room.mapURL || window.location.href;
    const entrySource = new URLSearchParams(WA.room.hashParameters).toString() || "direct";

    let pagePath = `/${roomId}`;
    try {
        const parsedMapUrl = new URL(mapUrl, window.location.href);
        pagePath = `${parsedMapUrl.pathname}${parsedMapUrl.hash}` || pagePath;
    } catch (_error) {
        console.warn("Failed to parse WA.room.mapURL for GA4 page_path", mapUrl);
    }

    return {
        roomId,
        mapUrl,
        pagePath,
        entrySource,
    };
}

function initializeGa4(): void {
    const gtag = getGtag();
    const script = document.createElement("script");

    gtag("js", new Date());
    gtag("config", GA4_MEASUREMENT_ID, {
        send_page_view: false,
    });

    script.src = GA4_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
        const { roomId, mapUrl, pagePath, entrySource } = getRoomAnalyticsContext();

        gtag("event", "page_view", {
            page_title: roomId,
            page_location: mapUrl,
            page_path: pagePath,
            room_id: roomId,
            entry_source: entrySource,
        });
        gtag("event", "session_start_custom", {
            room: roomId,
            entry_source: entrySource,
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
