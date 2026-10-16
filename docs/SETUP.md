# Glimmerwood: everything you set up, step by step

*Updated 2026-10-16. **Launch order: Apple App Store first, Google Play second.** The game is one web codebase
wrapped with Capacitor: `ios/` and `android/` are both in the repo, so adding Android later is a build away.
Ads = Google AdMob, purchases = RevenueCat, stats/crashes/remote tuning = Firebase.*
*Menus on these sites move around; if a label differs slightly, look for the nearest match.*

## Status

| | Step | Wait | Status |
|---|---|---|---|
| ✅ | Contact email | — | **pubshiftsupport@gmail.com** |
| ✅ | Public website | — | **https://alexdlc5.github.io** (privacy, terms, app-ads.txt) |
| ✅ | A1. Apple Developer Program | done 2026-10-16 | Individual enrollment |
| ✅ | A2. Agreements, tax, banking | done 2026-10-16 | Paid Apps agreement Active |
| ✅ | A3. Bundle ID + app record | done 2026-10-16 | app name **Glimmerwood** |
| ✅ | A4–A6. CI key + GitHub secrets | done 2026-10-16 | iPhone registered under Devices; CI revokes its old development certificates each run |
| ✅ | A7. First TestFlight build on your iPhone | done 2026-10-16 | internal group "Me"; run the **ios** workflow from main with "Sign and upload" ticked |
| ✅ | A8. AdMob (iOS app) | done 2026-10-16 | App ID + 3 iOS units in the app; W-9 in review; link the store listing after launch |
| ✅ | A9. Firebase (iOS app) | done 2026-10-16 | plist in the app; Crashlytics on; Remote Config v1 published (ad_grace 3, ad_every_n 2, ad_gap_s 90) |
| ⏳ | A10. "Remove ads" product + sandbox tester | done 2026-10-16 except the review screenshot | `no_ads`, Non-Consumable, $4.99, all countries, English name and description; review screenshot at submission; sandbox tester still to add |
| ✅ | A11. RevenueCat (iOS) | done 2026-10-16 | `appl_` key in the app; In-App Purchase key valid; `no_ads` (App Store + Test Store) → `no_ads` entitlement → current offering `default` |
| ⬜ | A12. App Store listing, privacy labels, review | 1–2 days review | at launch |
| ✅ | A13. Trademark check | decided 2026-10-16 | keeping **Glimmerwood** (an iOS game "Glimmerwood: Potion Sort" launched 2026-10-13) |
| ⬜ | A14. Game Center leaderboards | 10 minutes | turn on Game Center, create 3 leaderboards, add them to the next version |
| ⬜ | B. Google Play (later) | 14+ days of testing | after iOS launch |

You need **an iPhone** (iOS 15 or newer) to play the TestFlight builds. You **don't** need a Mac: GitHub's Macs build and upload the app.

**Never paste these into chat:** the App Store Connect `.p8` key files. They go straight into GitHub secrets (A6) or RevenueCat (A11).
Everything else Claude asks for (ad IDs, SDK keys, the Firebase file) ships inside the app anyway and is fine to send.

---

# Part A: Apple App Store (first)

## A1. Apple Developer Program ($99/year)

1. Make sure your Apple Account has **two-factor authentication** on (iPhone: Settings → your name → Sign-In & Security).
2. Go to **developer.apple.com/programs/enroll** → **Start your enrollment** → sign in.
3. Enroll as an **Individual / Sole Proprietor**. The App Store then shows your legal name as the seller. (An organization needs an LLC and a D-U-N-S number; it can switch later.)
4. Pay **$99**. Approval usually comes by email within 48 hours.

**Send Claude:** "Apple approved."

## A2. Agreements, tax and banking (needed to sell "Remove ads")

1. **appstoreconnect.apple.com** → **Business** (or *Agreements, Tax, and Banking*).
2. Accept the **Paid Apps** agreement → add a **bank account** → fill in the **US tax form** (W-9).
3. Wait until the Paid Apps agreement shows **Active** (often same day, sometimes a few days).

## A3. Bundle ID and app record

