// src/services/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDoc, getDocs, collection, query, where, setDoc, limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
export { auth }; // re-export for AuthContext to use
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
export const checkSchoolAndUser = async ({ email, userType }) => {
  const loginType = userType === USER_TYPES.STUDENT ? 'Student' : 'Parent-Teacher';
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

// ─── Admin login — uses Firestore SDK directly (no REST API) ─────────────────
export const loginAdmin = async ({ email, password }) => {
  // Sign in first so we have an authenticated context for Firestore reads
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw err;
  }
  const uid = credential.user.uid;

  try {
    // 1. Check by Firebase Auth UID (document ID = UID)
    const byUid = await getDoc(doc(db, 'admins', uid));
    if (byUid.exists()) {
      await saveSession(uid, { userType: USER_TYPES.ADMIN, userId: uid });
      localStorage.setItem('userId', uid);
      return { user: credential.user };
    }

    // 2. Check by email field (document ID = auto-generated)
    const byEmail = await getDocs(query(
      collection(db, 'admins'),
      where('email', '==', email.toLowerCase().trim()),
      limit(1)
    ));
    if (!byEmail.empty) {
      await saveSession(uid, { userType: USER_TYPES.ADMIN, userId: uid });
      localStorage.setItem('userId', uid);
      return { user: credential.user };
    }
  } catch (firestoreErr) {
    // Firestore read failed — likely security rules. Sign out and report.
    await signOut(auth);
    throw new Error('FIRESTORE_RULES_BLOCKED');
  }

  await signOut(auth);
  throw new Error('NOT_AN_ADMIN');
};

// ─── Accounts login — uses Firestore SDK directly ────────────────────────────
export const loginAccounts = async ({ email, password }) => {
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw err;
  }
  const uid = credential.user.uid;

  try {
    const byUid = await getDoc(doc(db, 'accountsUsers', uid));
    if (byUid.exists()) {
      await saveSession(uid, { userType: USER_TYPES.ACCOUNTS, userId: uid });
      localStorage.setItem('userId', uid);
      return { user: credential.user };
    }

    const byEmail = await getDocs(query(
      collection(db, 'accountsUsers'),
      where('email', '==', email.toLowerCase().trim()),
      limit(1)
    ));
    if (!byEmail.empty) {
      await saveSession(uid, { userType: USER_TYPES.ACCOUNTS, userId: uid });
      localStorage.setItem('userId', uid);
      return { user: credential.user };
    }
  } catch (firestoreErr) {
    await signOut(auth);
    throw new Error('FIRESTORE_RULES_BLOCKED');
  }

  await signOut(auth);
  throw new Error('NOT_AN_ACCOUNTANT');
};


// ─── Accounts register (first-time activation) ───────────────────────────────
export const registerAccounts = async ({ email, password }) => {
  // Check pre-registration
  const snap = await getDocs(query(
    collection(db, 'accountsUsers'),
    where('email', '==', email.toLowerCase().trim()),
    limit(1)
  ));
  if (snap.empty) throw new Error('USER_NOT_PREREGISTERED');

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  await saveSession(uid, { userType: USER_TYPES.ACCOUNTS, userId: uid });
  localStorage.setItem('userId', uid);
  return credential.user;
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
