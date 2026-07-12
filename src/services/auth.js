// src/services/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  doc, getDoc, getDocs, collection, query, where, setDoc, limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
export { auth }; // re-exported for AuthContext
import {
  USER_TYPES,
  NO_STUDENT_LOGIN_CLASSES,
  PARENT_PERMISSION_CLASSES,
} from '../utils/constants';

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
  } catch (_) { return null; }
};

export const clearSession = async (uid) => {
  try {
    await setDoc(doc(db, 'sessions', uid), { userType: USER_TYPES.UNKNOWN, userId: '' });
  } catch (_) {}
};

// ─── Student / Teacher / Parent ───────────────────────────────────────────────
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

  // ── Phase 1: Student login gate ───────────────────────────────────────────
  if (userType === USER_TYPES.STUDENT) {
    const sc = checkResult.userData.schoolClass || '';
    if (NO_STUDENT_LOGIN_CLASSES.includes(sc)) throw new Error('TOO_YOUNG');
    if (PARENT_PERMISSION_CLASSES.includes(sc) && !checkResult.userData.allowAppAccess)
      throw new Error('NEEDS_PARENT_PERMISSION');
  }

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')
      throw new Error('NEEDS_REGISTRATION');
    throw err;
  }
  let resolvedType = userType;
  if (userType === USER_TYPES.TEACHER)
    resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
  const docId = checkResult.userData.id || checkResult.docId;
  await saveSession(credential.user.uid, { userType: resolvedType, userId: docId });
  localStorage.setItem('userId', docId);
  return { user: credential.user, userType: resolvedType, userData: checkResult.userData };
};

// Copies the relevant fields from a pre-registration record (Login/{type}/
// users/{docId}) onto the real users/{docId} profile doc. Used by both
// registerUser() (first-time email/password signup) and loginWithGoogle()
// (first-time Google sign-in), since either can be how a pre-registered
// account is "activated" for the first time.
const copyPreRegistrationProfile = async (docId, email, pre) => {
  try {
    const p = { email: email.toLowerCase().trim() };
    if (pre.displayName)            p.displayName            = pre.displayName;
    if (pre.enrollNo)               p.enrollNo               = pre.enrollNo;
    if (pre.mobileNo)               p.mobileNo               = pre.mobileNo;
    if (pre.dob)                    p.dob                    = pre.dob;
    if (pre.bloodGroup)             p.bloodGroup             = pre.bloodGroup;
    if (pre.gender)                 p.gender                 = pre.gender;
    if (pre.schoolClass)            p.schoolClass            = pre.schoolClass;
    if (pre.emergencyContactName)   p.emergencyContactName   = pre.emergencyContactName;
    if (pre.emergencyContactPhone)  p.emergencyContactPhone  = pre.emergencyContactPhone;
    if (pre.subject)                p.subject                = pre.subject;
    if (pre.subjects)                p.subjects              = pre.subjects;
    if (pre.classesTaught)           p.classesTaught         = pre.classesTaught;
    await setDoc(doc(db, 'users', docId), p, { merge: true });
  } catch (_) {}
};

export const registerUser = async ({ email, password, userType }) => {
  const checkResult = await checkSchoolAndUser({ email, userType });
  if (!checkResult.success) throw new Error('USER_NOT_PREREGISTERED');

  // ── Phase 1: Student login gate on registration ───────────────────────────
  if (userType === USER_TYPES.STUDENT) {
    const sc = checkResult.userData.schoolClass || '';
    if (NO_STUDENT_LOGIN_CLASSES.includes(sc)) throw new Error('TOO_YOUNG');
    if (PARENT_PERMISSION_CLASSES.includes(sc) && !checkResult.userData.allowAppAccess)
      throw new Error('NEEDS_PARENT_PERMISSION');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  let resolvedType = userType;
  if (userType === USER_TYPES.TEACHER)
    resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
  const docId = checkResult.userData.id || checkResult.docId;
  await saveSession(credential.user.uid, { userType: resolvedType, userId: docId });
  localStorage.setItem('userId', docId);
  await copyPreRegistrationProfile(docId, email, checkResult.userData);
  return credential.user;
};

// ─── Admin login ──────────────────────────────────────────────────────────────
export const loginAdmin = async ({ email, password }) => {
  let credential;
  try { credential = await signInWithEmailAndPassword(auth, email, password); }
  catch (err) { throw err; }
  const uid = credential.user.uid;
  try {
    const byUid = await getDoc(doc(db, 'admins', uid));
    if (byUid.exists()) {
      await saveSession(uid, { userType: USER_TYPES.ADMIN, userId: uid });
      localStorage.setItem('userId', uid);
      return { user: credential.user };
    }
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
  } catch (_) {
    await signOut(auth);
    throw new Error('FIRESTORE_RULES_BLOCKED');
  }
  await signOut(auth);
  throw new Error('NOT_AN_ADMIN');
};

// ─── Accounts login ───────────────────────────────────────────────────────────
export const loginAccounts = async ({ email, password }) => {
  let credential;
  try { credential = await signInWithEmailAndPassword(auth, email, password); }
  catch (err) { throw err; }
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
  } catch (_) {
    await signOut(auth);
    throw new Error('FIRESTORE_RULES_BLOCKED');
  }
  await signOut(auth);
  throw new Error('NOT_AN_ACCOUNTANT');
};