1. **developer.apple.com/account** → **Certificates, IDs & Profiles** → **Identifiers** → **+** → **App IDs** → **App** → Continue.
   - Description: `Glimmerwood`
   - Bundle ID: **Explicit** → **`io.github.alexdlc5.glimmerwood`** (exactly this)
   - Capabilities: leave the defaults (In-App Purchase is included) → **Register**.
2. **App Store Connect** → **Apps** → **+** → **New App**:
   - Platform **iOS** · Name **Glimmerwood** · Language **English (U.S.)**
   - Bundle ID: pick `io.github.alexdlc5.glimmerwood` · SKU `glimmerwood-ios` · User access **Full Access** → **Create**.
   - If "Glimmerwood" is taken on the App Store, use **Glimmerwood: Crystal Puzzle** and tell Claude.
     *First read A13: another "Glimmerwood" puzzle game is already on the App Store, so the name itself may change.*

**Send Claude:** the exact app name you got.

## A4. App Store Connect API key (lets GitHub upload builds for you)

1. **App Store Connect** → **Users and Access** → **Integrations** → **App Store Connect API** → **Team Keys** → **+**.
2. Name `GitHub CI`, access **Admin** (needed so it can create signing certificates automatically) → **Generate**.
3. **Download** the `.p8` file. *Apple lets you download it only once.* Keep a copy in a password manager.
4. Note the **Key ID** (next to the key) and the **Issuer ID** (top of that page).

## A5. Team ID

**developer.apple.com/account** → **Membership details** → copy **Team ID** (10 characters).

## A6. Put the four values in GitHub (secrets: only GitHub's build machines can read them)

**github.com/Alexdlc5/shardgrid** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, four times:

| Name | Value |
|---|---|
| `APPLE_TEAM_ID` | Team ID from A5 |
| `ASC_KEY_ID` | Key ID from A4 |
| `ASC_ISSUER_ID` | Issuer ID from A4 |
| `ASC_KEY_P8` | open the `.p8` file in Notepad, copy **everything** (including the BEGIN/END lines), paste |

**Send Claude:** "secrets added."

## A7. First TestFlight build on your iPhone

1. **github.com/Alexdlc5/shardgrid** → **Actions** → **ios** → **Run workflow** → tick **Sign and upload to TestFlight** → **Run**. (Claude can start this for you.)
2. After ~20 minutes, **App Store Connect** → your app → **TestFlight** → the build shows *Processing*, then *Ready to Test*.
3. **TestFlight → Internal Testing → +** → group `Me` → add yourself.
4. On your iPhone install **TestFlight** from the App Store → accept the invite → **Install Glimmerwood**.

Apple has **no 12-testers-for-14-days rule**. Internal testers (up to 100 people on your App Store Connect team) get builds right away. External testers (up to 10,000, by email or a public link) need a ~1-day beta review the first time.

**Send Claude:** feel feedback from the real phone.

## A8. AdMob (iOS app)

1. **admob.google.com** → **Get started** with your Google account → country, time zone (Pacific), currency USD → accept terms.
2. **Payments** → add name and address. Later add **US tax info** (W-9). Payouts start above $100.
3. **Apps** → **Add app** → **iOS** → "listed on a supported app store?" **No** → name **Glimmerwood** → *User metrics* **on** → **Add app**. Copy the **App ID** (`ca-app-pub-…~…`).
4. **Ad units** → **Add ad unit**, three times (copy each `ca-app-pub-…/…`):
   - **Rewarded** (reward amount 1, item "reward") · **Interstitial** · **Banner**
5. **Privacy & messaging:**
   - **European regulations (GDPR)** → Create message → app Glimmerwood (iOS) → English → choices **Consent / Do not consent / Manage options** → privacy policy https://alexdlc5.github.io/privacy.html → **Publish**.
   - **US state regulations** → Create message → **Publish**.
   - **IDFA explainer:** skip. The game asks for tracking permission with its own friendly sentence.
6. **Blocking controls → Content → Sensitive categories:** block **Gambling and betting**, **Dating** and other adult categories (keeps the age rating low).
7. **Settings → Test devices → Add test device:** your iPhone's ID. AdMob prints it in the app log on first run; Claude will read it out of a TestFlight session for you. **Never tap real ads on your own phone.**
8. **Settings → Account information:** copy your **Publisher ID** (`pub-…`).
9. Once the game is live: **Apps → Glimmerwood → App settings → link to the App Store listing**. AdMob reviews it and checks `app-ads.txt` on your site.

