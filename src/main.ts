/// <reference types="@workadventure/iframe-api-typings" />

import "./roofs";
import "./meeting/doors";
import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.info('Script started successfully');

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.info('Scripting API ready');
    console.info('Player tags: ',WA.player.tags)

    // --- GA4 ---
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-MZ2G3PKPEK';
    script.async = true;
    script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) { window.dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-MZ2G3PKPEK');
        gtag('event', 'session_start_custom', {
            room: WA.room.id || 'unknown',
        });
        console.info('GA4 loaded in main.ts');
    };
    script.onerror = () => {
        console.error('GA4 failed to load - sandbox may be blocking');
    };
    document.head.appendChild(script);

    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes();
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    })

    WA.room.area.onLeave('clock').subscribe(closePopup)

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra().then(() => {
        console.info('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

function closePopup(){
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};
