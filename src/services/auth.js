// src/services/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDocFromServer, getDocsFromServer, getDocs,
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

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
    dlog(`loginAdmin Firebase Auth OK uid=${credential.user.uid}`);
  } catch (err) {
    dlog(`loginAdmin Firebase Auth FAILED code=${err.code} msg=${err.message}`);
    throw err;
  }

  const uid = credential.user.uid;

  // First try: direct UID doc lookup from server (fastest)
  try {
    dlog(`loginAdmin trying direct UID lookup: schools/${code}/admins/${uid}`);
    const directSnap = await getDocFromServer(doc(db, 'schools', code, 'admins', uid));
    dlog(`loginAdmin direct lookup exists=${directSnap.exists()}`);
    if (directSnap.exists()) {
      await saveSession(uid, { userType: USER_TYPES.ADMIN, schoolCode: code, userId: uid });
      dlog('loginAdmin SUCCESS via UID lookup');
      return { user: credential.user, adminData: directSnap.data() };
    }
  } catch (err) {
    dlog(`loginAdmin direct UID lookup error: ${err.message}`);
  }

  // Second try: query by email — forces server read, bypasses local cache
  try {
    dlog(`loginAdmin trying email query from server: schools/${code}/admins where email==${emailNorm}`);
    const adminsRef = collection(db, 'schools', code, 'admins');
    const q = query(adminsRef, where('email', '==', emailNorm));
    const adminSnap = await getDocsFromServer(q);
    dlog(`loginAdmin email query returned ${adminSnap.size} doc(s)`);

    if (!adminSnap.empty) {
      dlog(`loginAdmin admin doc data: ${JSON.stringify(adminSnap.docs[0].data())}`);
      await saveSession(uid, { userType: USER_TYPES.ADMIN, schoolCode: code, userId: uid });
      dlog('loginAdmin SUCCESS via email query');
      return { user: credential.user, adminData: adminSnap.docs[0].data() };
    }
  } catch (err) {
    dlog(`loginAdmin email query error: ${err.code} — ${err.message}`);
    await signOut(auth);
    throw err;
  }

  dlog(`loginAdmin REJECTED — not found by UID or email in schools/${code}/admins`);
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
