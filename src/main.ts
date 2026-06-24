/// <reference types="@workadventure/iframe-api-typings" />

const GA4_MEASUREMENT_ID = "G-MZ2G3PKPEK";

// Typed surface for the GA4 dataLayer queue. Our code only ever pushes
// `arguments` objects via the gtag() snippet below, so IArguments[] accurately
// describes our usage. The GA4 script consumes this without using our types.
declare global {
  interface Window {
    dataLayer: IArguments[];
  }
}

// Constrains gtag call sites at compile time without changing the GA4
// runtime snippet (which still pushes the real `arguments` object).
type GtagArgs =
    | ["js", Date]
    | ["config", string, Record<string, unknown>?]
    | ["event", string, Record<string, unknown>?]
    | ["set", Record<string, unknown>];

import "./roofs";
import "./meeting/doors";
import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.info("Script started successfully");

let currentPopup: ReturnType<typeof WA.ui.openPopup> | undefined = undefined;

function initializeGa4(): void {
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    script.async = true;
    script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        // GA4 official snippet: must push the live `arguments` object (not a
        // copy) so GTM can introspect the call. Do not refactor to `_args`.
        function gtag(..._args: GtagArgs) { window.dataLayer.push(arguments); }
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

    // Give logged-in players a colored name outline by tier so they're
    // visually distinct from guests (and from each other). The outline color
    // syncs to other players too. Holder outranks member. Tags are guaranteed
    // populated here (inside onInit).
    if (WA.player.tags.includes("holder")) {
        WA.player.setOutlineColor(255, 215, 0) // gold — token/NFT holder
            .catch((e) => console.error(e));
    } else if (WA.player.tags.includes("member")) {
        WA.player.setOutlineColor(110, 231, 183) // brand teal — member
            .catch((e) => console.error(e));
    }

    initializeGa4();

    WA.room.area.onEnter("clock").subscribe(() => {
        // Close any popup left open by a prior enter first, so an overlapping or
        // re-entrant enter (e.g. a teleport landing inside the area) can't orphan
        // the previous handle and leak an un-closeable popup.
        closePopup();
        const today = new Date();
        const hh = String(today.getHours()).padStart(2, "0");
        const mm = String(today.getMinutes()).padStart(2, "0");
        const time = hh + ":" + mm;
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
