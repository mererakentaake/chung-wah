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

// Profile is read-only from the user side — admin data is the source of truth.
// Only photoUrl is user-editable.
export const updateProfilePhoto = async (uid, photoUrl) => {
  await setDoc(doc(db, 'schools', schoolCode(), 'users', uid), { photoUrl }, { merge: true });
};

// Keep for internal seeding use (auth.js registerUser)
export const updateProfile = async (uid, data, type = 'users') => {
  await setDoc(doc(db, 'schools', schoolCode(), type, uid), data, { merge: true });
};

// ─── Profile Correction Requests ────────────────────────────────────────────
export const requestProfileCorrection = async (message) => {
  await addDoc(collection(db, 'schools', schoolCode(), 'profileCorrections'), {
    userId: userId(),
    message: message.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

// ─── Guardian / Parent Requests ─────────────────────────────────────────────
// Listener: student sees pending requests to confirm
export const getGuardianRequests = (studentDocId, callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'guardianRequests'),
    where('studentDocId', '==', studentDocId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// Student accepts or rejects a guardian request
export const respondToGuardianRequest = async (requestId, accepted, parentDocId) => {
  const status = accepted ? 'confirmed' : 'rejected';
  await updateDoc(
    doc(db, 'schools', schoolCode(), 'guardianRequests', requestId),
    { status, respondedAt: serverTimestamp() }
  );
  if (accepted) {
    // Mark in student's profile that this guardian is confirmed
    await setDoc(
      doc(db, 'schools', schoolCode(), 'users', userId()),
      { [`guardians.${parentDocId}`]: 'confirmed' },
      { merge: true }
    );
  }
};

// Get all guardian request docs for a parent (to show pending/confirmed in Children panel)
export const getParentGuardianLinks = (parentDocId, callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'guardianRequests'),
    where('parentDocId', '==', parentDocId)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
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

// ─── Student Reports (teacher writes) ────────────────────────────────────────
export const createStudentReport = async (data) => {
  await addDoc(collection(db, 'schools', schoolCode(), 'studentReports'), {
    ...data,
    teacherId: userId(),
    createdAt: serverTimestamp(),
  });
};

export const getStudentReportsByTeacher = (callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'studentReports'),
    where('teacherId', '==', userId()),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getStudentReports = (studentId, callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'studentReports'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
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

// ─── Students / Children (parent panel) ──────────────────────────────────────
export const getChildren = async (childIds) => {
  if (!childIds || Object.keys(childIds).length === 0) return [];
  const ids = Object.values(childIds);
  const results = await Promise.all(ids.map(id => getDoc(doc(db, 'schools', schoolCode(), 'users', id))));
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

export const adminGetStudents = async () => {
  const snap = await getDocs(
    collection(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users')
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const adminGetTeachersParents = async () => {
  const snap = await getDocs(
    collection(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users')
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

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

// Creates a guardian request for each child linked to the parent/guardian
const adminCreateGuardianRequests = async (parentDocId, parentName, parentTitle, relationshipType, children) => {
  await Promise.all(
    children.map(child =>
      addDoc(collection(db, 'schools', adminSchoolCode(), 'guardianRequests'), {
        parentDocId,
        parentName,
        parentTitle,         // 'Mr' | 'Mrs' | 'Miss'
        relationshipType,    // 'Parent' | 'Guardian'
        studentDocId: child.studentId,
        studentName: child.studentName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    )
  );
};

export const adminCreateTeacherParent = async (data) => {
  const { children = [], ...rest } = data;
  const docRef = await addDoc(
    collection(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users'),
    {
      ...rest,
      email: rest.email.toLowerCase().trim(),
      isATeacher: rest.isATeacher ?? true,
      children: children.map(c => ({ ...c, status: 'pending' })),
      createdAt: new Date().toISOString(),
      createdBy: userId(),
    }
  );
  // Create pending guardian request docs for each child (so student sees notification)
  if (!rest.isATeacher && children.length > 0) {
    await adminCreateGuardianRequests(
      docRef.id,
      rest.displayName,
      rest.title || '',
      rest.relationshipType || 'Parent',
      children
    );
  }
  return docRef.id;
};

export const adminUpdateStudent = async (docId, data) => {
  await updateDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users', docId),
    { ...data, updatedAt: new Date().toISOString() }
  );
};

export const adminUpdateTeacherParent = async (docId, data) => {
  await updateDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users', docId),
    { ...data, updatedAt: new Date().toISOString() }
  );
};

export const adminDeleteStudent = async (docId) => {
  await deleteDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Student', 'users', docId)
  );
};

export const adminDeleteTeacherParent = async (docId) => {
  await deleteDoc(
    doc(db, 'schools', adminSchoolCode(), 'Login', 'Parent-Teacher', 'users', docId)
  );
};

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

// ─── Teacher: Link a guardian to a student ────────────────────────────────────
export const teacherLinkGuardian = async ({ parentDocId, parentName, parentTitle, relationshipType, studentDocId, studentName }) => {
  // Check if a pending/confirmed request already exists
  const existing = await getDocs(query(
    collection(db, 'schools', schoolCode(), 'guardianRequests'),
    where('parentDocId', '==', parentDocId),
    where('studentDocId', '==', studentDocId)
  ));
  if (!existing.empty) throw new Error('A link request already exists for this pair.');
  await addDoc(collection(db, 'schools', schoolCode(), 'guardianRequests'), {
    parentDocId,
    parentName,
    parentTitle,
    relationshipType,
    studentDocId,
    studentName,
    status: 'pending',
    createdBy: userId(),
    createdByRole: 'teacher',
    createdAt: new Date().toISOString(),
  });
};

// ─── Admin: Get the confirmed parent/guardian linked to a student ─────────────
export const adminGetLinkedParent = async (studentId) => {
  const all = await adminGetTeachersParents();
  return all.find(p =>
    !p.isATeacher &&
    p.children?.some(c => c.studentId === studentId && c.status === 'confirmed')
  ) || null;
};

// ─── Admin: Get next enrolment number ────────────────────────────────────────
export const adminGetNextEnrolNo = async () => {
  const students = await adminGetStudents();
  let max = 0;
  students.forEach(s => {
    if (s.enrollNo && /^CHW\d{4}$/.test(s.enrollNo)) {
      const n = parseInt(s.enrollNo.slice(3), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return `CHW${String(max + 1).padStart(4, '0')}`;
};
