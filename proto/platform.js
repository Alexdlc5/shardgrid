// Platform services: ads, purchases, analytics, Game Center leaderboards.
// In the Capacitor app the native plugins are reached through window.Capacitor.Plugins (no bundler needed);
// in a plain browser everything is a harmless stand-in, so the prototype keeps working as before.
const cap = window.Capacitor, native = !!cap?.isNativePlatform?.(), os = cap?.getPlatform?.() || "web";
const { AdMob, Purchases, FirebaseAnalytics, FirebaseRemoteConfig, FirebaseCrashlytics, Preferences, GameCenter } = cap?.Plugins || {}; // GameCenter: ios/App/App/GameCenterPlugin.swift
export const VERSION = "dev"; // scripts/build-web.mjs writes "1.0 (build)" here
const PRIVACY_URL = "https://alexdlc5.github.io/privacy.html";

// Fill these from your accounts (docs/SETUP.md). The defaults are Google's public *test* ad units: safe to ship to
// testers, never earn money. Empty RevenueCat key = purchases switched off.
const KEYS = {
  rewarded:     { android: "ca-app-pub-3940256099942544/5224354917", ios: "ca-app-pub-2020120570370273/2608861706" },
  interstitial: { android: "ca-app-pub-3940256099942544/1033173712", ios: "ca-app-pub-2020120570370273/7053794160" },
  banner:       { android: "ca-app-pub-3940256099942544/6300978111", ios: "ca-app-pub-2020120570370273/1506698874" },
  revenuecat:   { android: "", ios: "appl_ouESHyvltDiYgjdswFfbJZPEljf" }, // public SDK key; TestFlight buys go through Apple's sandbox (a test_ key closes release builds)
  testAds: true, // iOS units are real; test ads stay on for TestFlight. The ios workflow's "appstore" input builds with false
};
export const NO_ADS = "no_ads"; // RevenueCat entitlement id
// Coin packs: consumables in the RevenueCat offering "coins" (no entitlement). Tune gold here. bonus is the "+x% extra" tag:
// gold per US dollar over the Pouch's, rounded down so it never overstates (proto/check.mjs checks). Sized from proto/economy.mjs:
// an early dig pays ~500 gold, a late one with tools ~40-60k, so the Pouch is 2-3 early digs and the Hoard ~1% of the cheapest treasure.
export const COIN_PACKS = {
  coins_pouch:   { name: "Pouch",   usd: 0.99,  gold: 1200,  bonus: 0 },
  coins_satchel: { name: "Satchel", usd: 4.99,  gold: 6700,  bonus: 10 },
  coins_chest:   { name: "Chest",   usd: 9.99,  gold: 14600, bonus: 20 },
  coins_hoard:   { name: "Hoard",   usd: 19.99, gold: 32800, bonus: 35 },
};

// Interstitial pacing (SPEC §4): never in the first 3 expeditions, ≥2 expeditions and ≥90 s apart,
// and skipped after any expedition where the player already watched a rewarded ad.
const CAPS = { grace: 3, everyN: 2, gapS: 90 };
// Firebase Remote Config can retune them without an app update: keys ad_grace, ad_every_n, ad_gap_s (docs/SETUP.md A9).
let expeditions = 0, sinceInter = 0, lastInter = 0, watchedThisRun = false;

const id = (k) => KEYS[k][os];
const ready = { rewarded: false, interstitial: false };
const log = [];
let noAds = false, adsReady = false, privacyRequired = false, leaderboards = false;
try { noAds = localStorage.getItem("gw.noAds") === "1"; } catch {}

// the banner's height as --ad on <html> (plus a hasAd class), so the camp and menus lift above it instead of hiding under it.
// The banner loads once and is then hidden and resumed; one that finishes loading after the player left the menu is hidden
// again, so it never lands over the board.
let adListening = false, bannerWant = false, bannerState = "none"; // none | loading | ready
const setAdHeight = (h) => { const px = Math.max(0, Math.round(+h || 0)); document.documentElement.style.setProperty("--ad", px + "px"); document.documentElement.classList.toggle("hasAd", px > 0); };

