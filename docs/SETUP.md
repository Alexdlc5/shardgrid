# Glimmerwood: everything you set up, step by step

*Updated 2026-10-15. Stack: the web game wrapped with Capacitor. Ads = Google AdMob, purchases = RevenueCat,
stats/crashes/remote tuning = Firebase. Android first; iOS after the fun test.*
*Menus on these sites move around; if a label differs slightly, look for the nearest match.*

## Status

| | Step | Status |
|---|---|---|
| ✅ | Contact email | **pubshiftsupport@gmail.com** |
| ✅ | Public website | **https://alexdlc5.github.io** (privacy, terms, app-ads.txt) |
| ⬜ | 1. Google Play Console account | start today (takes days) |
| ⬜ | 2. Testers (12+, for 14 days) | start today (takes 2+ weeks) |
| ⬜ | 3. AdMob | start today (review takes 1–3 days) |
| ⬜ | 4. Firebase | 10 minutes |
| ⬜ | 5. Play Console: create the app + listing forms | after 1 |
| ⬜ | 6. Closed test + first upload | after 5 (Claude builds the upload) |
| ⬜ | 7. "Remove ads" product | after 6 |
| ⬜ | 8. RevenueCat | after 7 |
| ⬜ | 9. Trademark check | 5 minutes |
| ⬜ | 10. *(later)* Apple, extra ad networks | after the fun test |

**What to send Claude** is in bold at the end of each part. None of these IDs are secret: they ship inside the app.
The one secret is the app **upload key** (part 6), and Claude makes that for you.

---

## 1. Google Play Console account ($25 once)

1. Go to **play.google.com/console/signup** and sign in with the Google account you want to own the game.
2. Choose **"Yourself"** (a personal account).
3. Fill in the developer name. This shows on the store; it can be your name or a studio name, e.g. "Glimmerwood Games". The contact email is **pubshiftsupport@gmail.com**, and the website is **https://alexdlc5.github.io**.
4. Pay the **$25** fee.
5. Do the **identity verification** (government ID). Google may also ask you to verify a phone number and to prove you have an Android device by signing in to the **Play Console app** on your phone.
6. Wait for the "account verified" email. That usually takes a few days.

**Send Claude:** "Play account approved."

## 2. Testers (start now, it's the slowest step)

New personal accounts must run a **closed test with at least 12 testers opted in for 14 days in a row** before the game can go public.

