// src/services/firestore.js
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

const schoolCode = () => localStorage.getItem('schoolCode') || '';
const userId = () => localStorage.getItem('userId') || '';

// ─── Profile ────────────────────────────────────────────────────────────────
export const getProfile = async (uid, type = 'users') => {
  const snap = await getDoc(doc(db, 'schools', schoolCode(), type, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateProfile = async (uid, data, type = 'users') => {
  await setDoc(doc(db, 'schools', schoolCode(), type, uid), data, { merge: true });
};

// ─── Announcements ──────────────────────────────────────────────────────────
export const getAnnouncements = (standard, division, callback) => {
  let q = query(
    collection(db, 'schools', schoolCode(), 'announcements'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  if (standard && division) {
    q = query(q, where('standard', '==', standard), where('division', '==', division.toUpperCase()));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const createAnnouncement = async (data) => {
  await addDoc(collection(db, 'schools', schoolCode(), 'announcements'), {
    ...data,
    authorId: userId(),
    createdAt: serverTimestamp(),
  });
};

// ─── Assignments ─────────────────────────────────────────────────────────────
export const getAssignments = (callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'assignments'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const uploadAssignment = async (data, file) => {
  let fileUrl = null;
  if (file) {
    const storageRef = ref(storage, `schools/${schoolCode()}/assignments/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
  }
  await addDoc(collection(db, 'schools', schoolCode(), 'assignments'), {
    ...data,
    fileUrl,
    authorId: userId(),
    createdAt: serverTimestamp(),
  });
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const getChats = (chatId, callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const sendMessage = async (chatId, text) => {
  await addDoc(collection(db, 'schools', schoolCode(), 'chats', chatId, 'messages'), {
    text,
    senderId: userId(),
    createdAt: serverTimestamp(),
  });
};

export const getChatUsers = async () => {
  const snap = await getDocs(collection(db, 'schools', schoolCode(), 'Parent-Teacher'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Holidays ─────────────────────────────────────────────────────────────────
export const getHolidays = async (year, month) => {
  const snap = await getDocs(
    query(collection(db, 'schools', schoolCode(), 'holidays'),
      where('year', '==', year), where('month', '==', month))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Timetable ───────────────────────────────────────────────────────────────
export const getTimeTable = async (standard, division) => {
  const snap = await getDoc(
    doc(db, 'schools', schoolCode(), 'timetable', `${standard}${division}`)
  );
  return snap.exists() ? snap.data() : null;
};

// ─── Students/Children ────────────────────────────────────────────────────────
export const getChildren = async (childIds) => {
  if (!childIds || Object.keys(childIds).length === 0) return [];
  const ids = Object.values(childIds);
  const results = await Promise.all(ids.map(id => getDoc(doc(db, 'schools', schoolCode(), 'students', id))));
  return results.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }));
};

// ─── Upload file ──────────────────────────────────────────────────────────────
export const uploadFile = async (file, path) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const adminSchoolCode = () => localStorage.getItem('schoolCode') || '';

// ─── Admin: Get all students ──────────────────────────────────────────────────
export const adminGetStudents = async () => {
  const snap = await getDocs(
    collection(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users')
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Admin: Get all teachers & parents ───────────────────────────────────────
export const adminGetTeachersParents = async () => {
  const snap = await getDocs(
    collection(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users')
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Admin: Create student pre-registration ───────────────────────────────────
export const adminCreateStudent = async (data) => {
  const ref = await addDoc(
    collection(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users'),
    {
      ...data,
      email: data.email.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      createdBy: userId(),
    }
  );
  return ref.id;
};

// ─── Admin: Create teacher/parent pre-registration ────────────────────────────
export const adminCreateTeacherParent = async (data) => {
  const ref = await addDoc(
    collection(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users'),
    {
      ...data,
      email: data.email.toLowerCase().trim(),
      isATeacher: data.isATeacher ?? true,
      createdAt: new Date().toISOString(),
      createdBy: userId(),
    }
  );
  return ref.id;
};

// ─── Admin: Update student ────────────────────────────────────────────────────
export const adminUpdateStudent = async (docId, data) => {
  await updateDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users', docId),
    { ...data, updatedAt: new Date().toISOString() }
  );
};

// ─── Admin: Update teacher/parent ─────────────────────────────────────────────
export const adminUpdateTeacherParent = async (docId, data) => {
  await updateDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users', docId),
    { ...data, updatedAt: new Date().toISOString() }
  );
};

// ─── Admin: Delete student ────────────────────────────────────────────────────
export const adminDeleteStudent = async (docId) => {
  await deleteDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users', docId)
  );
};

// ─── Admin: Delete teacher/parent ─────────────────────────────────────────────
export const adminDeleteTeacherParent = async (docId) => {
  await deleteDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users', docId)
  );
};

// ─── Admin: Get school stats ──────────────────────────────────────────────────
export const adminGetStats = async () => {
  const [studentsSnap, teachersSnap] = await Promise.all([
    getDocs(collection(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users')),
    getDocs(collection(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users')),
  ]);
  const teachers = teachersSnap.docs.map(d => d.data());
  return {
    totalStudents: studentsSnap.size,
    totalTeachers: teachers.filter(t => t.isATeacher).length,
    totalParents: teachers.filter(t => !t.isATeacher).length,
  };
};
