// functions/index.js
// Firebase Cloud Functions — push notification triggers for Chung Wah E-School.
// Requires Firebase Blaze plan (pay-as-you-go).
// Deploy: firebase deploy --only functions

'use strict';

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();

const db        = admin.firestore();
const messaging = admin.messaging();

// ─── Utility: split array into chunks of `size` ───────────────────────────────
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Get FCM tokens for all parents (and eligible students) of a class ─────────
async function getTokensForClass(schoolClass) {
  if (!schoolClass) return [];

  // 1. All students in this class
  const studentsSnap = await db
    .collection('Login').doc('Student').collection('users')
    .where('schoolClass', '==', schoolClass)
    .get();
  const studentDocIds = studentsSnap.docs.map(d => d.id);
  if (!studentDocIds.length) return [];

  // 2. Confirmed parents of those students
  const parentDocIds = new Set();
  for (const ids of chunk(studentDocIds, 10)) {
    const linksSnap = await db.collection('guardianRequests')
      .where('studentDocId', 'in', ids)
      .where('status', '==', 'confirmed')
      .get();
    linksSnap.docs.forEach(d => parentDocIds.add(d.data().parentDocId));
  }

  // 3. Fetch FCM tokens for parents + students
  const allDocIds = [...new Set([...parentDocIds, ...studentDocIds])];
  const tokens = [];
  for (const ids of chunk(allDocIds, 10)) {
    const snap = await db.collection('fcmTokens')
      .where('docId', 'in', ids)
      .get();
    snap.docs.forEach(d => { if (d.data().token) tokens.push(d.data().token); });
  }
  return [...new Set(tokens)];
}

// ─── Get FCM tokens for parents of active club members ────────────────────────
async function getTokensForClub(clubId) {
  if (!clubId) return [];

  const membersSnap = await db.collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('status', '==', 'active')
    .get();
  const studentDocIds = membersSnap.docs.map(d => d.data().studentId);
  if (!studentDocIds.length) return [];

  const parentDocIds = new Set();
  for (const ids of chunk(studentDocIds, 10)) {
    const linksSnap = await db.collection('guardianRequests')
      .where('studentDocId', 'in', ids)
      .where('status', '==', 'confirmed')
      .get();
    linksSnap.docs.forEach(d => parentDocIds.add(d.data().parentDocId));
  }

  const tokens = [];
  const allDocIds = [...new Set([...parentDocIds, ...studentDocIds])];
  for (const ids of chunk(allDocIds, 10)) {
    const snap = await db.collection('fcmTokens')
      .where('docId', 'in', ids)
      .get();
    snap.docs.forEach(d => { if (d.data().token) tokens.push(d.data().token); });
  }
  return [...new Set(tokens)];
}

// ─── Get every registered FCM token (school-wide broadcasts) ──────────────────
async function getAllTokens() {
  const snap = await db.collection('fcmTokens').get();
  return [...new Set(snap.docs.map(d => d.data().token).filter(Boolean))];
}

// ─── Send FCM multicast + clean up stale tokens ───────────────────────────────
async function sendToTokens(tokens, title, body, data = {}) {
  if (!tokens.length) return;

  // FCM data values must all be strings
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
  );

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        icon:      'ic_notification',
        color:     '#F4A334',
        channelId: 'chungwah_default',
        sound:     'default',
      },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  });

  // Remove tokens that the FCM server says are no longer valid
  const stale = [];
  response.responses.forEach((res, idx) => {
    if (!res.success) {
      const code = res.error?.code || '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) stale.push(tokens[idx]);
    }
  });
  if (stale.length) {
    const batch = db.batch();
    for (const t of stale.slice(0, 10)) {
      const snap = await db.collection('fcmTokens').where('token', '==', t).limit(1).get();
      snap.docs.forEach(d => batch.delete(d.ref));
    }
    await batch.commit();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TRIGGERS
// ═════════════════════════════════════════════════════════════════════════════

// 1 — New homework posted
exports.onHomeworkCreated = onDocumentCreated('assessments/{id}', async (event) => {
  const data = event.data?.data();
  if (!data || data.type !== 'homework') return null;
  const tokens = await getTokensForClass(data.schoolClass);
  return sendToTokens(
    tokens,
    '📚 New Homework',
    `${data.subject}: ${data.title}${data.dueDate ? ` — Due ${data.dueDate}` : ''}`,
    { type: 'homework', assessmentId: event.params.id, schoolClass: data.schoolClass }
  );
});

// 2 — Assessment/homework marked (isMarked flips to true)
exports.onAssessmentMarked = onDocumentUpdated('assessments/{id}', async (event) => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!after || before?.isMarked || !after.isMarked) return null;

  const tokens = await getTokensForClass(after.schoolClass);
  const label  = { homework: 'Homework', unitTest: 'Unit Test', assignment: 'Assignment' }[after.type] || 'Assessment';
  return sendToTokens(
    tokens,
    `✅ ${label} Marked`,
    `${after.subject}: "${after.title}" has been marked — check your results.`,
    { type: 'marks', assessmentId: event.params.id, schoolClass: after.schoolClass }
  );
});

