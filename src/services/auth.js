// src/services/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDoc, getDocs, getDocFromServer, getDocsFromServer,
  collection, query, where, setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { USER_TYPES } from '../utils/constants';

// ─── DEBUG LOGGER ─────────────────────────────────────────────────────────────
const DEBUG_KEY = '__auth_debug_log__';
const stamp = () => new Date().toLocaleTimeString();
function dlog(msg) {
  console.log(`[AUTH-DEBUG] ${msg}`);
  try {
    const existing = JSON.parse(sessionStorage.getItem(DEBUG_KEY) || '[]');
    existing.push(`${stamp()} — ${msg}`);
    sessionStorage.setItem(DEBUG_KEY, JSON.stringify(existing.slice(-60)));
  } catch (_) {}
}
export function getDebugLog() {
  try { return JSON.parse(sessionStorage.getItem(DEBUG_KEY) || '[]'); }
  catch (_) { return []; }
}
export function clearDebugLog() {
  try { sessionStorage.removeItem(DEBUG_KEY); } catch (_) {}
}
// ─────────────────────────────────────────────────────────────────────────────

// Log the actual Firebase project being used on startup
dlog(`FIREBASE PROJECT_ID env = "${import.meta.env.VITE_FIREBASE_PROJECT_ID}"`);
dlog(`FIREBASE AUTH_DOMAIN env = "${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}"`);

export const saveSession = async (uid, { userType, schoolCode, userId }) => {
  dlog(`saveSession uid=${uid} type=${userType} school=${schoolCode}`);
  await setDoc(doc(db, 'sessions', uid), {
    userType, schoolCode, userId,
    updatedAt: new Date().toISOString(),
  });
  dlog('saveSession SUCCESS');
};

export const getSession = async (uid) => {
  dlog(`getSession uid=${uid}`);
  const snap = await getDocFromServer(doc(db, 'sessions', uid));
  dlog(`getSession exists=${snap.exists()} data=${JSON.stringify(snap.exists() ? snap.data() : null)}`);
  return snap.exists() ? snap.data() : null;
};

export const clearSession = async (uid) => {
  try {
    await setDoc(doc(db, 'sessions', uid), {
      userType: USER_TYPES.UNKNOWN, schoolCode: '', userId: '',
    });
  } catch (_) {}
};

export const checkSchoolAndUser = async ({ schoolCode, email, userType }) => {
  const loginType = userType === USER_TYPES.STUDENT ? 'Student' : 'Parent-Teacher';
  const path = `schools/${schoolCode.toUpperCase().trim()}/Login/${loginType}/users`;
  dlog(`checkSchoolAndUser path=${path} email=${email}`);
  const userRef = collection(db, 'schools', schoolCode.toUpperCase().trim(), 'Login', loginType, 'users');
  const q = query(userRef, where('email', '==', email.toLowerCase().trim()));
  const snap = await getDocs(q);
  dlog(`checkSchoolAndUser results=${snap.size}`);
  if (snap.empty) return { success: false, error: 'USER_NOT_FOUND' };
  return { success: true, userData: snap.docs[0].data(), docId: snap.docs[0].id };
};

export const loginUser = async ({ email, password, schoolCode, userType }) => {
  dlog(`loginUser email=${email} school=${schoolCode} type=${userType}`);
  const checkResult = await checkSchoolAndUser({ schoolCode, email, userType });
  if (!checkResult.success) throw new Error(checkResult.error);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  dlog(`loginUser Firebase Auth OK uid=${credential.user.uid}`);
  let resolvedType = userType;
  if (userType === USER_TYPES.TEACHER) {
    resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
  }
  await saveSession(credential.user.uid, {
    userType: resolvedType,
    schoolCode: schoolCode.toUpperCase().trim(),
    userId: checkResult.userData.id || checkResult.docId,
  });
  return { user: credential.user, userType: resolvedType, userData: checkResult.userData };
};

export const registerUser = async ({ email, password, schoolCode, userType }) => {
  dlog(`registerUser email=${email} school=${schoolCode} type=${userType}`);
  const checkResult = await checkSchoolAndUser({ schoolCode, email, userType });
  if (!checkResult.success) throw new Error('USER_NOT_PREREGISTERED');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  dlog(`registerUser Firebase Auth OK uid=${credential.user.uid}`);
  let resolvedType = userType;
  if (userType === USER_TYPES.TEACHER) {
    resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
  }
  await saveSession(credential.user.uid, {
    userType: resolvedType,
    schoolCode: schoolCode.toUpperCase().trim(),
    userId: checkResult.userData.id || checkResult.docId,
  });
  return credential.user;
};

export const loginAdmin = async ({ email, password, schoolCode }) => {
  const code = schoolCode.toUpperCase().trim();
  const emailNorm = email.toLowerCase().trim();
  dlog(`loginAdmin START email=${emailNorm} schoolCode="${code}"`);
  dlog(`loginAdmin Firestore app projectId="${db.app.options.projectId}"`);

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
    dlog(`loginAdmin Firebase Auth OK uid=${credential.user.uid}`);
  } catch (err) {
    dlog(`loginAdmin Firebase Auth FAILED code=${err.code} msg=${err.message}`);
    throw err;
  }

  const uid = credential.user.uid;

  // Try 1: direct UID doc — no cache
  try {
    const directSnap = await getDocFromServer(doc(db, 'schools', code, 'admins', uid));
    dlog(`loginAdmin UID lookup exists=${directSnap.exists()}`);
    if (directSnap.exists()) {
      await saveSession(uid, { userType: USER_TYPES.ADMIN, schoolCode: code, userId: uid });
      dlog('loginAdmin SUCCESS via UID');
      return { user: credential.user, adminData: directSnap.data() };
    }
  } catch (err) {
    dlog(`loginAdmin UID lookup ERROR: ${err.code} — ${err.message}`);
  }

  // Try 2: email query — no cache
  try {
    const adminsRef = collection(db, 'schools', code, 'admins');
    const q = query(adminsRef, where('email', '==', emailNorm));
    const adminSnap = await getDocsFromServer(q);
    dlog(`loginAdmin email query returned ${adminSnap.size} doc(s)`);
    if (!adminSnap.empty) {
      await saveSession(uid, { userType: USER_TYPES.ADMIN, schoolCode: code, userId: uid });
      dlog('loginAdmin SUCCESS via email query');
      return { user: credential.user, adminData: adminSnap.docs[0].data() };
    }
  } catch (err) {
    dlog(`loginAdmin email query ERROR: ${err.code} — ${err.message}`);
    await signOut(auth);
    throw err;
  }

  // Try 3: plain getDoc (cached) as last resort
  try {
    const cachedSnap = await getDoc(doc(db, 'schools', code, 'admins', uid));
    dlog(`loginAdmin cached getDoc exists=${cachedSnap.exists()}`);
    if (cachedSnap.exists()) {
      await saveSession(uid, { userType: USER_TYPES.ADMIN, schoolCode: code, userId: uid });
      dlog('loginAdmin SUCCESS via cached getDoc');
      return { user: credential.user, adminData: cachedSnap.data() };
    }
  } catch (err) {
    dlog(`loginAdmin cached getDoc ERROR: ${err.code} — ${err.message}`);
  }

  dlog(`loginAdmin REJECTED — not found in schools/${code}/admins`);
  await signOut(auth);
  throw new Error('NOT_AN_ADMIN');
};

export const logoutUser = async () => {
  const uid = auth.currentUser?.uid;
  if (uid) await clearSession(uid);
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
