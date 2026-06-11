// src/services/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDocs, collection, query, where, setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { USER_TYPES } from '../utils/constants';

// ─── Session ──────────────────────────────────────────────────────────────────
export const saveSession = async (uid, { userType, userId }) => {
  await setDoc(doc(db, 'sessions', uid), {
    userType, userId,
    updatedAt: new Date().toISOString(),
  });
};

export const getSession = async (uid) => {
  try {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const user = auth.currentUser;
    if (!user) return null;
    const idToken = await user.getIdToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/sessions/${uid}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
    if (!res.ok) return null;
    const json = await res.json();
    const fields = json.fields || {};
    const type   = fields.userType?.stringValue;
    const userId = fields.userId?.stringValue;
    if (!type || type === USER_TYPES.UNKNOWN) return null;
    return { userType: type, userId: userId || uid };
  } catch (_) {
    return null;
  }
};

export const clearSession = async (uid) => {
  try {
    await setDoc(doc(db, 'sessions', uid), {
      userType: USER_TYPES.UNKNOWN, userId: '',
    });
  } catch (_) {}
};

// ─── Student / Teacher / Parent login ────────────────────────────────────────
const getLoginCollection = (userType) =>
  userType === USER_TYPES.STUDENT ? 'Student' : 'Parent-Teacher';

export const checkSchoolAndUser = async ({ email, userType }) => {
  const loginType = getLoginCollection(userType);
  const q = query(
    collection(db, 'Login', loginType, 'users'),
    where('email', '==', email.toLowerCase().trim())
  );
  const snap = await getDocs(q);
  if (snap.empty) return { success: false, error: 'USER_NOT_FOUND' };
  return { success: true, userData: snap.docs[0].data(), docId: snap.docs[0].id };
};

export const loginUser = async ({ email, password, userType }) => {
  const checkResult = await checkSchoolAndUser({ email, userType });
  if (!checkResult.success) throw new Error(checkResult.error);
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      throw new Error('NEEDS_REGISTRATION');
    }
    throw err;
  }
  let resolvedType = userType;
  if (userType === USER_TYPES.TEACHER) {
    resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
  }
  const docId = checkResult.userData.id || checkResult.docId;
  await saveSession(credential.user.uid, { userType: resolvedType, userId: docId });
  localStorage.setItem('userId', docId);
  return { user: credential.user, userType: resolvedType, userData: checkResult.userData };
};

export const registerUser = async ({ email, password, userType }) => {
  const checkResult = await checkSchoolAndUser({ email, userType });
  if (!checkResult.success) throw new Error('USER_NOT_PREREGISTERED');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  let resolvedType = userType;
  if (userType === USER_TYPES.TEACHER) {
    resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
  }
  const docId = checkResult.userData.id || checkResult.docId;
  await saveSession(credential.user.uid, { userType: resolvedType, userId: docId });
  localStorage.setItem('userId', docId);
  try {
    const pre = checkResult.userData;
    const profileData = { email: email.toLowerCase().trim() };
    if (pre.displayName) profileData.displayName = pre.displayName;
    if (pre.standard)    profileData.standard    = pre.standard;
    if (pre.division)    profileData.division    = pre.division;
    if (pre.enrollNo)    profileData.enrollNo    = pre.enrollNo;
    if (pre.mobileNo)    profileData.mobileNo    = pre.mobileNo;
    if (pre.dob)         profileData.dob         = pre.dob;
    if (pre.bloodGroup)  profileData.bloodGroup  = pre.bloodGroup;
    if (pre.subject)     profileData.subject     = pre.subject;
    await setDoc(doc(db, 'users', docId), profileData, { merge: true });
  } catch (_) {}
  return credential.user;
};

// ─── Admin login ──────────────────────────────────────────────────────────────
export const loginAdmin = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const idToken = await credential.user.getIdToken();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const headers = { Authorization: `Bearer ${idToken}` };

  // Try UID-based doc
  const uidRes = await fetch(`${base}/admins/${uid}`, { headers });
  if (uidRes.ok) {
    await saveSession(uid, { userType: USER_TYPES.ADMIN, userId: uid });
    localStorage.setItem('userId', uid);
    return { user: credential.user };
  }

  // Try email query
  const queryRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'admins' }],
          where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email.toLowerCase().trim() } } },
          limit: 1,
        },
      }),
    }
  );
  const queryJson = await queryRes.json();
  if (Array.isArray(queryJson) && queryJson[0]?.document) {
    await saveSession(uid, { userType: USER_TYPES.ADMIN, userId: uid });
    localStorage.setItem('userId', uid);
    return { user: credential.user };
  }

  await signOut(auth);
  throw new Error('NOT_AN_ADMIN');
};

// ─── Accounts login ───────────────────────────────────────────────────────────
export const loginAccounts = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const idToken = await credential.user.getIdToken();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const headers = { Authorization: `Bearer ${idToken}` };

  const uidRes = await fetch(`${base}/accountsUsers/${uid}`, { headers });
  if (uidRes.ok) {
    await saveSession(uid, { userType: USER_TYPES.ACCOUNTS, userId: uid });
    localStorage.setItem('userId', uid);
    return { user: credential.user };
  }

  const queryRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'accountsUsers' }],
          where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email.toLowerCase().trim() } } },
          limit: 1,
        },
      }),
    }
  );
  const queryJson = await queryRes.json();
  if (Array.isArray(queryJson) && queryJson[0]?.document) {
    await saveSession(uid, { userType: USER_TYPES.ACCOUNTS, userId: uid });
    localStorage.setItem('userId', uid);
    return { user: credential.user };
  }

  await signOut(auth);
  throw new Error('NOT_AN_ACCOUNTANT');
};

export const logoutUser = async () => {
  const uid = auth.currentUser?.uid;
  if (uid) await clearSession(uid);
  await signOut(auth);
  localStorage.removeItem('userId');
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