**Send Claude:** iOS **App ID**, the 3 **ad unit IDs**, your **Publisher ID**.

## A9. Firebase (iOS app)

1. **console.firebase.google.com** → **Create a project** → `Glimmerwood` → keep **Google Analytics on** → Create.
2. **Add app** → **iOS** → Apple bundle ID **`io.github.alexdlc5.glimmerwood`** → nickname `Glimmerwood iOS` → App Store ID: leave blank → **Register** → **Download GoogleService-Info.plist** → skip the rest.
3. **Crashlytics → Get started.** **Remote Config → Create configuration** (leave empty).

**Send Claude:** the **GoogleService-Info.plist** file. It is not a secret (it ships inside the app), but keep it out of
public chats anyway; Claude commits it to `ios/App/App/` because the TestFlight build needs it.

*Already in the code (no keys needed):* `proto/platform.js` sends its events (`ad_shown`, `reward_offer_taken`, `iap_success`, …)
to Firebase Analytics, and reads the interstitial pacing from Remote Config once the plugin is installed.
Until then the game behaves exactly as now.

*What Claude does when the plist arrives* (not before: the Firebase SDK stops the app at launch without it):
1. `npm i @capacitor-firebase/analytics @capacitor-firebase/crashlytics @capacitor-firebase/remote-config` → `npx cap sync ios`.
2. Adds the plist to the Xcode target, sets the Crashlytics dSYM upload in the `ios` workflow, and checks a TestFlight build.
3. Updates the App Privacy answers (A12): Firebase adds *Usage data* and *Diagnostics*.

*Optional, after that build:* in **Remote Config** add any of these number parameters to retune ads without an update
(leave one out to keep the default): `ad_grace` (default 3 expeditions with no interstitial), `ad_every_n` (2),
`ad_gap_s` (90 seconds). The level timer stays in `sim/generator.json`, because the CI sim gate tests it.

## A10. "Remove ads" product and a sandbox tester (after A2 is Active)

1. **App Store Connect** → your app → **Monetization** → **In-App Purchases** → **+** → **Non-Consumable**.
   - Reference name `Remove ads` · Product ID **`no_ads`** (exactly; it can never change) → Create.
   - **Price:** $4.99 · **Localization (English):** display name *Remove ads*, description *Removes interstitial and banner ads. Rewarded ads stay optional.* · Review screenshot: Claude makes one.
2. **Users and Access** → **Sandbox** → **Test Accounts** → **+**. Use an email that is *not* an Apple Account already (e.g. `pubshiftsupport+sandbox@gmail.com`). On your iPhone, sign into it under Settings → App Store → Sandbox Account.

## A11. RevenueCat (iOS)

1. **App Store Connect** → **Users and Access** → **Integrations** → **In-App Purchase** → **Generate In-App Purchase Key** → download the `.p8` (once!) → note the Key ID.
2. **app.revenuecat.com** → sign up → **Create project** `Glimmerwood` → **Apps** → **+ New** → **App Store** → name `Glimmerwood iOS` → bundle ID `io.github.alexdlc5.glimmerwood` → upload the **In-App Purchase Key** `.p8`, with its Key ID and your Issuer ID → Save.
3. **Product catalog → Products → + New** → `no_ads` · **Entitlements → + New** → `no_ads` → attach the product · **Offerings → default** (*Current*) → **+ Package** → **Lifetime** → `no_ads`.
4. **API keys** → copy the **Apple public SDK key** (starts with `appl_`).

**Send Claude:** the **`appl_…` key**.

## A12. App Store listing, privacy labels and review (at launch)