async function load(kind) {
  if (!native || !AdMob) return;
  try {
    kind === "rewarded" ? await AdMob.prepareRewardVideoAd({ adId: id("rewarded"), isTesting: KEYS.testAds })
                        : await AdMob.prepareInterstitial({ adId: id("interstitial"), isTesting: KEYS.testAds });
    ready[kind] = true;
  } catch (e) { track("ad_failed", { format: kind, error: String(e?.message || e).slice(0, 90) }); }
}

async function remoteCaps() {
  if (!FirebaseRemoteConfig) return;
  try {
    await FirebaseRemoteConfig.fetchAndActivate();
    for (const [cap, key] of [["grace", "ad_grace"], ["everyN", "ad_every_n"], ["gapS", "ad_gap_s"]]) {
      const { value, source } = await FirebaseRemoteConfig.getNumber({ key });
      if (source === "remote") CAPS[cap] = value; // unset keys keep the SPEC defaults
    }
  } catch {}
}

export function track(name, params = {}) {
  log.push([Date.now(), name, params]); if (log.length > 100) log.shift();
  if (FirebaseAnalytics) FirebaseAnalytics.logEvent({ name, params }).catch(() => {});
}

export const platform = {
  native, os, log, version: VERSION, privacyUrl: PRIVACY_URL,
  get noAds() { return noAds; },
  get canBuy() { return native && !!Purchases && !!KEYS.revenuecat[os]; },

  async init() {
    if (!native) return;
    remoteCaps(); // not awaited: a slow network never delays start-up
    this.gameCenter = GameCenter ? GameCenter.signIn().then((r) => leaderboards = !!r?.available, () => false) : Promise.resolve(false); // quiet, never awaited here
    if (AdMob) {
      // GDPR/US consent (UMP) first, then the iOS tracking prompt, then the SDK. Each step is separate, so an offline or failed
      // form never switches ads off: the SDK then uses the consent saved last time.
      try {
        let info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === "REQUIRED") info = await AdMob.showConsentForm();
        privacyRequired = info.privacyOptionsRequirementStatus === "REQUIRED";
      } catch (e) { track("consent_failed", { error: String(e?.message || e).slice(0, 90) }); }
      try { if (os === "ios") await AdMob.requestTrackingAuthorization(); } catch {}
      try {
        // PG cap on every ad request keeps mature ads out (and the App Store age rating low); console blocking does the rest (docs/SETUP.md A8)
        await AdMob.initialize({ initializeForTesting: KEYS.testAds, maxAdContentRating: "ParentalGuidance" });
        adsReady = true;
        load("rewarded"); load("interstitial");
        if (bannerWant) this.banner(true); // a menu opened while the consent form was up
      } catch (e) { track("ads_init_failed", { error: String(e?.message || e).slice(0, 90) }); }
    }
    if (this.canBuy) {
      try {
        await Purchases.configure({ apiKey: KEYS.revenuecat[os] });
        await this.refreshEntitlements();
      } catch (e) { track("iap_init_failed", { error: String(e?.message || e).slice(0, 90) }); }
    }
  },

  // Rewarded ad. Resolves true only if the player earned the reward. In a browser: free, always true.
  async rewarded(placement) {
    track("reward_offer_taken", { placement });
    watchedThisRun = true;
    if (!native || !AdMob) return true;
    if (!ready.rewarded) await load("rewarded");
    if (!ready.rewarded) return false;
    ready.rewarded = false;
    try {
      const item = await AdMob.showRewardVideoAd();
      track("ad_shown", { format: "rewarded", placement });
      return !!item;
    } catch { return false; }
    finally { load("rewarded"); }
  },

  // Call once per finished expedition, at the haul screen's exit. Shows an interstitial only when the caps allow, and
  // resolves true once the player has closed one (the game pays that haul again for sitting through it).
  async expeditionDone() {
    expeditions++; sinceInter++;
    const skip = watchedThisRun; watchedThisRun = false;
    if (!native || !AdMob || noAds || skip) return false;
    if (expeditions <= CAPS.grace || sinceInter < CAPS.everyN || Date.now() - lastInter < CAPS.gapS * 1000 || !ready.interstitial) return false;
    ready.interstitial = false; sinceInter = 0; lastInter = Date.now();
    let shown = false, hs = [];
    const closed = new Promise((done) => { // showInterstitial can resolve as the ad opens: wait for it to be closed (or give up after 2 min)
      for (const [ev, ok] of [["interstitialAdDismissed", true], ["interstitialAdFailedToShow", false]]) AdMob.addListener(ev, () => done(ok)).then((h) => hs.push(h)).catch(() => {});
      setTimeout(() => done(true), 120000); });
    try { await AdMob.showInterstitial(); track("ad_shown", { format: "interstitial", placement: "haul_exit" }); shown = await closed; } catch {}
    for (const h of hs) h.remove?.();
    load("interstitial");
    return shown;
  },

  async banner(show) { // menus only, never over the board
    bannerWant = show && !noAds;
    if (!native || !AdMob || !adsReady) return;
    if (!adListening) {
      adListening = true;
      AdMob.addListener("bannerAdSizeChanged", (s) => setAdHeight(bannerWant ? s?.height : 0));
      AdMob.addListener("bannerAdLoaded", () => { bannerState = "ready"; if (!bannerWant) AdMob.hideBanner().catch(() => {}); });
      AdMob.addListener("bannerAdFailedToLoad", () => { bannerState = "none"; setAdHeight(0); });
    }
    try {
      if (bannerWant && bannerState === "ready") await AdMob.resumeBanner();
      else if (bannerWant && bannerState === "none") {
        bannerState = "loading";
        await AdMob.showBanner({ adId: id("banner"), adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", isTesting: KEYS.testAds });
      } else if (!bannerWant) {
        setAdHeight(0);
        if (noAds && bannerState !== "none") { bannerState = "none"; await AdMob.removeBanner(); } else await AdMob.hideBanner();
      }
    } catch { if (bannerState === "loading") bannerState = "none"; }
  },

  // Options: the consent form where the player's region needs one (EEA, UK, some US states), otherwise the privacy policy
  get privacyRequired() { return privacyRequired; },
  async privacyChoices() {
    if (privacyRequired) try { return await AdMob.showPrivacyOptionsForm(); } catch {}
    window.open(PRIVACY_URL, "_blank"); // Capacitor hands _blank links to Safari
  },

  async refreshEntitlements() {
    if (!this.canBuy) return noAds;
    const { customerInfo } = await Purchases.getCustomerInfo();
    setNoAds(!!customerInfo.entitlements.active[NO_ADS]);
    return noAds;
  },

  async removeAdsPrice() {
    if (!this.canBuy) return null;
    try { const o = await Purchases.getOfferings(); return o.current?.availablePackages?.[0]?.product?.priceString || null; } catch { return null; }
  },

  async buyRemoveAds() {
    if (!this.canBuy) return false;
    try {
      const o = await Purchases.getOfferings(), pkg = o.current?.availablePackages?.[0];
      if (!pkg) return false;
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      setNoAds(!!customerInfo.entitlements.active[NO_ADS]);
      track("iap_success", { product: pkg.product.identifier });
      return noAds;
    } catch (e) { if (!e?.data?.userCancelled && e?.code !== "1") track("iap_fail", { error: String(e?.message || e).slice(0, 90) }); return false; }
  },

  // the coin packs on sale, in COIN_PACKS order: [{ id, price, ...COIN_PACKS[id] }]; [] when purchases are off or the store can't be reached
  async coinPacks() {
    if (!this.canBuy) return [];
    try {
      const pkgs = (await Purchases.getOfferings()).all?.coins?.availablePackages || [];
      return Object.keys(COIN_PACKS).map((id) => { const p = pkgs.find((x) => x.product.identifier === id);
        return p && { id, price: p.product.priceString, ...COIN_PACKS[id] }; }).filter(Boolean);
    } catch { return []; }
  },

  // Buys one coin pack. Returns the gold to add (0 if cancelled or failed). credited is the save's list of transaction ids
  // already paid out: new ones are pushed onto it, so each transaction adds gold exactly once (the caller saves right after).
  async buyCoins(productId, credited) {
    if (!this.canBuy || !COIN_PACKS[productId]) return 0;
    try {
      const pkg = (await Purchases.getOfferings()).all?.coins?.availablePackages?.find((x) => x.product.identifier === productId);
      if (!pkg) return 0;
      const { customerInfo, transaction } = await Purchases.purchasePackage({ aPackage: pkg });
      const gold = claim([...customerInfo.nonSubscriptionTransactions, transaction], credited);
      track("iap_success", { product: productId, gold });
      return gold;
    } catch (e) { if (!e?.data?.userCancelled && e?.code !== "1") track("iap_fail", { product: productId, error: String(e?.message || e).slice(0, 90) }); return 0; }
  },

  // At launch: gold for coin purchases the store has but the save never paid out (the app closed mid-purchase). 0 if none.
  async unclaimedCoins(credited) {
    if (!this.canBuy) return 0;
    try { return claim((await Purchases.getCustomerInfo()).customerInfo.nonSubscriptionTransactions, credited); } catch { return 0; }
  },

  // true: Remove ads is back; false: nothing to restore; null: the App Store couldn't be reached
  async restore() {
    if (!this.canBuy) return null;
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      setNoAds(!!customerInfo.entitlements.active[NO_ADS]); track("iap_restore", { found: noAds });
      return noAds;
    } catch (e) { track("iap_restore_failed", { error: String(e?.message || e).slice(0, 90) }); return null; }
  },

  // Game Center (iOS). gameCenter resolves true once the leaderboards can be shown (signed in, or a sign-in sheet is ready);
  // a player who declines keeps playing as before. Leaderboard ids are set up in App Store Connect (docs/SETUP.md).
  gameCenter: Promise.resolve(false),
  get leaderboards() { return leaderboards; },
  submitScore(board, value) {
    if (leaderboards) GameCenter.submitScore({ board, value: Math.floor(value) }).catch((e) => track("gc_submit_failed", { board, error: String(e?.message || e).slice(0, 90) }));
  },
  async showLeaderboards() {
    if (!leaderboards) return false;
    try { return !!(await GameCenter.showLeaderboards())?.shown; } catch { return false; }
  },

  // The save lives in localStorage, which WebKit writes to disk lazily and iOS may clear when space runs low.
  // Each write is mirrored to native Preferences (UserDefaults), and at launch the newer copy wins (restoreSave below).
  backup(key, json) {
    if (!native || !Preferences) return;
    const t = Date.now();
    try { localStorage.setItem(key + "@", t); } catch {}
    Preferences.set({ key, value: JSON.stringify([t, json]) }).catch(() => {});
  },
};

