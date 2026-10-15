# Glimmerwood: what you set up, in order

*2026-10-15. Stack decided today: the web game wrapped with **Capacitor** (Android now, iOS after the fun test).
Ads = **AdMob** with mediation, purchases = **RevenueCat**, analytics/crashes/remote config = **Firebase**. All free to start.*

Start the top rows today; they have waiting times. Each row says what to send back to Claude.

| # | Step | Cost | Wait | Send Claude |
|---|---|---|---|---|
| 1 | **Google Play Console**: [play.google.com/console](https://play.google.com/console) → personal account → identity verification | $25 once | days | "Play account approved" |
| 2 | **Recruit 12+ testers** (15–20 is safer) with Android phones and Gmail addresses. Google requires 12 testers opted in for **14 days straight** before a new personal account can publish publicly. | $0 | 14+ days | the Gmail list (or create a Google Group and send its address) |
| 3 | ~~Pick a contact email~~ **Done:** pubshiftsupport@gmail.com (on the site; use it in the Play listing too) | $0 | — | — |
| 4 | ~~Approve a public website repo~~ **Done 2026-10-15:** https://alexdlc5.github.io (privacy.html, terms.html, app-ads.txt). Use this URL as the *website* in the Play listing; AdMob checks app-ads.txt there. | $0 | — | — |
| 5 | **AdMob**: [admob.google.com](https://admob.google.com) → sign up, add payment info → *Apps* → add Android app "Glimmerwood" (not yet published) → create 3 ad units: **Rewarded**, **Interstitial**, **Banner** → *Privacy & messaging* → create and publish a **GDPR message** (and a US states message) | $0 | 1–3 days for account review | App ID (`ca-app-pub-…~…`), the 3 ad unit IDs, and your publisher ID (`pub-…`) |
| 6 | **Firebase**: [console.firebase.google.com](https://console.firebase.google.com) → new project "Glimmerwood" (enable Analytics) → add Android app with package **`io.github.alexdlc5.glimmerwood`** → download **google-services.json** | $0 (Spark plan) | minutes | the google-services.json file (drop it in `android/app/`) |
| 7 | **Play Console → create the app** "Glimmerwood" → *Monetize → Products → In-app products* → create **`no_ads`**, one-time, $4.99 | $0 | needs #1, and a first build uploaded | "product created" |
| 8 | **RevenueCat**: [app.revenuecat.com](https://app.revenuecat.com) → new project → add Play Store app (package as above) → connect a **Google service account** (RevenueCat walks you through it; permissions can take a day) → entitlement **`no_ads`** → attach product `no_ads` → put it in the *current* offering | $0 (free under $2.5k/mo revenue) | ~1 day | the Android **public SDK key** (`goog_…`) |
| 9 | **Install the test build** on your phone: GitHub → repo → *Releases* → **Glimmerwood test build** → download **glimmerwood-test.apk** → open on your phone (allow "install unknown apps" once) | $0 | — | feel feedback, as before |
| 10 | **Trademark check**: search "Glimmerwood" at [tmsearch.uspto.gov](https://tmsearch.uspto.gov) (game/software classes 9 and 28/41). Claude's web search found no game with the name; this is the official check. | $0 | minutes | "clear" or what you found |
| 11 | *Later, after the fun test passes:* **Apple Developer Program** ($99/yr), then App Store Connect paid-apps agreement, tax and banking. iOS builds run on GitHub's macOS runners. | $99/yr | 1–2 days | "Apple approved" |
| 12 | *Later, optional:* AppLovin and Unity Ads accounts, added as **AdMob mediation** partners to raise ad revenue | $0 | days | — |

## What Claude does with each answer

- **#5 AdMob IDs** → replace the test IDs in `proto/platform.js` (`KEYS`) and the app ID in `android/app/src/main/AndroidManifest.xml`; set `testAds: false` only for the release build; fill `site/app-ads.txt`.
- **#6 google-services.json** → add the Firebase Analytics, Crashlytics and Remote Config plugins; move the timer and ad caps into Remote Config.
- **#8 RevenueCat key** → put it in `KEYS.revenuecat.android`; the "Remove ads" button and "Restore purchases" go live.
- **#3 + #4** → replace `CONTACT_EMAIL` / `LAST_UPDATED` in `site/`, publish, then put the site URL in the Play listing (that's how AdMob verifies `app-ads.txt`).
- **#1 + #2 + #7** → a signed release build (Claude sets up the upload key in GitHub secrets; you keep a copy of the key file) and the closed test track.

## Things you never need to install

Android Studio, Unity, a Mac. GitHub Actions builds the app. You need a phone.
