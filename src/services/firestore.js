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

export const updateProfilePhoto = async (uid, photoUrl) => {
  await setDoc(doc(db, 'schools', schoolCode(), 'users', uid), { photoUrl }, { merge: true });
};

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

export const respondToGuardianRequest = async (requestId, accepted, parentDocId) => {
  const status = accepted ? 'confirmed' : 'rejected';
  await updateDoc(
    doc(db, 'schools', schoolCode(), 'guardianRequests', requestId),
    { status, respondedAt: serverTimestamp() }
  );
  if (accepted) {
    await setDoc(
      doc(db, 'schools', schoolCode(), 'users', userId()),
      { [`guardians.${parentDocId}`]: 'confirmed' },
      { merge: true }
    );
  }
};

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

// ─── Attendance ───────────────────────────────────────────────────────────────
// Teacher submits a full class roll-call for a given date
export const submitAttendance = async ({ date, standard, division, subject, records }) => {
  // records: [{ studentId, studentName, status, note?, checkInTime?, checkOutTime?, minutesLate? }]
  const docId = `${date}_${standard}${division}`;
  await setDoc(doc(db, 'schools', schoolCode(), 'attendance', docId), {
    date,
    standard,
    division,
    subject: subject || '',
    records,
    teacherId: userId(),
    submittedAt: serverTimestamp(),
  }, { merge: true });
  // Also write individual student attendance docs for easy querying
  await Promise.all(records.map(r =>
    setDoc(
      doc(db, 'schools', schoolCode(), 'studentAttendance', `${date}_${r.studentId}`),
      {
        date,
        studentId: r.studentId,
        studentName: r.studentName,
        status: r.status,
        note: r.note || '',
        checkInTime: r.checkInTime || '',
        checkOutTime: r.checkOutTime || '',
        minutesLate: r.minutesLate || 0,
        standard,
        division,
        subject: subject || '',
        teacherId: userId(),
        submittedAt: serverTimestamp(),
      },
      { merge: true }
    )
  ));
};

// Get attendance records for a class on a given date
export const getClassAttendance = async (date, standard, division) => {
  const docId = `${date}_${standard}${division}`;
  const snap = await getDoc(doc(db, 'schools', schoolCode(), 'attendance', docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Live listener for a student's own attendance
export const getStudentAttendance = (studentId, callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'studentAttendance'),
    where('studentId', '==', studentId),
    orderBy('date', 'desc'),
    limit(60)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// Get recent attendance records submitted by a teacher
export const getTeacherAttendanceHistory = (callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'attendance'),
    where('teacherId', '==', userId()),
    orderBy('submittedAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Fees (Accounts manages, Students/Parents read) ──────────────────────────
// Accounts creates/updates a fee record for a student
export const upsertStudentFee = async (studentId, feeData) => {
  const docId = `${feeData.term}_${studentId}`.replace(/\s+/g, '_');
  await setDoc(
    doc(db, 'schools', schoolCode(), 'fees', docId),
    {
      ...feeData,
      studentId,
      updatedAt: serverTimestamp(),
      updatedBy: userId(),
    },
    { merge: true }
  );
};

// Record a payment against an existing fee doc
export const recordPayment = async (feeDocId, paymentData) => {
  const feeRef = doc(db, 'schools', schoolCode(), 'fees', feeDocId);
  const snap = await getDoc(feeRef);
  if (!snap.exists()) throw new Error('Fee record not found');
  const existing = snap.data();
  const payments = existing.payments || [];
  payments.push({ ...paymentData, recordedAt: new Date().toISOString(), recordedBy: userId() });
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = (existing.amount || 0) - totalPaid;
  const status = balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : existing.status;
  await updateDoc(feeRef, { payments, totalPaid, balance, status, updatedAt: serverTimestamp() });
};

// Student or Parent reads their own fee records
export const getStudentFees = (studentId, callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'fees'),
    where('studentId', '==', studentId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// Accounts reads all fees
export const getAllFees = (callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'fees'),
    orderBy('updatedAt', 'desc'),
    limit(200)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Expenses ────────────────────────────────────────────────────────────────
export const addExpense = async (data) => {
  await addDoc(collection(db, 'schools', schoolCode(), 'expenses'), {
    ...data,
    recordedBy: userId(),
    createdAt: serverTimestamp(),
  });
};

export const getExpenses = (callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'expenses'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Financial Reports (Accounts generates, Admin reads) ─────────────────────
export const saveFinancialReport = async (reportData) => {
  await addDoc(collection(db, 'schools', schoolCode(), 'financialReports'), {
    ...reportData,
    generatedBy: userId(),
    generatedAt: serverTimestamp(),
  });
};

export const getFinancialReports = (callback) => {
  const q = query(
    collection(db, 'schools', schoolCode(), 'financialReports'),
    orderBy('generatedAt', 'desc'),
    limit(20)
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

const adminCreateGuardianRequests = async (parentDocId, parentName, parentTitle, relationshipType, children) => {
  await Promise.all(
    children.map(child =>
      addDoc(collection(db, 'schools', adminSchoolCode(), 'guardianRequests'), {
        parentDocId,
        parentName,
        parentTitle,
        relationshipType,
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

export const adminGetLinkedParent = async (studentId) => {
  const all = await adminGetTeachersParents();
  return all.find(p =>
    !p.isATeacher &&
    p.children?.some(c => c.studentId === studentId && c.status === 'confirmed')
  ) || null;
};

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