// gold for the coin transactions not yet in credited, adding their ids to it
export function claim(txs, credited) {
  let gold = 0;
  for (const t of txs) if (t && COIN_PACKS[t.productIdentifier] && t.transactionIdentifier && !credited.includes(t.transactionIdentifier)) {
    credited.push(t.transactionIdentifier); gold += COIN_PACKS[t.productIdentifier].gold;
  }
  return gold;
}

function setNoAds(v) { // hides banners and interstitials the moment Remove ads is bought or restored, and remembers it offline
  noAds = v;
  try { localStorage.setItem("gw.noAds", v ? "1" : "0"); } catch {}
  if (v) platform.banner(false);
}

// JS errors reach Crashlytics as non-fatal reports (the native SDK only sees native crashes)
if (native && FirebaseCrashlytics) {
  const report = (message) => FirebaseCrashlytics.recordException({ message: String(message).slice(0, 500) }).catch(() => {});
  addEventListener("error", (e) => report(`${e.message} @ ${e.filename?.split("/").pop()}:${e.lineno}:${e.colno}`));
  addEventListener("unhandledrejection", (e) => report("unhandled: " + (e.reason?.stack || e.reason)));
}

// Runs before index.html reads the save: restores it from Preferences when localStorage lost it or holds an older copy.
async function restoreSave(key = "gw.save") {
  try {
    const { value } = await Preferences.get({ key });
    const local = localStorage.getItem(key), localT = +localStorage.getItem(key + "@") || 0;
    if (value) {
      const [t, json] = JSON.parse(value);
      if (!local || t > localT) { localStorage.setItem(key, json); localStorage.setItem(key + "@", t); }
    } else if (local) platform.backup(key, local); // first launch with the mirror: copy what's already there
  } catch {}
}
if (native && Preferences) await restoreSave();
