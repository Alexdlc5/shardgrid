// The save mirror in proto/platform.js (localStorage <-> native Preferences): the newer copy must win at launch.
// Runs platform.js in node with a fake Capacitor; each case imports a fresh copy of the module.
import assert from "node:assert/strict";

let n = 0;
async function launch(local, prefs) {
  const ls = new Map(Object.entries(local)), pf = new Map(Object.entries(prefs));
  globalThis.localStorage = { getItem: (k) => ls.get(k) ?? null, setItem: (k, v) => ls.set(k, String(v)) };
  globalThis.window = globalThis; globalThis.addEventListener = () => {};
  globalThis.Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios", Plugins: { Preferences: {
    get: async ({ key }) => ({ value: pf.get(key) ?? null }), set: async ({ key, value }) => { pf.set(key, value); } } } };
  const { platform } = await import(`../proto/platform.js?case=${++n}`);
  await new Promise((r) => setTimeout(r)); // let a fire-and-forget Preferences.set land
  return { ls, pf, platform };
}
const mirror = (t, json) => JSON.stringify([t, json]);

// iOS cleared the web storage: the native copy comes back
let r = await launch({}, { "gw.save": mirror(5, '{"gold":900}') });
assert.equal(r.ls.get("gw.save"), '{"gold":900}');
// the last localStorage write never reached disk (app killed): the newer native copy wins
r = await launch({ "gw.save": '{"gold":100}', "gw.save@": "4" }, { "gw.save": mirror(5, '{"gold":900}') });
assert.equal(r.ls.get("gw.save"), '{"gold":900}');
// localStorage is as new as the mirror: kept
r = await launch({ "gw.save": '{"gold":900}', "gw.save@": "5" }, { "gw.save": mirror(5, '{"gold":100}') });
assert.equal(r.ls.get("gw.save"), '{"gold":900}');
// first launch with the mirror: what's in localStorage is copied over
r = await launch({ "gw.save": '{"gold":42}' }, {});
assert.equal(JSON.parse(r.pf.get("gw.save"))[1], '{"gold":42}');
// a fresh install: nothing to restore, nothing written
r = await launch({}, {});
assert.equal(r.ls.get("gw.save"), undefined);
// every save write lands in both, stamped with the same time
r.platform.backup("gw.save", '{"gold":7}'); await new Promise((res) => setTimeout(res));
assert.equal(JSON.parse(r.pf.get("gw.save"))[0], +r.ls.get("gw.save@"));
console.log("save mirror ok");
