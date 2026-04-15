const express = require('express');
const router  = express.Router();
const { executeQuery } = require('../db');
const { authMiddleware, studentOnly } = require('../middleware');

router.use(authMiddleware, studentOnly);

// GET student profile
router.get('/profile', async (req, res) => {
  try {
    const r = await executeQuery(
      `SELECT s.*, c.course_code, c.course_name, col.college_name, col.college_code
       FROM STUDENT s
       JOIN COURSE c ON s.course_id=c.course_id
       JOIN COLLEGE col ON s.college_id=col.college_id
       WHERE s.student_id=:id`,
      { id: req.user.student_id }
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET available sections to enroll in
router.get('/available-sections', async (req, res) => {
  try {
    const r = await executeQuery(
      `SELECT sec.section_id, sec.section_code, sub.subject_id, sub.subject_code,
              sub.subject_name, sub.units, sec.faculty_name, sec.schedule, sec.room,
              sec.max_capacity, sec.current_count,
              (sec.max_capacity - sec.current_count) AS slots_available
       FROM SECTION sec
       JOIN SUBJECT sub ON sec.subject_id=sub.subject_id
       JOIN SEMESTER sem ON sec.semester_id=sem.semester_id
       WHERE sem.is_active='Y' AND sec.is_active='Y'
         AND sec.current_count < sec.max_capacity
       ORDER BY sub.subject_code`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET current enrollment status
router.get('/enrollment', async (req, res) => {
  try {
    const r = await executeQuery(
      `SELECT e.enrollment_id, e.enrollment_date, e.status, e.total_units,
              sem.semester_code, sem.acad_year
       FROM ENROLLMENT e
       JOIN SEMESTER sem ON e.semester_id=sem.semester_id
       WHERE e.student_id=:id AND sem.is_active='Y'`,
      { id: req.user.student_id }
    );
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET enrolled subjects
router.get('/enrolled-subjects', async (req, res) => {
  try {
    const r = await executeQuery(
      `SELECT es.enroll_subject_id, sub.subject_code, sub.subject_name,
              sub.units, sec.section_code, sec.faculty_name, sec.schedule,
              sec.room, es.status
       FROM ENROLLED_SUBJECT es
       JOIN ENROLLMENT e ON es.enrollment_id=e.enrollment_id
       JOIN SECTION sec ON es.section_id=sec.section_id
       JOIN SUBJECT sub ON sec.subject_id=sub.subject_id
       JOIN SEMESTER sem ON e.semester_id=sem.semester_id
       WHERE e.student_id=:id AND sem.is_active='Y'
       ORDER BY sub.subject_code`,
      { id: req.user.student_id }
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST enroll (create enrollment record for active semester)
router.post('/enroll', async (req, res) => {
  try {
    // Check if already enrolled this semester
    const existing = await executeQuery(
      `SELECT enrollment_id FROM ENROLLMENT e JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE e.student_id=:id AND sem.is_active='Y'`,
      { id: req.user.student_id }
    );
    let enrollmentId;
    if (existing.rows[0]) {
      enrollmentId = existing.rows[0].ENROLLMENT_ID;
    } else {
      // Create enrollment
      await executeQuery(
        `INSERT INTO ENROLLMENT VALUES (SEQ_ENROLLMENT.NEXTVAL,:sid,(SELECT semester_id FROM SEMESTER WHERE is_active='Y'),SYSDATE,'Active',0,'Y')`,
        { sid: req.user.student_id }
      );
      const newEnr = await executeQuery(
        `SELECT enrollment_id FROM ENROLLMENT e JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE e.student_id=:id AND sem.is_active='Y'`,
        { id: req.user.student_id }
      );
      enrollmentId = newEnr.rows[0].ENROLLMENT_ID;
      // Create tuition assessment
      await executeQuery(
        `INSERT INTO TUITION_ASSESSMENT (assessment_id,enrollment_id,total_amount_due,scholarship_deduction,total_paid,assessment_date,payment_scheme) VALUES (SEQ_TUITION_ASSESSMENT.NEXTVAL,:eid,0,0,0,SYSDATE,'Full')`,
        { eid: enrollmentId }
      );
    }
    res.json({ message: 'Enrollment created', enrollment_id: enrollmentId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add subject to enrollment
router.post('/add-subject', async (req, res) => {
  const { section_id } = req.body;
  try {
    // Get enrollment
    const enrR = await executeQuery(
      `SELECT e.enrollment_id FROM ENROLLMENT e JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE e.student_id=:id AND sem.is_active='Y'`,
      { id: req.user.student_id }
    );
    if (!enrR.rows[0]) return res.status(400).json({ error: 'Please create an enrollment first' });
    const enrollmentId = enrR.rows[0].ENROLLMENT_ID;

    // Check section capacity
    const secR = await executeQuery(`SELECT current_count, max_capacity, subject_id FROM SECTION WHERE section_id=:id`, { id: section_id });
    const sec = secR.rows[0];
    if (!sec) return res.status(404).json({ error: 'Section not found' });
    if (sec.CURRENT_COUNT >= sec.MAX_CAPACITY) return res.status(400).json({ error: 'Section is already full' });

    // Check prerequisite
    const prereqR = await executeQuery(
      `SELECT p.required_subject_id FROM PREREQUISITE p WHERE p.subject_id=:sid`,
      { sid: sec.SUBJECT_ID }
    );
    // (Simplified: just check if they've been in a section for the required subject before)

    // Check duplicate
    const dupR = await executeQuery(
      `SELECT es.enroll_subject_id FROM ENROLLED_SUBJECT es JOIN SECTION sec ON es.section_id=sec.section_id WHERE es.enrollment_id=:eid AND sec.subject_id=:subid`,
      { eid: enrollmentId, subid: sec.SUBJECT_ID }
    );
    if (dupR.rows[0]) return res.status(400).json({ error: 'Already enrolled in this subject' });

    // Enlist
    await executeQuery(
      `INSERT INTO ENROLLED_SUBJECT VALUES (SEQ_ENROLLED_SUBJECT.NEXTVAL,:eid,:secid,SYSDATE,'Active')`,
      { eid: enrollmentId, secid: section_id }
    );
    // Increment section count
    await executeQuery(`UPDATE SECTION SET current_count=current_count+1 WHERE section_id=:id`, { id: section_id });
    // Update total units
    await executeQuery(
      `UPDATE ENROLLMENT SET total_units=(SELECT NVL(SUM(sub.units),0) FROM ENROLLED_SUBJECT es JOIN SECTION sec ON es.section_id=sec.section_id JOIN SUBJECT sub ON sec.subject_id=sub.subject_id WHERE es.enrollment_id=:eid) WHERE enrollment_id=:eid`,
      { eid: enrollmentId }
    );
    // Update tuition (1500 per unit base rate)
    await executeQuery(
      `UPDATE TUITION_ASSESSMENT SET total_amount_due=(SELECT NVL(SUM(sub.units),0)*1500 FROM ENROLLED_SUBJECT es JOIN SECTION sec ON es.section_id=sec.section_id JOIN SUBJECT sub ON sec.subject_id=sub.subject_id WHERE es.enrollment_id=:eid) WHERE enrollment_id=:eid`,
      { eid: enrollmentId }
    );
    res.json({ message: 'Subject added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE drop subject
router.delete('/drop-subject/:id', async (req, res) => {
  try {
    const esR = await executeQuery(`SELECT section_id, enrollment_id FROM ENROLLED_SUBJECT WHERE enroll_subject_id=:id`, { id: req.params.id });
    const es = esR.rows[0];
    if (!es) return res.status(404).json({ error: 'Not found' });
    await executeQuery(`DELETE FROM ENROLLED_SUBJECT WHERE enroll_subject_id=:id`, { id: req.params.id });
    await executeQuery(`UPDATE SECTION SET current_count=current_count-1 WHERE section_id=:id AND current_count>0`, { id: es.SECTION_ID });
    await executeQuery(
      `UPDATE ENROLLMENT SET total_units=(SELECT NVL(SUM(sub.units),0) FROM ENROLLED_SUBJECT es2 JOIN SECTION sec ON es2.section_id=sec.section_id JOIN SUBJECT sub ON sec.subject_id=sub.subject_id WHERE es2.enrollment_id=:eid) WHERE enrollment_id=:eid`,
      { eid: es.ENROLLMENT_ID }
    );
    await executeQuery(
      `UPDATE TUITION_ASSESSMENT SET total_amount_due=(SELECT NVL(SUM(sub.units),0)*1500 FROM ENROLLED_SUBJECT es2 JOIN SECTION sec ON es2.section_id=sec.section_id JOIN SUBJECT sub ON sec.subject_id=sub.subject_id WHERE es2.enrollment_id=:eid) WHERE enrollment_id=:eid`,
      { eid: es.ENROLLMENT_ID }
    );
    res.json({ message: 'Subject dropped' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET payment info
router.get('/payment', async (req, res) => {
  try {
    const r = await executeQuery(
      `SELECT ta.assessment_id, ta.total_amount_due, ta.scholarship_deduction, ta.total_paid, ta.balance_due, ta.payment_scheme FROM TUITION_ASSESSMENT ta JOIN ENROLLMENT e ON ta.enrollment_id=e.enrollment_id JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE e.student_id=:id AND sem.is_active='Y'`,
      { id: req.user.student_id }
    );
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET payment history
router.get('/payment-history', async (req, res) => {
  try {
    const r = await executeQuery(
      `SELECT p.payment_id, p.receipt_number, p.payment_date, p.amount, p.payment_mode FROM PAYMENT p JOIN TUITION_ASSESSMENT ta ON p.assessment_id=ta.assessment_id JOIN ENROLLMENT e ON ta.enrollment_id=e.enrollment_id JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE e.student_id=:id AND sem.is_active='Y' ORDER BY p.payment_date DESC`,
      { id: req.user.student_id }
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST make payment
router.post('/pay', async (req, res) => {
  const { amount, payment_mode } = req.body;
  try {
    const taR = await executeQuery(
      `SELECT ta.assessment_id, ta.balance_due FROM TUITION_ASSESSMENT ta JOIN ENROLLMENT e ON ta.enrollment_id=e.enrollment_id JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE e.student_id=:id AND sem.is_active='Y'`,
      { id: req.user.student_id }
    );
    const ta = taR.rows[0];
    if (!ta) return res.status(404).json({ error: 'No assessment found' });
    if (amount > ta.BALANCE_DUE) return res.status(400).json({ error: 'Amount exceeds balance due' });
    const receipt = 'OR-' + Date.now();
    await executeQuery(`INSERT INTO PAYMENT VALUES (SEQ_PAYMENT.NEXTVAL,:aid,SYSDATE,:amt,:mode,:rcpt)`, { aid:ta.ASSESSMENT_ID, amt:amount, mode:payment_mode, rcpt:receipt });
    await executeQuery(`UPDATE TUITION_ASSESSMENT SET total_paid=(SELECT NVL(SUM(amount),0) FROM PAYMENT WHERE assessment_id=:aid) WHERE assessment_id=:aid`, { aid: ta.ASSESSMENT_ID });
    res.json({ message: 'Payment successful', receipt_number: receipt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
