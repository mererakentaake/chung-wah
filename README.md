# Chung Wah E-School 🎓

A full-featured school management platform converted from Flutter to **React + Capacitor + Electron**, connected to **Firebase**.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Capacitor](https://img.shields.io/badge/Capacitor-5-119EFF?logo=capacitor) ![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron) ![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)

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

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/chung-wah-eschool.git
cd chung-wah-eschool
npm install
```

### 2. Configure Firebase

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase project credentials (from Firebase Console → Project Settings → Your Apps).

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

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

## 📱 Building the Android APK

### Automated via GitHub Actions

Push to `main` or `develop` to trigger an automatic APK build.

**Required GitHub Secrets:**

| Secret | Description |
|---|---|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `KEYSTORE_BASE64` | Base64-encoded `.jks` keystore (for release builds on `main`) |
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

The workflow produces:
- **Debug APK** on every push (artifact retained 30 days)
- **Release APK** on pushes to `main` (artifact retained 90 days)

### Manual Android Build

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🖥️ Electron Desktop Build

```bash
npm run electron:build
# Output in dist-electron/
```

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

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── layout/      TopBar, BottomNav
│   └── ui/          DashboardCard, LoadingScreen
├── context/         AuthContext, ThemeContext
├── pages/
│   ├── auth/        Login, ForgotPassword
│   ├── dashboard/   Home (Student + Teacher/Parent dashboards)
│   └── ...          Announcements, Chat, Assignments, Holidays,
│                    TimeTable, Profile, Settings, ECard, Fees,
│                    Exams, Transportation, Parenting, EBooks, Children
├── services/        firebase.js, auth.js, firestore.js
└── utils/           constants.js
electron/            main.js, preload.js
.github/workflows/   android-build.yml
```

---

## 🎨 Tech Stack

- **React 18** + Vite
- **Tailwind CSS** (custom design system with Plus Jakarta Sans + DM Sans fonts)
- **Firebase 10** (Auth + Firestore + Storage + Analytics)
- **Capacitor 5** (Android/iOS wrapper)
- **Electron 28** (Desktop wrapper)
- **React Router 6**
- **Framer Motion** (animations)
- **React Hot Toast** (notifications)
- **date-fns** (date formatting)

---

## 📜 License

MIT — originally based on [ourESchool Flutter project](https://github.com/original-repo)
