# Glimmerwood: App Store submission packet (v1.0)

Prepared 2026-10-18 from the game on `main` (TestFlight build 111). Everything in this folder is what goes into
App Store Connect; the owner pastes it in. Review the listing text and screenshots first; nothing here has been
entered into App Store Connect yet.

## What's in `docs/store/`

| File | Goes where |
|---|---|
| `listing.en-US.json` … `listing.hi.json` (8) | App Store Connect › the app › **1.0 Prepare for Submission**, one localization each: name, subtitle, promotional text, description, keywords, what's new, support URL, marketing URL, review notes |
| `shots/1-dig.png` … `6-mines.png` (1320×2868) | **App Previews and Screenshots › iPhone 6.9" Display**. Apple scales these to every smaller iPhone, so one set covers all |
| `review-remove-ads.png` | **In-App Purchases › Remove ads › Review Information › Screenshot** (Apple requires one per IAP; shows the purchase in context) |
| App previews (from the trailer session: `docs/ad/glimmerwood-*-appstore-886x1920.mp4`) | same screenshots page, drag in before the screenshots; optional, up to 3 |

Hard limits are enforced by `node scripts/store-check.mjs` (subtitle 30, promo 170, keywords 100 bytes, description 4000). All eight pass.

## English listing (master; the other seven follow it)

- **Name:** Glimmerwood
- **Subtitle:** Cozy crystal block puzzle
- **Promotional text:** Mine glowing crystals before the roots close in. Sell your haul to Old Puddock, build a cozy camp, and follow the light down. No account. No timers you can pay to skip.
- **Keywords:** block,puzzle,cozy,relaxing,crystal,gem,mining,forest,blast,fit,drop,casual,offline,mole,tetris-like
- **Category:** Games › Puzzle (secondary: Casual)
- **Support / marketing URL:** https://alexdlc5.github.io  **Privacy policy:** https://alexdlc5.github.io/privacy.html
- **Copyright:** 2026 Alex de la Chica
- The full description and review notes are in `listing.en-US.json`.

Per-language subtitles the translators chose (all ≤ 30): Gemütliches Blockpuzzle · Puzzle acogedor de cristales · Puzzle de blocos aconchegante · まったり遊べる水晶ブロックパズル · 포근한 숲속 수정 블록 퍼즐 · 治愈系水晶方块拼图 · आरामदेह क्रिस्टल ब्लॉक पहेली.
Each localization reuses the game's own translated names (Bernsteinerinnerungen, 琥珀の記憶, 퍼덕 영감 …) so the store matches what's on screen.

## App Privacy ("nutrition labels")

Answer exactly this; it matches `ios/App/App/PrivacyInfo.xcprivacy`, which is what Xcode's privacy report will show.
"Do you or your third-party partners collect data from this app?" → **Yes**.

