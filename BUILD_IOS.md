# Building Creeda for iOS — plain-language guide

Creeda's iOS code is the same Expo app the Android side uses. The codebase is iOS-ready (route handlers, HealthKit, MediaPipe pose detection, AI chat, push reminders), but Apple requires a paid developer account and a few one-time setup steps before you can install it on a real iPhone or publish to the App Store.

This document is the layman's checklist.

---

## Step 1 · Get an Apple Developer account

**Why:** Apple charges $99/year for the right to install custom apps on real iPhones and submit to the App Store.

1. Open `developer.apple.com/programs` in a browser.
2. Click **Enroll**.
3. Sign in with your Apple ID (or create one).
4. Choose **Individual** or **Company**. Individual is simplest if you're shipping under your own name; Company requires a D-U-N-S number which takes ~1 week to verify.
5. Pay the **US $99** annual fee. Apple emails confirmation within 24 hours (often within 1 hour).

**You'll know it worked when** Apple sends "Welcome to the Apple Developer Program."

---

## Step 2 · Tell Expo about your Apple account

**Why:** EAS (Expo's cloud build service) builds the iOS app on its servers. To sign the build with your developer cert, EAS needs your Apple credentials.

1. Open **Terminal** on your Mac. Paste these one at a time:
   ```
   cd /Users/creeda/CREEDA-2.0-Android
   eas login
   ```
2. Then run:
   ```
   eas credentials
   ```
3. When prompted, choose:
   - Platform → **iOS**
   - Profile → **production**
   - "What do you want to do?" → **Set up a build credentials**
   - Apple account email → your Apple Developer email
   - Apple App-Specific password → a one-time password you generate at `appleid.apple.com` → "Sign-In and Security" → "App-Specific Passwords"
4. EAS automatically generates the necessary certificates and provisioning profiles for you.

**You'll know it worked when** Terminal shows "Successfully set up build credentials."

---

## Step 3 · Trigger the first iOS build

**Why:** EAS compiles the app on its servers (you don't need a Mac with Xcode), produces an .ipa file, and emails you a link to install on your iPhone via TestFlight.

```
eas build --platform ios --profile preview
```

Wait ~20 minutes. EAS prints a link as it goes. When it's done, you'll get:
- An install link (works only on iPhones registered in your Apple Developer portal, but TestFlight handles this for you)
- Or a TestFlight upload (if `--auto-submit` was set)

---

## Step 4 · Add testers via TestFlight

**Why:** TestFlight is Apple's beta-distribution app. You add tester emails and they install the build on their phones with a tap.

1. Go to `appstoreconnect.apple.com` → My Apps → Creeda → TestFlight tab.
2. Click **+ Internal Testing**.
3. Add your own email + any beta testers.
4. They install **TestFlight** from the App Store and follow the email link.

Each new build you push goes through this same flow — no waiting for Apple App Store review during beta.

---

## Step 5 · Submit to App Store (eventually)

When you're ready to ship publicly:

```
eas build --platform ios --profile production
eas submit --platform ios
```

EAS uploads the build directly to App Store Connect. You then fill in screenshots, app description, and submit for Apple review. Review takes 1–7 days typically.

---

## What to expect — common gotchas

- **"App not available in this region"** during install → make sure your Apple Developer account country matches the testers' region, or use TestFlight which handles region.
- **HealthKit entitlement** → Creeda's `app.config.js` already declares `NSHealthShareUsageDescription`. EAS includes the entitlement automatically because we use `@kingstinct/react-native-healthkit`. If you ever see "missing entitlement," run `eas credentials` and re-pull.
- **MediaPipe pose model** → before each build, run `npm run setup-mediapipe` so the .task model is bundled. This applies to both Android and iOS.
- **Build fails with provisioning profile errors** → run `eas credentials` and pick "Remove all credentials" then re-set them up. Apple's provisioning profiles expire occasionally.

---

## What's already done in the code

- `app.config.js` declares the iOS bundle id (`com.creeda.app`), HealthKit usage descriptions, and camera permissions.
- `eas.json` defines `development`, `preview`, and `production` profiles for both iOS and Android.
- All app screens (chat, daily ritual, movement scan, onboarding, dashboards, squad join) work cross-platform.
- The Apple Health integration screen at `/apple-health` reads HRV / resting HR / sleep / steps / active energy / weight via `@kingstinct/react-native-healthkit` and posts daily summaries to the same `/api/wearables/manual-import` endpoint Health Connect uses.

You don't need to write any new code for iOS. The only blocker is the $99 Apple Developer enrolment + the EAS build commands above.