1. Go to **groups.google.com** → **Create group** → name it `glimmerwood-testers`. Set "Who can join" to *Invited users only*.
2. Add **15–20** people (more than 12, so dropouts don't reset the clock). They need a **Gmail / Google account** and an **Android phone**.
3. Tell them what you'll ask: install from the Play link you'll send, keep it installed for 14 days, and open it every few days. Google looks at engagement when you apply for production.

**Send Claude:** the group's email address (`glimmerwood-testers@googlegroups.com`).

## 3. AdMob (ads)

1. Go to **admob.google.com** → **Get started**, using the same Google account as Play.
2. Pick your **country**, **time zone** (Pacific) and **billing currency** (USD), then accept the terms.
3. **Payments:** left menu → **Payments** → add your name and address. Later, under **Payments → Settings**, add **US tax info** (a W-9 for an individual). Nothing is paid out until you pass $100.
4. **Add the app:** **Apps** → **Add app** → platform **Android** → "Is the app listed on a supported app store?" **No** → name **Glimmerwood** → leave *User metrics* **on** → **Add app**.
   - Copy the **App ID**. It looks like `ca-app-pub-1234567890123456~1234567890`.
5. **Create 3 ad units** in the app → **Ad units** → **Add ad unit**:
   - **Rewarded** → name `Rewarded` → reward amount **1**, reward item **reward** → leave the rest as default → **Create ad unit**. Copy the ID (`ca-app-pub-…/…`).
   - **Interstitial** → name `Interstitial haul` → create, copy the ID.
   - **Banner** → name `Banner menus` → create, copy the ID.
6. **Privacy & messaging** (left menu). These are the consent pop-ups the law requires; the game already shows them:
   - **European regulations (GDPR)** → **Create message** → select the app **Glimmerwood** → language **English** → user choices: **Consent**, **Do not consent**, **Manage options** → privacy policy URL **https://alexdlc5.github.io/privacy.html** → **Publish**.
   - **US state regulations** → **Create message** → select the app → **Publish**.
   - Skip the "IDFA explainer" until iOS.
7. **Blocking controls** (left menu) → **Content** → **Sensitive categories**: block **Gambling and betting**, **Dating** and other adult categories. That keeps the game's age rating friendly; the competitor's rating picked up "simulated gambling" from its ads.
8. **Your test phone:** **Settings** → **Test devices** → **Add test device**. Name it, and enter your phone's **advertising ID**, found on Android under *Settings → Google → Ads*.
9. **Publisher ID:** **Settings** → **Account information** → copy **Publisher ID** (`pub-1234567890123456`).
10. Later, once the game is on Play: **Apps** → Glimmerwood → **App settings** → **link to the Play listing**. AdMob then reviews the app (1–3 days) and checks `app-ads.txt` on your website.

**Important:** never tap real ads on your own phone; Google can close accounts for it. That's why step 8 matters.

**Send Claude:** the **App ID**, the 3 **ad unit IDs** (Rewarded, Interstitial, Banner) and your **Publisher ID**.
Claude then puts them in the game, adds your line to app-ads.txt, and keeps test ads on until release.

## 4. Firebase (stats, crash reports, remote tuning)

1. Go to **console.firebase.google.com** → **Create a project** → name **Glimmerwood** → leave **Google Analytics on** → pick *Default Account for Firebase* → **Create project**.
2. On the project page → **Add app** → the **Android** icon:
   - Package name **`io.github.alexdlc5.glimmerwood`** (exactly this)
   - Nickname `Glimmerwood Android`, and leave SHA-1 empty
   - **Register app** → **Download google-services.json** → skip the remaining steps (Claude does them).
3. Left menu → **Crashlytics** → **Get started**. That's all it needs.
4. Left menu → **Remote Config** → **Create configuration**, then leave it empty. Claude uploads the game's tuning values.
5. *Optional, nice:* in AdMob → **Apps** → Glimmerwood → **App settings** → **Link to Firebase**, which gives better ad revenue reports.

**Send Claude:** the **google-services.json** file. Drag it into the chat, or save it as `shardgrid/android/app/google-services.json`.

## 5. Play Console: create the app and fill the forms (after part 1)

1. **Home** → **Create app** → name **Glimmerwood** → language **English (US)** → **Game** → **Free** → tick the declarations → **Create app**.
2. The dashboard lists **"Set up your app"** tasks. Answers:
   - **Privacy policy:** https://alexdlc5.github.io/privacy.html
   - **App access:** "All functionality is available without special access"
   - **Ads:** **Yes**, my app contains ads
   - **Content rating:** start the questionnaire → email pubshiftsupport@gmail.com → category **Game**. Answer honestly: no violence, no gambling, no user chat, no sharing location. It contains ads and digital purchases (the "Remove ads" purchase). The result should be around **Everyone / PEGI 3**.
   - **Target audience:** **13–15, 16–17, 18+**. *Don't* tick under-13 ages, or Google's Families rules restrict which ad networks you can use.
   - **News app:** No. **Government app:** No. **Financial features:** None. **Health:** None.
   - **Advertising ID:** **Yes**, used for **Advertising or marketing** and **Analytics**
   - **Data safety:** Claude will write the exact answers from the SDKs in the build when you get here (it takes a few minutes). The short version: device IDs, app interactions, crash and diagnostics data and purchase history are collected, partly shared with ad partners, encrypted in transit. Deletion URL: **https://alexdlc5.github.io/privacy.html#delete**
3. **Store listing:** Claude prepares the short and full descriptions, the 512×512 icon, the 1024×500 feature graphic and phone screenshots. You paste them in.
4. **Settings → Payments profile** (or *Monetize → set up a merchant account*): add tax and bank details. This is needed before you can sell "Remove ads".

**Send Claude:** "app created."

## 6. Closed test and first upload (after part 5)

1. Claude makes your **upload key** (the file that proves updates come from you), keeps it in the repo's private GitHub secrets, and gives you a backup copy. **Store the backup somewhere safe** (e.g. a password manager). Google's *Play App Signing* is on by default, so if the upload key is lost Google can reset it, but it's slow.
2. Claude's GitHub workflow builds a signed **release bundle (.aab)** and gives it to you.
3. Play Console → **Test and release** → **Testing** → **Closed testing** → **Create track** (or use "Alpha") → **Testers** → add your Google Group from part 2 → **Create new release** → upload the .aab → release name `0.1.0` → **Review** → **Start rollout**.
4. Copy the **opt-in link** from the Testers tab and send it to the group. The 14-day clock starts once 12 have opted in.

**Send Claude:** "closed test live" and the date 12 testers joined.

## 7. "Remove ads" product (after the first upload)

Play only lets you create products after a build with billing is uploaded, which part 6 does.

1. Play Console → **Monetize** → **Products** → **In-app products** → **Create product**.
2. Product ID **`no_ads`** (exactly this; it can never change) → name **Remove ads** → description "Removes interstitial and banner ads. Rewarded ads stay optional." → price **$4.99** → **Save** → **Activate**.

**Send Claude:** "product created."

## 8. RevenueCat (purchase checking and restores)

1. Go to **app.revenuecat.com** → sign up → **Create project** → **Glimmerwood**.
2. **Apps** → **+ New** → **Google Play Store** → name `Glimmerwood Android` → package **`io.github.alexdlc5.glimmerwood`**.
3. **Service account credentials:** RevenueCat shows a guide link ("Creating Play Service Credentials"). Follow it. You'll:
   - create a service account in **Google Cloud Console** and download its **JSON key**,
   - in Play Console → **Users and permissions** → **Invite new users**, add that service account email with **View app information**, **View financial data** and **Manage orders and subscriptions**,
   - upload the JSON to RevenueCat. *It can take up to a day before RevenueCat shows "valid".*
4. **Product catalog** → **Products** → **+ New** → identifier **`no_ads`**.
5. **Entitlements** → **+ New** → identifier **`no_ads`** → attach the `no_ads` product.
6. **Offerings** → open **default** (make sure it's *Current*) → **+ Package** → type **Lifetime** → attach `no_ads`.
7. **API keys** → copy the **Google Play public SDK key** (starts with `goog_`).

**Send Claude:** the **`goog_…` key**. The "Remove ads" button and "Restore purchases" then go live.

## 9. Trademark check (5 minutes)

1. Go to **tmsearch.uspto.gov** → search **GLIMMERWOOD** (and **GLIMMER WOOD**).
2. Look for live marks in **class 9** (software, games) and **class 41** (entertainment).

**Send Claude:** "clear", or what you found.

## 10. Later (after the fun test passes)

- **Apple:** **developer.apple.com/programs/enroll** ($99/yr, individual) → in **App Store Connect**, accept the *Paid Apps* agreement and add tax and banking → Claude walks you through the iOS app, the `no_ads` product, a sandbox tester, and the iOS pieces in AdMob, Firebase and RevenueCat.
- **More ad money:** AppLovin and Unity Ads accounts, added as **AdMob mediation** partners (AdMob → *Mediation*). Worth it once you have real players.

---

## What Claude does after each answer

| You send | Claude does |
|---|---|
| AdMob IDs | puts them in `proto/platform.js` and the Android manifest, adds your app-ads.txt line, keeps test ads until release |
| google-services.json | adds the Firebase Analytics, Crashlytics and Remote Config plugins; moves timer and ad caps into Remote Config |
| "app created" | writes the Data safety answers, the store listing text and the graphics |
| "ready for upload" | makes the upload key, signed .aab build workflow, and backup for you |
| `goog_…` key | turns on Remove ads and Restore purchases, then tests a purchase with a license tester |
| tester group | adds it to the closed test, and drafts the message to testers |

You never need Android Studio, Unity or a Mac. GitHub builds the app; you need a phone.
