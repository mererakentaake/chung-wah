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

export const saveSession = async (uid, { userType, schoolCode, userId }) => {
  await setDoc(doc(db, 'sessions', uid), {
    userType, schoolCode, userId,
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
    const type = fields.userType?.stringValue;
    const code = fields.schoolCode?.stringValue;
    const userId = fields.userId?.stringValue;
    if (!type || type === USER_TYPES.UNKNOWN) return null;
    return { userType: type, schoolCode: code || '', userId: userId || uid };
  } catch (_) {
    return null;
  }
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
  const userRef = collection(db, 'schools', schoolCode.toUpperCase().trim(), 'Login', loginType, 'users');
  const q = query(userRef, where('email', '==', email.toLowerCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return { success: false, error: 'USER_NOT_FOUND' };
  return { success: true, userData: snap.docs[0].data(), docId: snap.docs[0].id };
};

export const loginUser = async ({ email, password, schoolCode, userType }) => {
  const checkResult = await checkSchoolAndUser({ schoolCode, email, userType });
  if (!checkResult.success) throw new Error(checkResult.error);
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    // Pre-registration record exists but Firebase Auth account has not been created yet.
    // The user must tap "Register" (not "Sign In") on their first login to set a password.
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      throw new Error('NEEDS_REGISTRATION');
    }
    throw err;
  }
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
  const checkResult = await checkSchoolAndUser({ schoolCode, email, userType });
  if (!checkResult.success) throw new Error('USER_NOT_PREREGISTERED');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  let resolvedType = userType;
  if (userType === USER_TYPES.TEACHER) {
    resolvedType = checkResult.userData.isATeacher ? USER_TYPES.TEACHER : USER_TYPES.PARENT;
  }
  const code = schoolCode.toUpperCase().trim();
  const docId = checkResult.userData.id || checkResult.docId;
  await saveSession(credential.user.uid, {
    userType: resolvedType,
    schoolCode: code,
    userId: docId,
  });

  // Auto-seed the user's profile from their pre-registration data so their
  // name, class, and other details appear immediately without manual entry.
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
    if (pre.childName)   profileData.childName   = pre.childName;
    if (pre.childClass)  profileData.childClass  = pre.childClass;
    await setDoc(doc(db, 'schools', code, 'users', docId), profileData, { merge: true });
  } catch (_) {
    // Don't fail the registration if profile seeding fails
  }

  return credential.user;
};

export const loginAdmin = async ({ email, password, schoolCode }) => {
  const code = schoolCode.toUpperCase().trim();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const idToken = await credential.user.getIdToken();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const headers = { Authorization: `Bearer ${idToken}` };

  // Try UID lookup
  const uidRes = await fetch(`${base}/schools/${code}/admins/${uid}`, { headers });
  if (uidRes.ok) {
    await saveSession(uid, { userType: USER_TYPES.ADMIN, schoolCode: code, userId: uid });
    return { user: credential.user, adminData: {} };
  }

  // Try email query
  const queryRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?parent=projects/${projectId}/databases/(default)/documents/schools/${code}`,
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
    await saveSession(uid, { userType: USER_TYPES.ADMIN, schoolCode: code, userId: uid });
    return { user: credential.user, adminData: {} };
  }

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
