# Phase 9 — Push Notifications Setup Guide

## Prerequisites
- Firebase **Blaze** (pay-as-you-go) plan (upgrade from Spark in Firebase Console)
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in: `firebase login`

---

## Step 1 — Generate VAPID Key (web push)

1. Firebase Console → Project Settings → **Cloud Messaging** tab
2. Scroll to **Web Push certificates**
3. Click **Generate key pair**
4. Copy the key string
5. Add to your `.env` file:
   ```
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

---

## Step 2 — Update firebase-messaging-sw.js

Open `public/firebase-messaging-sw.js` and replace the placeholder values with
your actual Firebase config values (same values as in your `.env`):

```js
firebase.initializeApp({
  apiKey:            'your_api_key',
  authDomain:        'your_project.firebaseapp.com',
  projectId:         'your_project_id',
  storageBucket:     'your_project.appspot.com',
  messagingSenderId: 'your_sender_id',
  appId:             'your_app_id',
});
```

---

## Step 3 — Update .firebaserc

Open `.firebaserc` and replace `"chung-wah"` with your actual Firebase project ID
(visible in Firebase Console → Project Settings → General → Project ID):

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

---

## Step 4 — Install and deploy Cloud Functions

```bash
# Install functions dependencies
cd functions
npm install
cd ..

# Deploy functions only (first deploy)
firebase deploy --only functions

# Deploy everything (rules + functions)
firebase deploy
```

---

## Step 5 — Install Capacitor push plugin

```bash
npm install @capacitor/push-notifications
npx cap sync android
```

---

## Step 6 — Android notification channel (optional but recommended)

In `android/app/src/main/res/values/strings.xml`, the default notification icon
`ic_notification` should exist. If you haven't added one:

1. Create `android/app/src/main/res/drawable/ic_notification.xml` (a white vector icon)
2. Or update the `icon` value in `functions/index.js` → `sendToTokens` to use
   an existing drawable name like `ic_launcher_foreground`

---

## Step 7 — Update Firestore rules

Copy the updated `firestore.rules` file to Firebase Console → Firestore → Rules,
or deploy it:

```bash
firebase deploy --only firestore:rules
```

---

## How notifications fire

| Event | Who gets notified |
|---|---|
| Teacher posts homework | All parents of that class |
| Homework/test marked | All parents of that class |
| Syllabus topic completed | All parents of that class |
| Syllabus topic overdue (daily 7am UTC) | All parents of that class |
| Club announcement approved | Parents of club members |
| Club announcement school-wide | All users |
| Permission form created | All parents of that class |
| School-wide announcement | All users |
| Class announcement | All parents of that class |
| Teacher replies to homework enquiry | The enquiring parent only |

---

## Free tier limits (Blaze plan)

Cloud Functions free tier (per month):
- **2 million** function invocations — a school this size will use ~1,000/month
- **400,000 GB-seconds** of compute — negligible for these functions
- **200 GB** outbound networking

**You will not be charged** unless the school somehow exceeds 2 million function
calls in a single month, which is extremely unlikely.

FCM (Firebase Cloud Messaging) itself is **always free** — unlimited messages, no caps.