Claude prepares the text and pictures; you paste them in and press submit.
- **Screenshots:** 6.9" iPhone (1320×2868). Claude renders them from the game.
- **Description, subtitle** ("Cozy crystal block puzzle"), **keywords**, **support URL** https://alexdlc5.github.io, **privacy policy URL** https://alexdlc5.github.io/privacy.html.
- **App Privacy** ("nutrition labels"): Claude writes the answers from the SDKs (identifiers, usage data, diagnostics, purchases; tracking = yes when the player allows it).
- **Age rating questionnaire:** no violence, no gambling, no user content. It contains ads. Expect **4+ or 9+**.
- **Attach the `no_ads` purchase** to the version (first-time purchases must ship with a version).
- **Review notes** (Claude drafts): the game asks for tracking permission, rewarded ads are optional, and no account is needed.
- **Submit for Review:** usually 24–48 hours.

## A13. Trademark check (5 minutes)

**tmsearch.uspto.gov** → search **GLIMMERWOOD** and **GLIMMER WOOD** → look for live marks in class **9** (software/games) and **41** (entertainment). **Send Claude:** "clear", or what you found.

### Findings, checked by Claude on 2026-10-16

*This is a desk search, not legal advice and not a clearance opinion. Common-law (unregistered) rights and
foreign marks are not fully covered. Before spending on a filing or a launch push, a trademark attorney should confirm.*

**USPTO (tmsearch.uspto.gov, searched 2026-10-16):**
- **GLIMMERWOOD**: one record, serial 86624886 / reg. 4870590, class **25 (clothing)**, owner an individual in
  Camarillo, CA. **Dead:** cancelled 2026-06-26 because no Section 8 declaration was filed. Not a game mark, and no longer live.
- **GLIMMER WOOD**, **GLIMMEROAK**, **GLIMMER OAK** (as one phrase): **no records**.
- Live **GLIMMER…** marks near games (filter: live, classes 9 and 41; 38 hits). None contains "wood" or "oak". The closest:
  **GLIMMER STUDIOS**, serial 97637759, class 9 *downloadable video game programs* (Glimmer Studios, LLC, Florida), and
  **GLIMMER STUDIOS**, serial 98160838, classes 35/41/42 (Glimmer Technologies Inc.). Also **GLIMMER**, serial 97903141 (music, classes 9/41),
  **MUSE GLIMMER**, serial 50039313 (Meta, pending), **GLIMMERHOLD**, serial 90893132 (game retail, class 35).
  "Glimmer" is a crowded word, so each mark is narrow; a two-part coined name like Glimmerwood is less likely to clash with them.

**App stores (searched 2026-10-16):**
- ⚠️ **"Glimmerwood: Potion Sort"** by Efe GEREK, US App Store, **released 2026-10-13**: a free, 4+, *"cozy color sorting puzzle"*
  set in "Glimmerwood", with forest friends and a moth named Wick. [App Store](https://apps.apple.com/us/app/glimmerwood-potion-sort/id6818744035)
  (bundle `com.efegerek.Glimmerwood`, terms at efegerek.com/en/apps/glimmerwood/). No USPTO filing yet, but using the name
  in commerce can give them common-law rights, and it is the **same name, same store, same genre, and nearly the same pitch** as ours.
- Also on the App Store: "Glimmerwing: Night Garden" (casual, 2026-08). It is a different name, so not a conflict.
- **"Glimmeroak"**: nothing on the App Store or Google Play. **"Glimmerwood"** on Google Play: nothing (2026-10-16).

**Web (2026-10-16):** no game, book or brand named Glimmerwood or Glimmeroak found beyond the above. Similar names (not conflicts):
*Songs of Glimmerwick* (Eastshade Studios RPG), *Gloomwood* (New Blood stealth game), *The Glimmering Woods* and *Glimmershade* (itch.io).

**Verdict:** the USPTO register is clear, but the App Store is not. **Glimmeroak looks clear.** **Glimmerwood** now collides with a
live game in the same niche. Apple may also refuse the bare name "Glimmerwood" if it is close to an existing listing.

**Owner decision (send Claude one of these):**
1. **Rename** before the App Store record (A3). This is the cheapest moment: only the title, the store text and the in-game logo change, and the bundle ID
   `io.github.alexdlc5.glimmerwood` can stay. Glimmeroak-based names look clear, but Claude should run them through this same check before you commit.
2. **Keep Glimmerwood** with a subtitle (e.g. "Glimmerwood: Crystal Mines"). Ask a trademark attorney first: the other game shipped first.

## A14. Game Center leaderboards (10 minutes, before the build that ships them)

The app already signs in to Game Center quietly, submits scores and shows Apple's leaderboard screen (a **Leaderboards** button in
the Daily Dig sheet and in Options). Apple hosts everything: no account, no server, free. You only create the boards.

