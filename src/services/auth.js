// src/services/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDoc, getDocs, collection, query, where, setDoc
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

dlog(`FIREBASE PROJECT_ID = "${import.meta.env.VITE_FIREBASE_PROJECT_ID}"`);

// ── Direct REST check — bypasses the Firestore SDK entirely ──────────────────
// The SDK consistently returns empty on this Capacitor WebView build.
// A plain fetch() to the Firestore REST API is more reliable.
async function checkAdminViaREST(projectId, schoolCode, uid, idToken) {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // Check 1: by UID document path
  const uidUrl = `${base}/schools/${schoolCode}/admins/${uid}`;
  dlog(`REST GET ${uidUrl}`);
  try {
    const res = await fetch(uidUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    dlog(`REST UID status=${res.status}`);
    if (res.ok) {
      const json = await res.json();
      dlog(`REST UID doc found: ${JSON.stringify(Object.keys(json.fields || {}))}`);
      return true;
    }
  } catch (err) {
    dlog(`REST UID fetch error: ${err.message}`);
  }

  // Check 2: query by email field
  const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  dlog(`REST runQuery schools/${schoolCode}/admins by email`);
  try {
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'admins' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'email' },
            op: 'EQUAL',
            value: { stringValue: auth.currentUser?.email?.toLowerCase().trim() },
          },
        },
        limit: 1,
      },
    };
    const res = await fetch(
      `${queryUrl}?parent=projects/${projectId}/databases/(default)/documents/schools/${schoolCode}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    dlog(`REST query status=${res.status}`);
    const json = await res.json();
    dlog(`REST query result=${JSON.stringify(json).slice(0, 200)}`);
    // A successful query with a document returns array with `document` key
    if (Array.isArray(json) && json[0]?.document) {
      dlog('REST query found admin doc');
      return true;
    }
  } catch (err) {
    dlog(`REST query fetch error: ${err.message}`);
  }

  return false;
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
  const snap = await getDoc(doc(db, 'sessions', uid));
  dlog(`getSession exists=${snap.exists()}`);
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
  dlog(`checkSchoolAndUser schools/${schoolCode}/Login/${loginType}/users email=${email}`);
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
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  dlog(`loginAdmin START email=${email} school=${code} project=${projectId}`);

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
    dlog(`loginAdmin Firebase Auth OK uid=${credential.user.uid}`);
  } catch (err) {
    dlog(`loginAdmin Auth FAILED: ${err.code}`);
    throw err;
  }

  const uid = credential.user.uid;

  // Get ID token to authenticate REST calls
  let idToken;
  try {
    idToken = await credential.user.getIdToken();
    dlog(`loginAdmin got idToken (length=${idToken.length})`);
  } catch (err) {
    dlog(`loginAdmin getIdToken FAILED: ${err.message}`);
    await signOut(auth);
    throw err;
  }

  // Use REST API — bypasses Firestore SDK which has issues in this WebView
  const isAdmin = await checkAdminViaREST(projectId, code, uid, idToken);

  if (!isAdmin) {
    dlog('loginAdmin REJECTED');
    await signOut(auth);
    throw new Error('NOT_AN_ADMIN');
  }

  await saveSession(uid, {
    userType: USER_TYPES.ADMIN,
    schoolCode: code,
    userId: uid,
  });

  dlog('loginAdmin SUCCESS');
  return { user: credential.user, adminData: {} };
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
