// src/services/notifications.js
// Push notification setup for Chung Wah E-School.
// Uses @capacitor/push-notifications for native Android and
// Firebase Web Messaging as a fallback for browser/desktop.

import { Capacitor } from '@capacitor/core';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ─── Save / remove token in Firestore ────────────────────────────────────────
// fcmTokens/{authUid}: { token, authUid, docId, userType, platform, updatedAt }
// Cloud Functions query by docId (the Login collection doc ID) to fan-out notifications.

export const saveFcmToken = async (token, authUid, docId, userType) => {
  if (!token || !authUid) return;
  await setDoc(doc(db, 'fcmTokens', authUid), {
    token,
    authUid,
    docId,
    userType,
    platform: Capacitor.getPlatform(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const removeFcmToken = async (authUid) => {
  if (!authUid) return;
  try { await deleteDoc(doc(db, 'fcmTokens', authUid)); } catch (_) {}
};

// ─── Native Android (Capacitor) ───────────────────────────────────────────────
const initNativePush = async (authUid, docId, userType) => {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      console.info('[FCM] Push permission not granted');
      return;
    }

    await PushNotifications.register();

    // Save the token once registration succeeds
    PushNotifications.addListener('registration', async ({ value: token }) => {
      await saveFcmToken(token, authUid, docId, userType);
      console.info('[FCM] Native token saved');
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[FCM] Registration error', err);
    });

    // Foreground notification — Capacitor suppresses the system UI,
    // so we log it; the app can show an in-app banner if desired.
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.info('[FCM] Foreground notification:', notification.title);
    });

    // User tapped the notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.info('[FCM] Notification tapped:', action.notification.title);
      // Future: navigate to relevant screen based on action.notification.data.type
    });
  } catch (err) {
    console.error('[FCM] Native push init failed:', err);
  }
};

// ─── Web / browser (Firebase Web Messaging) ───────────────────────────────────
const initWebPush = async (authUid, docId, userType) => {
  try {
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Browser notification permission not granted');
      return;
    }

    const { getMessaging, getToken } = await import('firebase/messaging');
    const { default: app } = await import('./firebase');
    const messaging = getMessaging(app);

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] VITE_FIREBASE_VAPID_KEY not set — web push disabled');
      return;
    }

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await saveFcmToken(token, authUid, docId, userType);
      console.info('[FCM] Web token saved');
    }
  } catch (err) {
    console.error('[FCM] Web push init failed:', err);
  }
};

// ─── Public: call this after a successful login ────────────────────────────────
// authUid  — Firebase Auth UID (from firebase.auth().currentUser.uid)
// docId    — Login collection document ID (stored in localStorage as 'userId')
// userType — e.g. 'student', 'parent', 'teacher'
export const initPushNotifications = async (authUid, docId, userType) => {
  if (!authUid) return;
  if (Capacitor.isNativePlatform()) {
    await initNativePush(authUid, docId, userType);
  } else {
    await initWebPush(authUid, docId, userType);
  }
};
