// Platform services: ads, purchases, analytics.
// In the Capacitor app the native plugins are reached through window.Capacitor.Plugins (no bundler needed);
// in a plain browser everything is a harmless stand-in, so the prototype keeps working as before.
const cap = window.Capacitor, native = !!cap?.isNativePlatform?.(), os = cap?.getPlatform?.() || "web";
const { AdMob, Purchases, FirebaseAnalytics, FirebaseRemoteConfig } = cap?.Plugins || {};

// Fill these from your accounts (docs/SETUP.md). The defaults are Google's public *test* ad units: safe to ship to
// testers, never earn money. Empty RevenueCat key = purchases switched off.
const KEYS = {
  rewarded:     { android: "ca-app-pub-3940256099942544/5224354917", ios: "ca-app-pub-3940256099942544/1712485313" },
  interstitial: { android: "ca-app-pub-3940256099942544/1033173712", ios: "ca-app-pub-3940256099942544/4411468910" },
  banner:       { android: "ca-app-pub-3940256099942544/6300978111", ios: "ca-app-pub-3940256099942544/2934735716" },
  revenuecat:   { android: "", ios: "" },
  testAds: true, // flip to false only with your real ad unit IDs in place
};
export const NO_ADS = "no_ads"; // RevenueCat entitlement id

// Interstitial pacing (SPEC §4): never in the first 3 expeditions, ≥2 expeditions and ≥90 s apart,
// and skipped after any expedition where the player already watched a rewarded ad.
const CAPS = { grace: 3, everyN: 2, gapS: 90 };
// Firebase Remote Config can retune them without an app update: keys ad_grace, ad_every_n, ad_gap_s (docs/SETUP.md A9).
let expeditions = 0, sinceInter = 0, lastInter = 0, watchedThisRun = false;

const id = (k) => KEYS[k][os];
const ready = { rewarded: false, interstitial: false };
const log = [];
let noAds = false;
try { noAds = localStorage.getItem("gw.noAds") === "1"; } catch {}

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
  native, os, log,
  get noAds() { return noAds; },
  get canBuy() { return native && !!Purchases && !!KEYS.revenuecat[os]; },

  async init() {
    if (!native) return;
    remoteCaps(); // not awaited: a slow network never delays start-up
    if (AdMob) {
      try { // GDPR/UMP consent first, then (iOS) ATT, then the SDK
        const info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === "REQUIRED") await AdMob.showConsentForm();
        if (os === "ios") await AdMob.requestTrackingAuthorization();
        await AdMob.initialize({ initializeForTesting: KEYS.testAds });
        load("rewarded"); load("interstitial");
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

  // Call once per finished expedition, at the haul screen's exit. Shows an interstitial only when the caps allow.
  async expeditionDone() {
    expeditions++; sinceInter++;
    const skip = watchedThisRun; watchedThisRun = false;
    if (!native || !AdMob || noAds || skip) return;
    if (expeditions <= CAPS.grace || sinceInter < CAPS.everyN || Date.now() - lastInter < CAPS.gapS * 1000 || !ready.interstitial) return;
    ready.interstitial = false; sinceInter = 0; lastInter = Date.now();
    try { await AdMob.showInterstitial(); track("ad_shown", { format: "interstitial", placement: "haul_exit" }); } catch {}
    load("interstitial");
  },

  async banner(show) { // menus only, never over the board
    if (!native || !AdMob) return;
    try {
      if (show && !noAds) await AdMob.showBanner({ adId: id("banner"), adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", isTesting: KEYS.testAds });
      else await AdMob.hideBanner();
    } catch {}
  },

  async privacyChoices() { if (native && AdMob) try { await AdMob.showPrivacyOptionsForm(); } catch {} },

  async refreshEntitlements() {
    if (!this.canBuy) return noAds;
    const { customerInfo } = await Purchases.getCustomerInfo();
    noAds = !!customerInfo.entitlements.active[NO_ADS];
    try { localStorage.setItem("gw.noAds", noAds ? "1" : "0"); } catch {}
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
      noAds = !!customerInfo.entitlements.active[NO_ADS];
      try { localStorage.setItem("gw.noAds", noAds ? "1" : "0"); } catch {}
      track("iap_success", { product: pkg.product.identifier });
      if (noAds) this.banner(false);
      return noAds;
    } catch (e) { track("iap_fail", { error: String(e?.message || e).slice(0, 90) }); return false; }
  },

  async restore() {
    if (!this.canBuy) return false;
    try { await Purchases.restorePurchases(); return await this.refreshEntitlements(); } catch { return false; }
  },
};
