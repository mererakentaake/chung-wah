# Chung Wah E-School 🎓

A full-featured school management platform converted from Flutter to **React + Capacitor + Electron**, connected to **Firebase**.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF?logo=capacitor) ![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron) ![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase) ![Cloudinary](https://img.shields.io/badge/Cloudinary-uploads-3448C5?logo=cloudinary)

---

## ✨ Features

| Feature | Teachers | Students | Parents |
|---|---|---|---|
| Announcements (create/read) | ✅ Create | ✅ Read | ✅ Read |
| Assignments | ✅ Upload | ✅ View/Download | ✅ View |
| Chat | ✅ | ✅ | ✅ |
| Timetable | ✅ | ✅ | ✅ |
| Holidays Calendar | ✅ | ✅ | ✅ |
| E-Card | ✅ | ✅ | ✅ |
| School Fees | ✅ | ✅ | ✅ |
| Exams / Quizzes | ✅ | ✅ | — |
| E-Books | — | ✅ | — |
| Children Management | — | — | ✅ |
| Transportation Routes | ✅ | ✅ | ✅ |
| Parenting Guide | — | — | ✅ |
| Dark Mode | ✅ | ✅ | ✅ |
| Profile with photo upload | ✅ | ✅ | ✅ |

> **Dark Mode note:** every page follows the system theme toggle consistently (this took a couple of rounds to get right — see [Theming](#-theming) below for how it actually works, especially if you're adding a new page).

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/chung-wah-eschool.git
cd chung-wah-eschool
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with two sets of values:

**Firebase** (Console → Project Settings → Your Apps → Web app):
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```
Used for Auth + Firestore only. (See [File uploads](#-file-uploads--cloudinary-not-firebase-storage) for why Storage isn't part of this list.)

**Cloudinary** (Dashboard → cloud name; Settings → Upload → Upload presets → create an **unsigned** preset):
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
```
Powers profile photo, assignment, and announcement image uploads.

**Optional, local dev only:**
```env
VITE_ENABLE_DEBUG_PANEL=true
```
Shows the floating in-app Debug Log button (see [Debug Log panel](#-debug-log-panel) below). CI sets this automatically per build variant — you only need it locally if you want the panel while running `npm run dev`.

### 3. Run

```bash
# Web development server
npm run dev

# Electron desktop app (dev)
npm run electron:dev

# Android (requires Android Studio)
npm run build
npx cap add android
npm run cap:android
```

---

## 📤 File uploads — Cloudinary, not Firebase Storage

As of late 2025, Firebase Storage requires the project to be on the paid **Blaze** billing plan (a linked card) even to use the free-tier quota. To avoid requiring a card, **all file uploads go through Cloudinary's free tier instead** — this app never initializes Firebase Storage at all.

- Client code: `uploadFile()` in `src/services/firestore.js` posts directly to Cloudinary's unsigned upload endpoint (`https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload`). No server-side secret is needed or used.
- Used by: profile photos (own + child profiles), assignment attachments, announcement images.
- Requires an **unsigned** upload preset (Cloudinary Console → Settings → Upload → Upload presets). Turning on **Overwrite** on that preset means re-uploading a photo to the same path replaces the old asset instead of piling up versions.
- `firebase.json` and `firestore.rules` still exist and are deployed as usual (`firebase deploy --only firestore:rules`) — only `storage.rules` was removed, since there's no Storage bucket in use to apply it to.

If you ever see an upload fail with `Storage upload timed out after 25000ms`, that error text is stale/pre-migration — it means the running APK predates this change, not a live Firebase Storage problem. Rebuild via the GitHub Actions workflow (below) to get a current build.

---

## 🔑 Google Sign-In

Every login tab (Student/Parent/Teacher/Admin/Accounts) also offers **"Continue with Google"**, so people don't have to type their email each time. This does **not** loosen the app's closed/invite-only model — signing in with Google still goes through the exact same pre-registration check as the email/password flow (matching the Google account's email against `Login/{type}/users`, `admins`, or `accountsUsers`, depending on the selected tab). If the email isn't pre-registered, it's rejected with the same message either way.

Implementation: `@codetrix-studio/capacitor-google-auth` (native Google Sign-In, not a WebView popup — Google blocks OAuth popups inside embedded WebViews, which is what a plain Firebase `signInWithPopup()` would try to use). The native plugin returns a Google ID token, exchanged for a Firebase Auth credential via `GoogleAuthProvider.credential()` — see `loginWithGoogle()` in `src/services/auth.js`.

**One-time setup required** (only needs doing once per Firebase project, not per build):

1. **Firebase Console** → Authentication → Sign-in method → enable **Google**.
2. **Firebase Console** → Project Settings → Your apps → for **each** registered Android app (`com.meresimi.chungwah` and `com.meresimi.chungwah.dev`) → **Add fingerprint** → paste in that app's SHA-1.
   - Get the SHA-1s from the build logs: every workflow run prints both the debug keystore's SHA-1 (step "Print debug keystore SHA-1") and, if `KEYSTORE_BASE64` is set, the release keystore's too.
   - The debug keystore is cached across runs (`debug-keystore-v1` in Actions cache) specifically so this SHA-1 doesn't change on every rebuild — you only need to add it once.
3. **Google Cloud Console** → APIs & Services → Credentials (same project as Firebase) → under "OAuth 2.0 Client IDs", find the one with type **Web application** (Firebase auto-creates this when you enable Google Sign-In in step 1) → copy its Client ID.
4. Add that value as the `VITE_GOOGLE_WEB_CLIENT_ID` GitHub secret (see table below). Do **not** use an Android-type client ID here — it must be the Web application one.
5. Re-run whichever build(s) you need.

---

## 📱 Building the Android APK

### Automated via GitHub Actions

Builds are **manually triggered** (not on every push) via two separate workflows, both defined by triggering the *same* shared pipeline with different settings — this is deliberate, so the two variants can never quietly drift apart from each other. See `.github/workflows/`:

| File | Purpose |
|---|---|
| `build-android-shared.yml` | The real pipeline — env config, Cloudinary/Firebase secrets, icon/splash generation, SDK version fixes, Gradle build. Never triggered directly. |
| `android-build-dev.yml` | **Developer build.** Includes the Debug Log panel. Installs as a separate app (`com.meresimi.chungwah.dev`, labeled "Chung Wah (Dev)") so it can sit on your phone alongside the real app. |
| `android-build-user.yml` | **User-facing build.** No Debug Log panel — not hidden, not shipped in the bundle at all. This is the one you actually distribute. |

To run either: repo → **Actions** tab → pick **"Build Android APK (Developer)"** or **"Build Android APK (Users)"** → **Run workflow**. When it finishes, download the APK from that run's **Artifacts** section.

Only change build steps in `build-android-shared.yml` — edits there apply to both variants next time either is run. The two trigger files should stay as thin `with:` blocks; if you need a new setting to differ between dev/user builds, add it as a new `input` on the shared workflow first.

**Required GitHub Secrets** (repo → Settings → Secrets and variables → Actions):

| Secret | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No longer read by the app; harmless to leave set or remove |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (Dashboard home page) |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your **unsigned** Cloudinary upload preset name |
| `VITE_GOOGLE_WEB_CLIENT_ID` | The **Web application**-type OAuth Client ID for "Sign in with Google" — see [Google Sign-In](#-google-sign-in) below |
| `GOOGLE_SERVICES_JSON_BASE64` | Base64 of `google-services.json` (Firebase Console → Your apps → Android app) — required for native push notifications to not crash the app on login, and must include an entry for **every** registered package name (`com.meresimi.chungwah` and `com.meresimi.chungwah.dev`) |
| `KEYSTORE_BASE64` | Base64-encoded `.jks` keystore (enables the signed release-APK job) |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias |
| `KEY_PASSWORD` | Key password |

**Generate a keystore:**
```bash
keytool -genkey -v -keystore release-key.jks -alias key0 -keyalg RSA -keysize 2048 -validity 10000
# Then encode it:
base64 -i release-key.jks | pbcopy   # macOS
base64 release-key.jks               # Linux (copy output to GitHub secret)
```

Each run produces:
- **Debug APK** (`chung-wah-dev.apk` or `chung-wah.apk`, artifact retained 30 days)
- **Release APK** (retained 90 days) — only if `KEYSTORE_BASE64` is set

### Manual Android Build

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```
Building locally skips the CI-only steps (icon/splash generation from `public/app-icon.png`, SDK version patching, `google-services.json` injection) — do those manually first if you need them, or just use the GitHub Actions build.

---

## 🖥️ Electron Desktop Build

```bash
npm run electron:build
# Output in dist-electron/
```

---

## 🐛 Debug Log panel

A floating "Debug Log" button (bottom-right, always on top) that opens an in-app log viewer — built for diagnosing issues on a real device with no laptop/adb access. It patches `console.*`, `window.fetch`, and uncaught error/rejection handlers, and persists everything to `localStorage` so a session survives even if the app crashes right after.

Only present in **developer** builds (`VITE_ENABLE_DEBUG_PANEL=true`) — Vite dead-code-eliminates it entirely from user-facing builds, so end users never see it and it adds zero bundle size or runtime overhead for them.

What it shows:
- **Build stamp** — git commit + build timestamp (from `VITE_GIT_COMMIT`/`VITE_BUILD_TIME`, written by CI) plus app version and device model/OS — the fastest way to confirm "is this device actually running the build I think it is?"
- **Level filters** (Log / Info / Warn / Error / Net) and a **search box**
- **Network request log** — every `fetch` call with method, URL, status, and timing
- **Sessions** grouped and collapsible (one per app launch), newest expanded by default
- **Share** button (native share sheet) and **Copy**, so a log can be sent straight from the device without a laptop
- Online/offline indicator, UTC/local timestamp toggle, storage usage counter (capped at 500 entries)

Source: `src/services/debugLogger.js` (capture logic) + `src/components/ui/DebugLogButton.jsx` (panel UI).

---

## 🎨 Theming

Dark/Light mode is controlled by `ThemeContext` (`src/context/ThemeContext.jsx`), which toggles a `dark` class on `<html>` — this is also wired into Tailwind's `darkMode: 'class'` config.

Two things to know before touching page styles:

1. **Body text on theme-following pages** (`mesh-bg` background) uses plain `text-white` / `text-white/NN` Tailwind classes, same as always — a global rule in `src/index.css` automatically re-colors these to a legible dark color whenever Light Mode is active, so you don't need `dark:` variants for ordinary page text.
2. **Surfaces that are intentionally dark in both themes** (bottom-sheet modals, confirmation dialogs, the Welcome/onboarding screen) must carry a `surface-dark` marker class on their outer container, or their white text will get incorrectly re-colored by the rule above. Search the codebase for `surface-dark` for existing examples before adding a new modal.

Pages built before this system was wired up used a separate hardcoded-light design (`bg-gray-50`, `bg-white`, `text-gray-900`, no `dark:` variants at all) — `AdminDashboard.jsx` has been migrated to the shared `mesh-bg`/`glass-card` system described above. A few other admin/management pages (Assessments, Clubs, Fee management, Announcements, Permission Forms) still use the old hardcoded-light pattern and will look the same in both themes until migrated the same way.

---

## 🔥 Firebase Firestore Structure

```
schools/
  {SCHOOL_CODE}/
    Login/
      Student/users/      ← student login records
      Parent-Teacher/users/ ← teacher/parent login records
    announcements/        ← all school posts
    assignments/          ← uploaded assignments
    chats/
      {chatId}/messages/  ← chat messages
    students/             ← student profiles
    Parent-Teacher/       ← teacher/parent profiles
    timetable/            ← class timetables
    holidays/             ← holiday records
```

Firestore rules live in `firestore.rules` and deploy with `firebase deploy --only firestore:rules`. (There is no `storage.rules` — see [File uploads](#-file-uploads--cloudinary-not-firebase-storage).)

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── layout/      TopBar, BottomNav
│   └── ui/          DashboardCard, LoadingScreen, ErrorBoundary,
│                     ExitConfirmModal, DebugLogButton
├── context/         AuthContext, ThemeContext
├── pages/
│   ├── auth/        Login, ForgotPassword
│   ├── admin/       AdminDashboard, CreateEditUser, ManageStudents, ManageTeachers
│   ├── accounts/    ManageFees
│   ├── assessment/  AssessmentView
│   ├── clubs/       ClubDetail
│   ├── permissions/ ParentPermissionForms
│   └── ...          Home (dashboard), Announcements, Chat, Assignments,
│                     Holidays, TimeTable, Profile, Settings, ECard,
│                     Exams, Transportation, Parenting, EBooks,
│                     StudentReports, LinkGuardian, Welcome
├── services/        firebase.js (Auth + Firestore only — no Storage),
│                     firestore.js (data + Cloudinary uploads),
│                     debugLogger.js
└── utils/           constants.js
electron/            main.js, preload.js
.github/workflows/   build-android-shared.yml (real pipeline),
                     android-build-dev.yml, android-build-user.yml (triggers)
```

---

## 🎨 Tech Stack

- **React 18** + Vite
- **Tailwind CSS** (custom design system with Plus Jakarta Sans + DM Sans fonts, `darkMode: 'class'`)
- **Firebase 10** (Auth + Firestore + Analytics — no Storage)
- **Cloudinary** (file uploads — profile photos, assignments, announcements)
- **Capacitor 6** (Android/iOS wrapper)
- **Electron 28** (Desktop wrapper)
- **React Router 6**
- **Framer Motion** (animations)
- **React Hot Toast** (notifications)
- **date-fns** (date formatting)

---

## 📜 License

MIT — originally based on [ourESchool Flutter project](https://github.com/original-repo)