| Data type | Collected | Linked to the user | Used for tracking | Purposes |
|---|---|---|---|---|
| Identifiers › **Device ID** (advertising ID / IDFV) | Yes | No | **Yes** | Third-Party Advertising, Analytics |
| Usage Data › **Advertising Data** | Yes | No | **Yes** | Third-Party Advertising |
| Usage Data › **Product Interaction** | Yes | No | No | Analytics |
| Diagnostics › **Crash Data** | Yes | No | No | App Functionality |
| Diagnostics › **Performance Data** | Yes | No | No | App Functionality |
| Purchases › **Purchase History** | Yes | No | No | App Functionality |
| Location › **Coarse Location** | **Yes** (AdMob derives approximate location from IP for ad serving; it's in the privacy policy) | No | No | Third-Party Advertising |

Everything else: **not collected** (no name, email, contacts, photos, health, precise location, search history, user content, browsing history).
"Tracking" is yes because AdMob personalised ads use the advertising ID after the ATT prompt; players who decline are not tracked.

Before submitting: Xcode › Product › Archive › right-click the archive › **Generate Privacy Report** and confirm every category it lists is in the table above. If the report shows a category that isn't (e.g. something a mediation partner adds), add it to the labels, not the other way round.

## Age rating questionnaire

Apple's current tiers are 4+, 9+, 13+, 16+, 18+. Answer:

| Question | Answer | Why |
|---|---|---|
| Cartoon or fantasy violence | **None** | Moths nibble your haul; roots "close in". Nothing is hurt |
| Realistic violence, prolonged graphic violence | None | |
| Profanity or crude humor | None | Puddock is grumpy, never rude |
| Mature/suggestive themes, sexual content, nudity | None | |
| Horror or fear themes | **None** | The story is melancholy (a lost grandmother), not frightening |
| Alcohol, tobacco, drug use | None | Puddock offers tea |
| Medical or treatment information | None | |
| Simulated gambling | **No** | Coins can't be wagered; the deal is random but nothing is bet |
| Gambling (real money) | No | |
| Loot boxes | **No** | Coin packs buy a fixed amount of gold. Nothing purchasable is randomized |
| Contests | None | Game Center leaderboards are rankings, not prize contests; if asked, answer **Infrequent** (4+) |
| Unrestricted web access | **No** | The only outbound link is the privacy policy, opened in Safari |
| User-generated content, messaging | No | |
| Advertising | **Yes** (capability) | Banner, interstitial, rewarded video |
| In-app purchases | Yes | Remove ads (non-consumable) + 4 coin packs (consumable) |

Expected result: **4+**. "Made for Kids" → **No** (it carries third-party ads and an ATT prompt; Kids Category apps may not).

## App Review notes (paste into "Notes" under App Review Information)

In `listing.en-US.json › review_notes`. Summary of what it tells the reviewer: no account needed; the ATT prompt is for ads only;
ad frequency caps (none in the first three expeditions); rewarded ads are opt-in; IAPs via RevenueCat/StoreKit with Restore in
Options; a 60-second path to a full expedition (Play › skip prologue › Go mining › Dig › Sell); the silent switch mutes the
game by design with the override in Options; Game Center is leaderboards only. **Sign-in required: No. Demo account: none.**
Contact: pubshiftsupport@gmail.com and your phone number (Apple requires a phone number here; it is not public).

## Guideline pre-check (the ones that bite small games)

- **2.1 Performance:** the build must not crash or show placeholder content. Build 111 passed the screens/soak/edge gates; the reviewer sees test ads (fine for review; the `appstore` workflow input turns on real ads for the release build).
- **3.1.1 In-App Purchase:** Remove ads and coins go through StoreKit; Restore purchases is in Options; the IAP must be **attached to version 1.0** in App Store Connect before submission (first-time IAPs ship with a version).
- **4.1 Copycats / 4.3 Spam:** original names, art and music (trademark desk search in SETUP A13).
- **5.1.1 Data collection:** privacy policy URL in the listing and reachable in-app (Options › Privacy policy); ATT prompt string is translated in 8 languages (`InfoPlist.strings`).
- **5.1.2 Data use and sharing:** labels above match the SDKs; AdMob's UMP consent form handles GDPR/UK regions.
- **2.3.3 Accurate metadata:** screenshots are the real game at 6.9"; no device frames, no "free" or pricing claims inside previews (the App Store trailer variants drop the end-card line).
- **2.3.8:** the app name on the listing ("Glimmerwood") matches `CFBundleDisplayName`.

## Owner steps (click by click)

Do these in order. Steps marked ⏳ wait on something.

1. **App Store Connect › My Apps › + › New App:** Platforms iOS · Name **Glimmerwood** · Primary language **English (U.S.)** · Bundle ID **io.github.alexdlc5.glimmerwood** · SKU `glimmerwood-ios` · User access Full. Create.
2. **App Information** (left sidebar): Subtitle · Category Games / Puzzle, secondary Casual · Content Rights: "does not contain, show, or access third-party content" → **No** is wrong here: the game shows third-party **ads**, so answer **Yes, it contains third-party content** and confirm you have the rights (AdMob's terms cover it). Age Rating › **Edit** → answer the table above → Save; it should say 4+.
3. **App Privacy** › Get Started → answer the table above, one data type at a time → **Publish** (the labels must be published before you can submit).
4. **Pricing and Availability:** Price **Free** · all countries (or your pick) · Pre-orders No.
5. **In-App Purchases** (sidebar › Monetization): confirm **Remove ads** (`no_ads`, non-consumable, $4.99) and the four coin packs exist with localized display names (the names are in `platform.js COIN_PACKS`: Pouch $0.99, Satchel $4.99, Chest $9.99, Hoard $19.99). For each, upload `review-remove-ads.png` as the review screenshot (the coin packs can reuse it; it shows the market) and set status **Ready to Submit**.
6. **1.0 Prepare for Submission** (sidebar, under iOS App):
   - **App Previews and Screenshots › iPhone 6.9" Display:** drag in `shots/1-dig.png … 6-mines.png` in that order. ⏳ If the trailer session's `*-appstore-886x1920.mp4` are ready, drag one in as the App Preview before the screenshots.
   - **Promotional Text, Description, Keywords, Support URL, Marketing URL:** from `listing.en-US.json`.
   - **Localizations** (top-right language menu › **+**): add German, Spanish (Spain), Portuguese (Brazil), Japanese, Korean, Chinese (Simplified), Hindi; for each paste from its `listing.<locale>.json` (subtitle too: it lives on this page per language) and upload the same six screenshots (or the `--lang` set if we render localized captions).
   - **Build:** ⏳ pick the TestFlight build you approved (111, or the one after the trailers merge). Export Compliance: "Does your app use encryption?" → **No** (only HTTPS; select the exemption).
   - **In-App Purchases and Subscriptions:** + → attach **Remove ads** and the coin packs.
   - **Game Center:** tick, attach the existing leaderboard(s). (Achievements come later, per `docs/ACHIEVEMENTS_PLAN.md`.)
   - **App Review Information:** paste `review_notes`; contact first/last name, phone, email (pubshiftsupport@gmail.com); Sign-in required **off**.
   - **Version Release:** **Manually release this version** (so you choose launch day after approval).
   - **Advertising Identifier (IDFA):** if asked, **Yes**: serve ads, attribute installs **No**, limit tracking honoured **Yes**.
7. **Add for Review › Submit to App Review.** Typical wait 24–48 h. Replies to Apple go through **Resolution Center** on the same page.
8. After approval: **Release this version** when you want launch day; then AdMob › Apps › Glimmerwood › **link the App Store listing** (ads only serve fully once the store ID is linked) and publish `app-ads.txt` (already on the site).

What I still need from you before step 6: your approval of the listing text and screenshots (reply with any wording changes), and the phone number for App Review contact (never paste it here; type it straight into App Store Connect).
