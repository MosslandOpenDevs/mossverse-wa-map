import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Script } from "node:vm";

// Exercise the installed dependency after patch-package, not a copied handler.
// initDoorstep is private, so extract it between asserted top-level boundaries.
const dependencyUrl = new URL(
    "../node_modules/@workadventure/scripting-api-extra/dist/Features/doors.js",
    import.meta.url,
);
const source = readFileSync(dependencyUrl, "utf8");
const start = source.indexOf("function initDoorstep(");
const end = source.indexOf("\nfunction playBellSound(", start);
assert.ok(start >= 0 && end > start, "Dependency changed: review the initDoorstep extraction boundaries");
const initDoorstepScript = new Script(`(${source.slice(start, end)})`, {
    filename: dependencyUrl.pathname,
});

function createDoor(zoneType, initiallyOpen) {
    const callbacks = {};
    const writes = [];
    let variableListener;
    const state = new Proxy({
        doorOffice: initiallyOpen,
        onVariableChange(name) {
            assert.equal(name, "doorOffice");
            return { subscribe(callback) { variableListener = callback; } };
        },
    }, {
        set(target, name, value) {
            assert.equal(name, "doorOffice");
            writes.push(value);
            target[name] = value;
            variableListener?.();
            return true;
        },
    });
    const listen = (action) => (name) => {
        assert.equal(name, "zone_office");
        return { subscribe(callback) { callbacks[action] = callback; } };
    };
    const room = zoneType === "tilelayer"
        ? { onEnterLayer: listen("enter"), onLeaveLayer: listen("leave") }
        : { area: { onEnter: listen("enter"), onLeave: listen("leave") } };
    const WA = { state, room, player: { tags: [] } };
    const initDoorstep = initDoorstepScript.runInNewContext({ WA });
    const properties = {
        getString() { return undefined; },
        getBoolean(name) { return name === "autoOpen" || name === "autoClose"; },
    };
    initDoorstep(
        { name: "zone_office", type: zoneType },
        { name: "doorOffice" },
        properties,
        "unused",
    );
    assert.equal(typeof callbacks.enter, "function");
    assert.equal(typeof callbacks.leave, "function");
    return { state, writes, ...callbacks };
}

// These callbacks model the documented event payloads. This is a dependency
// regression test, not an end-to-end test of WorkAdventure's event delivery.
for (const zoneType of ["area", "tilelayer"]) {
    test(`${zoneType}: initial leave cannot close an already open shared door`, () => {
        const door = createDoor(zoneType, true);
        door.leave({ reason: "initial" });
        assert.equal(door.state.doorOffice, true);
        assert.deepEqual(door.writes, [], "An outside newcomer must not write shared door state");
    });

    test(`${zoneType}: initial enter still opens the door`, () => {
        const door = createDoor(zoneType, false);
        door.enter({ reason: "initial" });
        assert.equal(door.state.doorOffice, true);
        assert.deepEqual(door.writes, [true]);
    });

    test(`${zoneType}: real movement still opens and closes the door`, () => {
        const door = createDoor(zoneType, false);
        door.enter({ reason: "move" });
        assert.equal(door.state.doorOffice, true);
        door.leave({ reason: "move" });
        assert.equal(door.state.doorOffice, false);
        assert.deepEqual(door.writes, [true, false]);
    });

    test(`${zoneType}: legacy undefined events work without an initial enter`, () => {
        const door = createDoor(zoneType, true);
        // v1.28.9 can spawn inside without an enter callback. Its first real
        // leave must close the door, so a generic wasInside guard is unsuitable.
        door.leave();
        assert.equal(door.state.doorOffice, false);
        door.enter();
        assert.equal(door.state.doorOffice, true);
        door.leave();
        assert.equal(door.state.doorOffice, false);
        assert.deepEqual(door.writes, [false, true, false]);
    });
}