// ─── Accounts self-registration ───────────────────────────────────────────────
export const registerAccounts = async ({ email, password }) => {
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

// ─── Google Sign-In ─────────────────────────────────────────────────────────
// Uses native Google Sign-In (via @codetrix-studio/capacitor-google-auth,
// not a WebView popup — Google blocks OAuth popups inside embedded WebViews,
// which is what a plain Firebase signInWithPopup() would try to use here).
// The native sign-in returns a Google ID token, which is exchanged for a
// Firebase Auth credential the same way any other Firebase sign-in method
// would be.
//
// IMPORTANT: signing in with Google does NOT bypass this app's closed/
// invite-only model. After Firebase Auth accepts the Google credential, we
// run the exact same pre-registration lookup used by loginUser/loginAdmin/
// loginAccounts (Login/{type}/users, admins, or accountsUsers, matched by
// email). If the signed-in Google account's email isn't pre-registered for
// the selected tab, we sign back out and throw the same errors Login.jsx
// already knows how to display — nothing new to handle there.
let googleAuthInitialized = false;
const ensureGoogleAuthInitialized = () => {
  if (googleAuthInitialized) return;
  GoogleAuth.initialize();
  googleAuthInitialized = true;
};

export const loginWithGoogle = async ({ userType }) => {
  ensureGoogleAuthInitialized();
  const googleUser = await GoogleAuth.signIn();
  const idToken = googleUser?.authentication?.idToken;
  if (!idToken) throw new Error('GOOGLE_SIGNIN_CANCELLED');

  const firebaseCredential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, firebaseCredential);
  const email = (user.email || '').toLowerCase().trim();

  try {
    if (userType === USER_TYPES.ADMIN) {
      const byUid = await getDoc(doc(db, 'admins', user.uid));
      let isAdminUser = byUid.exists();
      if (!isAdminUser) {
        const byEmail = await getDocs(query(
          collection(db, 'admins'), where('email', '==', email), limit(1)
        ));
        isAdminUser = !byEmail.empty;
      }
      if (!isAdminUser) throw new Error('NOT_AN_ADMIN');
      await saveSession(user.uid, { userType: USER_TYPES.ADMIN, userId: user.uid });
      localStorage.setItem('userId', user.uid);
      return { user, userType: USER_TYPES.ADMIN };
    }

    if (userType === USER_TYPES.ACCOUNTS) {
      const byUid = await getDoc(doc(db, 'accountsUsers', user.uid));
      let isAccountsUser = byUid.exists();
      if (!isAccountsUser) {
        const byEmail = await getDocs(query(
          collection(db, 'accountsUsers'), where('email', '==', email), limit(1)
        ));
        isAccountsUser = !byEmail.empty;
      }
      if (!isAccountsUser) throw new Error('NOT_AN_ACCOUNTANT');
      await saveSession(user.uid, { userType: USER_TYPES.ACCOUNTS, userId: user.uid });
      localStorage.setItem('userId', user.uid);
      return { user, userType: USER_TYPES.ACCOUNTS };
    }

    // Student / Teacher / Parent
    const loginType = userType === USER_TYPES.PARENT ? USER_TYPES.TEACHER : userType;
    const checkResult = await checkSchoolAndUser({ email, userType: loginType });
    if (!checkResult.success) throw new Error(checkResult.error);

    if (loginType === USER_TYPES.STUDENT) {
      const sc = checkResult.userData.schoolClass || '';
      if (NO_STUDENT_LOGIN_CLASSES.includes(sc)) throw new Error('TOO_YOUNG');
      if (PARENT_PERMISSION_CLASSES.includes(sc) && !checkResult.userData.allowAppAccess)
        throw new Error('NEEDS_PARENT_PERMISSION');
    }

    let resolvedType = loginType;
    if (loginType === USER_TYPES.TEACHER)
      resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
    const docId = checkResult.userData.id || checkResult.docId;
    await saveSession(user.uid, { userType: resolvedType, userId: docId });
    localStorage.setItem('userId', docId);
    // First-ever sign-in for this account (mirrors registerUser) — harmless
    // no-op merge if the profile doc already exists from a prior sign-in.
    await copyPreRegistrationProfile(docId, email, checkResult.userData);
    return { user, userType: resolvedType, userData: checkResult.userData };
  } catch (err) {
    await signOut(auth);
    throw err;
  }
};
  const uid = auth.currentUser?.uid;
  if (uid) await clearSession(uid);
  await signOut(auth);
  localStorage.removeItem('userId');
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
