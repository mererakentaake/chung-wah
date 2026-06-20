// src/services/firestore.js
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// No school prefix — this app is for Chung Wah School only.
const userId = () => localStorage.getItem('userId') || '';

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateProfilePhoto = async (uid, photoUrl) => {
  await setDoc(doc(db, 'users', uid), { photoUrl }, { merge: true });
};

export const updateProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

// ─── Profile Correction Requests ─────────────────────────────────────────────
export const requestProfileCorrection = async (message) => {
  await addDoc(collection(db, 'profileCorrections'), {
    userId: userId(),
    message: message.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

// ─── Guardian / Parent Requests ──────────────────────────────────────────────
export const getGuardianRequests = (studentDocId, callback) => {
  const q = query(
    collection(db, 'guardianRequests'),
    where('studentDocId', '==', studentDocId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const respondToGuardianRequest = async (requestId, accepted, parentDocId) => {
  const status = accepted ? 'confirmed' : 'rejected';
  await updateDoc(doc(db, 'guardianRequests', requestId), {
    status, respondedAt: serverTimestamp(),
  });
  if (accepted) {
    await setDoc(doc(db, 'users', userId()),
      { [`guardians.${parentDocId}`]: 'confirmed' }, { merge: true });
  }
};

export const getParentGuardianLinks = (parentDocId, callback) => {
  const q = query(
    collection(db, 'guardianRequests'),
    where('parentDocId', '==', parentDocId)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Announcements ───────────────────────────────────────────────────────────
// announcements/{id}: title, body, imageUrl, scope('class'|'school'),
//   schoolClass (only if scope==='class'), type, authorId, authorName, createdAt

// Get announcements visible to a given class (school-wide + that class's own posts)
export const getAnnouncementsForClass = (schoolClass, callback) => {
  const q = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const visible = all.filter(a => a.scope === 'school' || a.schoolClass === schoolClass);
    callback(visible);
  });
};

// Get all announcements a teacher has posted
export const getAnnouncementsByTeacher = (teacherId, callback) => {
  const q = query(
    collection(db, 'announcements'),
    where('authorId', '==', teacherId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// Get every announcement (admin view)
export const getAllAnnouncements = (callback) => {
  const q = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const createAnnouncement = async (data) => {
  await addDoc(collection(db, 'announcements'), {
    ...data,
    authorId: userId(),
    createdAt: serverTimestamp(),
  });
};

export const deleteAnnouncement = async (announcementId) => {
  await deleteDoc(doc(db, 'announcements', announcementId));
};

// ─── Appointed Announcer toggle (admin grants school-wide posting rights) ─────
export const setTeacherAnnouncerStatus = async (teacherDocId, isAppointed) => {
  await updateDoc(doc(db, 'Login', 'Parent-Teacher', 'users', teacherDocId), {
    isAppointedAnnouncer: isAppointed,
  });
};

// ─── Assignments ──────────────────────────────────────────────────────────────
export const getAssignments = (callback) => {
  const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const uploadAssignment = async (data, file) => {
  let fileUrl = null;
  if (file) {
    const storageRef = ref(storage, `assignments/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
  }
  await addDoc(collection(db, 'assignments'), {
    ...data, fileUrl, authorId: userId(), createdAt: serverTimestamp(),
  });
};

// ─── Student Reports ──────────────────────────────────────────────────────────
export const createStudentReport = async (data) => {
  await addDoc(collection(db, 'studentReports'), {
    ...data, teacherId: userId(), createdAt: serverTimestamp(),
  });
};

export const getStudentReportsByTeacher = (callback) => {
  const q = query(
    collection(db, 'studentReports'),
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
    collection(db, 'studentReports'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const submitAttendance = async ({ date, standard, division, subject, records }) => {
  const docId = `${date}_${standard}${division}`;
  await setDoc(doc(db, 'attendance', docId), {
    date, standard, division, subject: subject || '',
    records, teacherId: userId(), submittedAt: serverTimestamp(),
  }, { merge: true });
  await Promise.all(records.map(r =>
    setDoc(doc(db, 'studentAttendance', `${date}_${r.studentId}`), {
      date, studentId: r.studentId, studentName: r.studentName,
      status: r.status, note: r.note || '',
      standard, division, subject: subject || '',
      teacherId: userId(), submittedAt: serverTimestamp(),
    }, { merge: true })
  ));
};

export const getClassAttendance = async (date, standard, division) => {
  const snap = await getDoc(doc(db, 'attendance', `${date}_${standard}${division}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getStudentAttendance = (studentId, callback) => {
  const q = query(
    collection(db, 'studentAttendance'),
    where('studentId', '==', studentId),
    orderBy('date', 'desc'),
    limit(60)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getTeacherAttendanceHistory = (callback) => {
  const q = query(
    collection(db, 'attendance'),
    where('teacherId', '==', userId()),
    orderBy('submittedAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Fees ─────────────────────────────────────────────────────────────────────
export const upsertStudentFee = async (studentId, feeData) => {
  const docId = `${feeData.term}_${studentId}`.replace(/\s+/g, '_');
  await setDoc(doc(db, 'fees', docId), {
    ...feeData, studentId,
    updatedAt: serverTimestamp(), updatedBy: userId(),
  }, { merge: true });
};

export const recordPayment = async (feeDocId, paymentData) => {
  const feeRef = doc(db, 'fees', feeDocId);
  const snap = await getDoc(feeRef);
  if (!snap.exists()) throw new Error('Fee record not found');
  const existing = snap.data();
  const payments = [...(existing.payments || []),
    { ...paymentData, recordedAt: new Date().toISOString(), recordedBy: userId() }];
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = (existing.amount || 0) - totalPaid;
  const status = balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : existing.status;
  await updateDoc(feeRef, { payments, totalPaid, balance, status, updatedAt: serverTimestamp() });
};

export const getStudentFees = (studentId, callback) => {
  const q = query(
    collection(db, 'fees'),
    where('studentId', '==', studentId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getAllFees = (callback) => {
  const q = query(collection(db, 'fees'), orderBy('updatedAt', 'desc'), limit(200));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const addExpense = async (data) => {
  await addDoc(collection(db, 'expenses'), {
    ...data, recordedBy: userId(), createdAt: serverTimestamp(),
  });
};

export const getExpenses = (callback) => {
  const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Financial Reports ────────────────────────────────────────────────────────
export const saveFinancialReport = async (reportData) => {
  await addDoc(collection(db, 'financialReports'), {
    ...reportData, generatedBy: userId(), generatedAt: serverTimestamp(),
  });
};

export const getFinancialReports = (callback) => {
  const q = query(collection(db, 'financialReports'), orderBy('generatedAt', 'desc'), limit(20));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const getChats = (chatId, callback) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const sendMessage = async (chatId, text) => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text, senderId: userId(), createdAt: serverTimestamp(),
  });
};

// ─── Holidays ─────────────────────────────────────────────────────────────────
export const getHolidays = async (year, month) => {
  const snap = await getDocs(query(
    collection(db, 'holidays'),
    where('year', '==', year), where('month', '==', month)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Timetable ────────────────────────────────────────────────────────────────
export const getTimeTable = async (standard, division) => {
  const snap = await getDoc(doc(db, 'timetable', `${standard}${division}`));
  return snap.exists() ? snap.data() : null;
};

// ─── Children (parent panel) ──────────────────────────────────────────────────
export const getChildren = async (childIds) => {
  if (!childIds || Object.keys(childIds).length === 0) return [];
  const results = await Promise.all(
    Object.values(childIds).map(id => getDoc(doc(db, 'users', id)))
  );
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

export const adminGetStudents = async () => {
  const snap = await getDocs(collection(db, 'Login', 'Student', 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const adminGetTeachersParents = async () => {
  const snap = await getDocs(collection(db, 'Login', 'Parent-Teacher', 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const adminCreateStudent = async (data) => {
  const ref = await addDoc(collection(db, 'Login', 'Student', 'users'), {
    ...data,
    email: data.email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
    createdBy: userId(),
  });
  return ref.id;
};

export const adminCreateTeacherParent = async (data) => {
  const { children = [], ...rest } = data;
  const docRef = await addDoc(collection(db, 'Login', 'Parent-Teacher', 'users'), {
    ...rest,
    email: rest.email.toLowerCase().trim(),
    isATeacher: rest.isATeacher ?? true,
    children: children.map(c => ({ ...c, status: 'pending' })),
    createdAt: new Date().toISOString(),
    createdBy: userId(),
  });
  if (!rest.isATeacher && children.length > 0) {
    await Promise.all(children.map(child =>
      addDoc(collection(db, 'guardianRequests'), {
        parentDocId: docRef.id,
        parentName: rest.displayName,
        parentTitle: rest.title || '',
        relationshipType: rest.relationshipType || 'Parent',
        studentDocId: child.studentId,
        studentName: child.studentName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    ));
  }
  return docRef.id;
};

export const adminUpdateStudent = async (docId, data) => {
  await updateDoc(doc(db, 'Login', 'Student', 'users', docId), {
    ...data, updatedAt: new Date().toISOString(),
  });
};

export const adminUpdateTeacherParent = async (docId, data) => {
  await updateDoc(doc(db, 'Login', 'Parent-Teacher', 'users', docId), {
    ...data, updatedAt: new Date().toISOString(),
  });
};

export const adminDeleteStudent = async (docId) => {
  await deleteDoc(doc(db, 'Login', 'Student', 'users', docId));
};

export const adminDeleteTeacherParent = async (docId) => {
  await deleteDoc(doc(db, 'Login', 'Parent-Teacher', 'users', docId));
};

export const adminGetStats = async () => {
  const [studentsSnap, teachersSnap] = await Promise.all([
    getDocs(collection(db, 'Login', 'Student', 'users')),
    getDocs(collection(db, 'Login', 'Parent-Teacher', 'users')),
  ]);
  const teachers = teachersSnap.docs.map(d => d.data());
  return {
    totalStudents: studentsSnap.size,
    totalTeachers: teachers.filter(t => t.isATeacher).length,
    totalParents: teachers.filter(t => !t.isATeacher).length,
  };
};

export const teacherLinkGuardian = async ({ parentDocId, parentName, parentTitle, relationshipType, studentDocId, studentName }) => {
  const existing = await getDocs(query(
    collection(db, 'guardianRequests'),
    where('parentDocId', '==', parentDocId),
    where('studentDocId', '==', studentDocId)
  ));
  if (!existing.empty) throw new Error('A link request already exists for this pair.');
  await addDoc(collection(db, 'guardianRequests'), {
    parentDocId, parentName, parentTitle, relationshipType,
    studentDocId, studentName, status: 'pending',
    createdBy: userId(), createdByRole: 'teacher',
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


// ─── Accounts Users (admin/teacher creates, accounts staff registers) ─────────
export const adminCreateAccountsUser = async (data) => {
  const ref = await addDoc(collection(db, 'accountsUsers'), {
    ...data,
    email: data.email.toLowerCase().trim(),
    role: 'accounts',
    createdAt: new Date().toISOString(),
    createdBy: userId(),
  });
  return ref.id;
};

export const adminGetAccountsUsers = async () => {
  const snap = await getDocs(collection(db, 'accountsUsers'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const adminUpdateAccountsUser = async (docId, data) => {
  await updateDoc(doc(db, 'accountsUsers', docId), {
    ...data, updatedAt: new Date().toISOString(),
  });
};

export const adminDeleteAccountsUser = async (docId) => {
  await deleteDoc(doc(db, 'accountsUsers', docId));
};

export const checkAccountsUser = async (email) => {
  const q = query(
    collection(db, 'accountsUsers'),
    where('email', '==', email.toLowerCase().trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};


// ─── Student App Access Toggle (parent enables for Grade 6) ──────────────────
export const toggleStudentAppAccess = async (studentDocId, allow) => {
  await updateDoc(doc(db, 'Login', 'Student', 'users', studentDocId), {
    allowAppAccess: allow,
    appAccessUpdatedAt: serverTimestamp(),
  });
};

// ─── Chat Users ───────────────────────────────────────────────────────────────
export const getChatUsers = async () => {
  const snap = await getDocs(collection(db, 'Login', 'Parent-Teacher', 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// SYLLABUS
// ═══════════════════════════════════════════════════════════════════════════════
// Structure: syllabuses/{id}
//   schoolClass, subject, description, schoolYear,
//   topics: [{ id, title, description, outcomes[], dueDate, isCompleted, completedDate, order }]
//   createdBy, createdAt, updatedAt

export const saveSyllabus = async (data, existingId = null) => {
  if (existingId) {
    await updateDoc(doc(db, 'syllabuses', existingId), {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId(),
    });
    return existingId;
  }
  const ref = await addDoc(collection(db, 'syllabuses'), {
    ...data,
    createdBy: userId(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getSyllabusesByClass = (schoolClass, callback) => {
  const q = query(
    collection(db, 'syllabuses'),
    where('schoolClass', '==', schoolClass),
    orderBy('subject', 'asc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getAllSyllabuses = (callback) => {
  const q = query(collection(db, 'syllabuses'), orderBy('schoolClass', 'asc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getSyllabusByTeacher = (teacherId, callback) => {
  const q = query(
    collection(db, 'syllabuses'),
    where('createdBy', '==', teacherId),
    orderBy('schoolClass', 'asc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const deleteSyllabus = async (syllabusId) => {
  await deleteDoc(doc(db, 'syllabuses', syllabusId));
};

// Mark a topic complete/incomplete and create a syllabus notification
export const markTopicComplete = async (syllabusId, topics, topicId, isCompleted, schoolClass, subject) => {
  const today = new Date().toISOString().slice(0, 10);
  const updatedTopics = topics.map(t => {
    if (t.id !== topicId) return t;
    return { ...t, isCompleted, completedDate: isCompleted ? today : null };
  });

  await updateDoc(doc(db, 'syllabuses', syllabusId), {
    topics: updatedTopics,
    updatedAt: serverTimestamp(),
    updatedBy: userId(),
  });

  // Create in-app notification for parents of students in this class
  const topic = topics.find(t => t.id === topicId);
  if (!topic) return;

  const dueDate = topic.dueDate || null;
  let notifType = 'topic_complete';
  if (isCompleted && dueDate && today < dueDate) notifType = 'topic_ahead';
  if (!isCompleted) return; // only notify on completion

  const nextTopic = updatedTopics.find(t => !t.isCompleted && t.order > (topic.order || 0));
  const message = notifType === 'topic_ahead'
    ? `"${topic.title}" in ${subject} was completed ahead of schedule. Moving to "${nextTopic?.title || 'next topic'}".`
    : `"${topic.title}" in ${subject} has been completed. Moving to "${nextTopic?.title || 'the next topic'}".`;

  await addDoc(collection(db, 'syllabusNotifications'), {
    type: notifType,
    syllabusId,
    topicId,
    topicTitle: topic.title,
    schoolClass,
    subject,
    message,
    read: false,
    createdBy: userId(),
    createdAt: serverTimestamp(),
  });
};

// Called when viewing a syllabus — checks for overdue topics and logs notifications
export const checkAndFlagOverdueTopics = async (syllabusId, topics, schoolClass, subject) => {
  const today = new Date().toISOString().slice(0, 10);
  for (const topic of topics) {
    if (topic.isCompleted || !topic.dueDate) continue;
    if (topic.dueDate >= today) continue;
    // Check if overdue notification already exists for this topic
    const existing = await getDocs(query(
      collection(db, 'syllabusNotifications'),
      where('syllabusId', '==', syllabusId),
      where('topicId', '==', topic.id),
      where('type', '==', 'topic_overdue'),
      limit(1)
    ));
    if (!existing.empty) continue;
    await addDoc(collection(db, 'syllabusNotifications'), {
      type: 'topic_overdue',
      syllabusId,
      topicId: topic.id,
      topicTitle: topic.title,
      schoolClass,
      subject,
      message: `"${topic.title}" in ${subject} (${schoolClass}) is overdue. The teacher has not yet marked this topic as completed.`,
      read: false,
      createdBy: 'system',
      createdAt: serverTimestamp(),
    });
  }
};

export const getSyllabusNotifications = (schoolClass, callback) => {
  const q = query(
    collection(db, 'syllabusNotifications'),
    where('schoolClass', '==', schoolClass),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const markSyllabusNotificationRead = async (notifId) => {
  await updateDoc(doc(db, 'syllabusNotifications', notifId), { read: true });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ASSESSMENTS
// ═══════════════════════════════════════════════════════════════════════════════
// assessments/{id}: type, examType, schoolClass, subject, title, description,
//   dueDate, testDate, totalMarks, term, isMarked, studentMarks{}, postedBy, postedAt

export const createAssessment = async (data) => {
  const ref = await addDoc(collection(db, 'assessments'), {
    ...data,
    isMarked: false,
    studentMarks: {},
    postedBy: userId(),
    postedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getAssessmentsByClass = (schoolClass, callback) => {
  const q = query(
    collection(db, 'assessments'),
    where('schoolClass', '==', schoolClass),
    orderBy('postedAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getAssessmentsByTeacher = (teacherId, callback) => {
  const q = query(
    collection(db, 'assessments'),
    where('postedBy', '==', teacherId),
    orderBy('postedAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getAllAssessments = (callback) => {
  const q = query(
    collection(db, 'assessments'),
    orderBy('postedAt', 'desc'),
    limit(200)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const saveAssessmentMarks = async (assessmentId, studentMarks) => {
  await updateDoc(doc(db, 'assessments', assessmentId), {
    studentMarks,
    isMarked: true,
    markedAt: serverTimestamp(),
    markedBy: userId(),
  });
  // Notify via assessmentNotifications
  const snap = await getDocs(query(
    collection(db, 'assessments'),
    where('__name__', '==', assessmentId),
    limit(1)
  ));
  if (!snap.empty) {
    const a = snap.docs[0].data();
    await addDoc(collection(db, 'assessmentNotifications'), {
      assessmentId,
      type: 'marks_entered',
      schoolClass: a.schoolClass,
      subject: a.subject,
      assessmentTitle: a.title,
      assessmentType: a.type,
      message: `Marks have been entered for "${a.title}" (${a.subject}).`,
      createdAt: serverTimestamp(),
      createdBy: userId(),
    });
  }
};

export const deleteAssessment = async (assessmentId) => {
  await deleteDoc(doc(db, 'assessments', assessmentId));
};

// Get notifications for a class's assessments
export const getAssessmentNotifications = (schoolClass, callback) => {
  const q = query(
    collection(db, 'assessmentNotifications'),
    where('schoolClass', '==', schoolClass),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ─── Homework enquiries (parent asks teacher about a marked paper) ────────────
export const sendHomeworkEnquiry = async ({ assessmentId, assessmentTitle, subject, schoolClass, studentName, message }) => {
  await addDoc(collection(db, 'homeworkEnquiries'), {
    assessmentId,
    assessmentTitle,
    subject,
    schoolClass,
    studentName,
    message,
    parentId: userId(),
    reply: null,
    repliedAt: null,
    createdAt: serverTimestamp(),
  });
};

export const getHomeworkEnquiries = (assessmentId, callback) => {
  const q = query(
    collection(db, 'homeworkEnquiries'),
    where('assessmentId', '==', assessmentId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const replyToHomeworkEnquiry = async (enquiryId, reply) => {
  await updateDoc(doc(db, 'homeworkEnquiries', enquiryId), {
    reply,
    repliedAt: serverTimestamp(),
    repliedBy: userId(),
  });
};

// ─── Report Card generation ───────────────────────────────────────────────────
// Queries all finalyear exams for a class, ranks students, returns report card data
export const generateReportCard = async (schoolClass, schoolYear) => {
  const q = query(
    collection(db, 'assessments'),
    where('schoolClass', '==', schoolClass),
    where('type', '==', 'exam'),
    where('examType', '==', 'finalyear')
  );
  const snap = await getDocs(q);
  const exams = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!exams.length) return null;

  // Collect all student IDs
  const studentIds = new Set();
  exams.forEach(e => Object.keys(e.studentMarks || {}).forEach(id => studentIds.add(id)));

  const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

  // Build student data
  const students = Array.from(studentIds).map(sid => {
    const subjectGrades = exams.map(e => ({
      subject: e.subject,
      grade: e.studentMarks?.[sid]?.grade || 'F',
      points: GRADE_POINTS[e.studentMarks?.[sid]?.grade || 'F'] || 0,
      studentName: e.studentMarks?.[sid]?.studentName || '',
    }));
    const totalPoints = subjectGrades.reduce((s, sg) => s + sg.points, 0);
    const studentName = subjectGrades.find(sg => sg.studentName)?.studentName || 'Unknown';
    return { studentId: sid, studentName, subjectGrades, totalPoints };
  });

  // Rank by total points (descending)
  students.sort((a, b) => b.totalPoints - a.totalPoints);
  students.forEach((s, i) => { s.positionOverall = i + 1; });
  const totalStudents = students.length;

  // For secondary: also rank per subject
  const isSecondary = exams.length > 1;
  if (isSecondary) {
    exams.forEach(exam => {
      const subjectStudents = students
        .map(s => ({ ...s, pts: GRADE_POINTS[s.subjectGrades.find(sg => sg.subject === exam.subject)?.grade || 'F'] || 0 }))
        .sort((a, b) => b.pts - a.pts);
      subjectStudents.forEach((ss, i) => {
        const student = students.find(s => s.studentId === ss.studentId);
        if (student) {
          if (!student.subjectPositions) student.subjectPositions = {};
          student.subjectPositions[exam.subject] = i + 1;
        }
      });
    });
  }

  return { schoolClass, schoolYear, students, totalStudents, exams, generatedAt: new Date().toISOString() };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLUBS
// ═══════════════════════════════════════════════════════════════════════════════
// clubs/{id}: name, description, programme, teacherId, teacherName, isActive
// clubMembers/{clubId_studentId}: clubId, studentId, studentName, gender,
//   schoolClass, enrolledBy (parentId), enrolledAt, status
// clubAnnouncements/{id}: clubId, clubName, title, content,
//   status(pending|approved|rejected|school_wide), postedBy, approvedBy ...

export const createClub = async (data) => {
  const ref = await addDoc(collection(db, 'clubs'), {
    ...data,
    isActive: true,
    memberCount: 0,
    maleCount: 0,
    femaleCount: 0,
    createdBy: userId(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateClub = async (clubId, data) => {
  await updateDoc(doc(db, 'clubs', clubId), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId(),
  });
};

export const deleteClub = async (clubId) => {
  await deleteDoc(doc(db, 'clubs', clubId));
};

export const getClubs = (callback) => {
  const q = query(collection(db, 'clubs'), orderBy('name', 'asc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getTeacherClubs = (teacherId, callback) => {
  const q = query(
    collection(db, 'clubs'),
    where('teacherId', '==', teacherId)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// Enroll a student in a club (called by parent)
export const enrollInClub = async (clubId, studentId, { studentName, gender, schoolClass }) => {
  const memberId = `${clubId}_${studentId}`;
  const existing = await getDoc(doc(db, 'clubMembers', memberId));
  if (existing.exists() && existing.data().status === 'active') return; // already enrolled

  await setDoc(doc(db, 'clubMembers', memberId), {
    clubId,
    studentId,
    studentName,
    gender: gender || '',
    schoolClass: schoolClass || '',
    enrolledBy: userId(),
    enrolledAt: serverTimestamp(),
    status: 'active',
  });

  // Update club counts
  const membersSnap = await getDocs(query(
    collection(db, 'clubMembers'),
    where('clubId', '==', clubId),
    where('status', '==', 'active')
  ));
  const members = membersSnap.docs.map(d => d.data());
  await updateDoc(doc(db, 'clubs', clubId), {
    memberCount: members.length,
    maleCount: members.filter(m => m.gender?.toLowerCase() === 'male').length,
    femaleCount: members.filter(m => m.gender?.toLowerCase() === 'female').length,
  });
};

export const unenrollFromClub = async (clubId, studentId) => {
  const memberId = `${clubId}_${studentId}`;
  await updateDoc(doc(db, 'clubMembers', memberId), {
    status: 'inactive',
    unenrolledAt: serverTimestamp(),
    unenrolledBy: userId(),
  });
  // Recount
  const membersSnap = await getDocs(query(
    collection(db, 'clubMembers'),
    where('clubId', '==', clubId),
    where('status', '==', 'active')
  ));
  const members = membersSnap.docs.map(d => d.data());
  await updateDoc(doc(db, 'clubs', clubId), {
    memberCount: members.length,
    maleCount: members.filter(m => m.gender?.toLowerCase() === 'male').length,
    femaleCount: members.filter(m => m.gender?.toLowerCase() === 'female').length,
  });
};

export const getClubMembers = (clubId, callback) => {
  const q = query(
    collection(db, 'clubMembers'),
    where('clubId', '==', clubId),
    where('status', '==', 'active')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getStudentClubIds = async (studentId) => {
  const q = query(
    collection(db, 'clubMembers'),
    where('studentId', '==', studentId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().clubId);
};

export const isStudentEnrolledInClub = async (clubId, studentId) => {
  const memberId = `${clubId}_${studentId}`;
  const snap = await getDoc(doc(db, 'clubMembers', memberId));
  return snap.exists() && snap.data().status === 'active';
};

// ─── Club Announcements ───────────────────────────────────────────────────────
// Teacher posts → pending. Admin approves → approved or school_wide. Rejected → rejected.
export const postClubAnnouncement = async ({ clubId, clubName, title, content, teacherName }) => {
  await addDoc(collection(db, 'clubAnnouncements'), {
    clubId,
    clubName,
    title,
    content,
    teacherName: teacherName || '',
    status: 'pending',
    postedBy: userId(),
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    isSchoolWide: false,
    createdAt: serverTimestamp(),
  });
};

export const getClubAnnouncements = (clubId, callback) => {
  const q = query(
    collection(db, 'clubAnnouncements'),
    where('clubId', '==', clubId),
    where('status', 'in', ['approved', 'school_wide']),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getPendingClubAnnouncements = (callback) => {
  const q = query(
    collection(db, 'clubAnnouncements'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const approveClubAnnouncement = async (announcementId, makeSchoolWide = false) => {
  const newStatus = makeSchoolWide ? 'school_wide' : 'approved';
  await updateDoc(doc(db, 'clubAnnouncements', announcementId), {
    status: newStatus,
    isSchoolWide: makeSchoolWide,
    approvedBy: userId(),
    approvedAt: serverTimestamp(),
  });

  // If school-wide, also add to main announcements
  if (makeSchoolWide) {
    const snap = await getDoc(doc(db, 'clubAnnouncements', announcementId));
    if (snap.exists()) {
      const d = snap.data();
      await addDoc(collection(db, 'announcements'), {
        title: `[${d.clubName}] ${d.title}`,
        content: d.content,
        type: 'club',
        clubId: d.clubId,
        clubName: d.clubName,
        authorId: userId(),
        authorName: 'Admin',
        createdAt: serverTimestamp(),
      });
    }
  }
};

export const rejectClubAnnouncement = async (announcementId) => {
  await updateDoc(doc(db, 'clubAnnouncements', announcementId), {
    status: 'rejected',
    rejectedBy: userId(),
    rejectedAt: serverTimestamp(),
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSION FORMS
// ═══════════════════════════════════════════════════════════════════════════════
// permissionForms/{id}: schoolClass, activityTitle, description,
//   activityDate, startTime, endTime, responsibleTeachers[],
//   rules, materials[], status(active|closed), createdBy, createdByName
//
// permissionResponses/{formId_studentId}: formId, studentId, studentName,
//   schoolClass, parentId, response(approved|declined), notes, respondedAt

export const createPermissionForm = async (data) => {
  const ref = await addDoc(collection(db, 'permissionForms'), {
    ...data,
    status: 'active',
    createdBy: userId(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updatePermissionForm = async (formId, data) => {
  await updateDoc(doc(db, 'permissionForms', formId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const closePermissionForm = async (formId) => {
  await updateDoc(doc(db, 'permissionForms', formId), {
    status: 'closed',
    closedAt: serverTimestamp(),
    closedBy: userId(),
  });
};

export const deletePermissionForm = async (formId) => {
  await deleteDoc(doc(db, 'permissionForms', formId));
};

export const getPermissionFormsByTeacher = (teacherId, callback) => {
  const q = query(
    collection(db, 'permissionForms'),
    where('createdBy', '==', teacherId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getPermissionFormsByClass = (schoolClass, callback) => {
  const q = query(
    collection(db, 'permissionForms'),
    where('schoolClass', '==', schoolClass),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getAllPermissionForms = (callback) => {
  const q = query(
    collection(db, 'permissionForms'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const submitPermissionResponse = async (formId, studentId, {
  studentName, schoolClass, parentName, response, notes
}) => {
  const docId = `${formId}_${studentId}`;
  await setDoc(doc(db, 'permissionResponses', docId), {
    formId,
    studentId,
    studentName,
    schoolClass,
    parentId: userId(),
    parentName: parentName || '',
    response,
    notes: notes || '',
    respondedAt: serverTimestamp(),
  }, { merge: true });
};

export const getPermissionResponses = (formId, callback) => {
  const q = query(
    collection(db, 'permissionResponses'),
    where('formId', '==', formId),
    orderBy('respondedAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const getParentPermissionResponses = (parentId, callback) => {
  const q = query(
    collection(db, 'permissionResponses'),
    where('parentId', '==', parentId),
    orderBy('respondedAt', 'desc')
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};