1. **developer.apple.com** → Certificates, IDs & Profiles → **Identifiers** → `io.github.alexdlc5.glimmerwood` → check **Game Center** is ticked
   (it's on by default). The app's `App.entitlements` asks for it, and the CI build's automatic signing picks it up.
2. **App Store Connect** → your app → **Game Center** (in the sidebar under Features or Services) → turn Game Center **on** for the app.
3. **Leaderboards → +**, three times. The **Leaderboard ID** must match exactly and can never change. For all three: Score Format Type
   **Integer**, Score Submission Type **Best Score**, Sort Order **High to Low**. Add a localization (English) with the display name below,
   score format **Integer**.

   | Type | Reference name | Leaderboard ID | Display name | Score suffix |
   |---|---|---|---|---|
   | **Recurring**: start at 00:00 UTC (the game's day turns over then), duration **1 day**, restarts every **1 day** | Daily Dig | **`daily_dig`** | Daily Dig | ` g` |
   | Classic | Best Haul | **`best_haul`** | Best Haul | ` g` |
   | Classic | Amber Memories | **`memories_found`** | Amber Memories | ` of 33` |

   `best_haul` takes Expedition and Daily Dig hauls; Calm Grove has no clock, so its hauls stay off the board.
4. **App Store** → the next version's page → **Game Center** section → tick it → **Leaderboards → Add** → select all three → Save.
   They go live with that version. TestFlight builds can already use them before that.

**Device test (Claude can't do these):** on the TestFlight build, signed in to Game Center on the iPhone,
1. launch: a "Welcome back" banner, no prompt (signed out: no prompt either, and the game plays as before);
2. finish a Daily Dig and sell: the haul shows under **Daily Dig** and **Best Haul**; break open a memory: **Amber Memories** goes up;
3. tap **Leaderboards** in the Daily Dig sheet and in Options: Apple's screen opens and closes back to the game;
4. signed out of Game Center: the button still shows and opens Apple's sign-in sheet.

---

# Part B: Google Play (later, after the iOS launch)

Already built: `android/` in the repo, and the **android apk** workflow builds a test APK (Releases → *Glimmerwood test build*).
When you're ready:

1. **Play Console account:** play.google.com/console/signup → **Yourself** → $25 → identity verification (days).
2. **Testers:** a personal account needs a **closed test with 12+ testers for 14 days in a row** before going public. Make a Google Group `glimmerwood-testers` with 15–20 Android users.
3. **AdMob:** add the **Android** app to the same AdMob account (same 3 ad units, same privacy messages).
4. **Firebase:** add the **Android** app (package `io.github.alexdlc5.glimmerwood`) → send Claude **google-services.json**.
5. **Play Console → Create app** → Game, Free → privacy policy URL, ads = yes, content rating, target audience **13+** (not under-13), advertising ID = yes. Claude writes the Data safety answers.
6. **Closed test:** Claude makes the Android upload key and a signed .aab → you upload it → add the tester group → send the opt-in link.
7. **In-app product** `no_ads` $4.99 (after the first upload) → **RevenueCat:** add a Play Store app with a Google service account → send Claude the `goog_…` key.
8. After 14 days with 12+ testers: **apply for production access**, then publish.

---

## What Claude does with each answer

| You send / do | Claude does |
|---|---|
| "secrets added" | runs the TestFlight upload; fixes anything Apple rejects in processing |
| AdMob iOS IDs + publisher ID | puts them in `proto/platform.js` and `ios/App/App/Info.plist`, adds your `app-ads.txt` line; test ads stay on in TestFlight |
| GoogleService-Info.plist | adds Firebase Analytics, Crashlytics, Remote Config; moves timer and ad pacing into Remote Config |
| `appl_…` key | turns on Remove ads + Restore purchases; tests with your sandbox account |
| "ready to submit" | screenshots, listing text, privacy-label answers, review notes, IAP review screenshot |