// 3 — Syllabus notification created (topic completed / overdue / ahead)
exports.onSyllabusNotification = onDocumentCreated('syllabusNotifications/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return null;
  const tokens = await getTokensForClass(data.schoolClass);
  const emoji  = { topic_complete: '✅', topic_overdue: '⚠️', topic_ahead: '🏃' }[data.type] || '📖';
  const label  = { topic_complete: 'Topic Completed', topic_overdue: 'Topic Overdue', topic_ahead: 'Ahead of Schedule' }[data.type] || 'Syllabus Update';
  return sendToTokens(
    tokens,
    `${emoji} ${label} — ${data.subject}`,
    data.message,
    { type: 'syllabus', syllabusId: data.syllabusId, schoolClass: data.schoolClass }
  );
});

// 4 — Club announcement approved (status → approved or school_wide)
exports.onClubAnnouncementApproved = onDocumentUpdated('clubAnnouncements/{id}', async (event) => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!after || before?.status === after.status) return null;
  if (after.status !== 'approved' && after.status !== 'school_wide') return null;

  const tokens = after.status === 'school_wide'
    ? await getAllTokens()
    : await getTokensForClub(after.clubId);
  return sendToTokens(
    tokens,
    `📣 ${after.clubName || 'Club'}: ${after.title}`,
    after.content ? after.content.slice(0, 100) : 'Tap to view',
    { type: 'club', clubId: after.clubId }
  );
});

// 5 — Permission form created (notify parents of the class)
exports.onPermissionFormCreated = onDocumentCreated('permissionForms/{id}', async (event) => {
  const data = event.data?.data();
  if (!data) return null;
  const tokens = await getTokensForClass(data.schoolClass);
  return sendToTokens(
    tokens,
    '📋 Permission Form',
    `${data.activityTitle} — Please review and respond.`,
    { type: 'permission', formId: event.params.id, schoolClass: data.schoolClass }
  );
});

// 6 — Announcement posted (class or school-wide)
exports.onAnnouncementCreated = onDocumentCreated('announcements/{id}', async (event) => {
  const data = event.data?.data();
  if (!data || data.type === 'club') return null; // club announcements handled separately

  let tokens;
  if (data.scope === 'school') {
    tokens = await getAllTokens();
  } else if (data.schoolClass) {
    tokens = await getTokensForClass(data.schoolClass);
  } else {
    return null;
  }

  return sendToTokens(
    tokens,
    `📢 ${data.title || 'Announcement'}`,
    data.body ? data.body.slice(0, 120) : 'Tap to view',
    { type: 'announcement', scope: data.scope || 'class' }
  );
});

// 7 — Teacher replies to a homework enquiry
exports.onHomeworkEnquiryReplied = onDocumentUpdated('homeworkEnquiries/{id}', async (event) => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!after || before?.reply || !after.reply) return null;

  // Notify the parent who sent the enquiry (by their Login docId)
  const snap = await db.collection('fcmTokens')
    .where('docId', '==', after.parentId)
    .get();
  const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
  return sendToTokens(
    tokens,
    '💬 Teacher Replied',
    `Re "${after.assessmentTitle || 'homework'}": Your enquiry has been answered.`,
    { type: 'enquiry', enquiryId: event.params.id }
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// SCHEDULED — Daily overdue syllabus topic check (runs at 7:00 AM UTC)
// ═════════════════════════════════════════════════════════════════════════════
exports.checkOverdueSyllabusTopics = onSchedule('0 7 * * *', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const syllabusSnap = await db.collection('syllabuses').get();

  for (const syllabusDoc of syllabusSnap.docs) {
    const syllabus = syllabusDoc.data();
    const topics   = Array.isArray(syllabus.topics) ? syllabus.topics : [];

    for (const topic of topics) {
      if (topic.isCompleted || !topic.dueDate || topic.dueDate >= today) continue;

      // Only create one overdue notification per topic per syllabus
      const existing = await db.collection('syllabusNotifications')
        .where('syllabusId', '==', syllabusDoc.id)
        .where('topicId', '==', topic.id)
        .where('type', '==', 'topic_overdue')
        .limit(1)
        .get();
      if (!existing.empty) continue;

      await db.collection('syllabusNotifications').add({
        type:        'topic_overdue',
        syllabusId:  syllabusDoc.id,
        topicId:     topic.id,
        topicTitle:  topic.title,
        schoolClass: syllabus.schoolClass,
        subject:     syllabus.subject,
        message:     `"${topic.title}" in ${syllabus.subject} (${syllabus.schoolClass}) is overdue. The teacher has not yet marked it as completed.`,
        read:        false,
        createdBy:   'system',
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      });
      // The onDocumentCreated trigger for syllabusNotifications will
      // automatically fire the push notification to parents.
    }
  }
  console.log(`[checkOverdue] Ran at ${today}`);
});
