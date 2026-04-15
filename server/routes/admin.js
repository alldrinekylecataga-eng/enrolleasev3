const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const { executeQuery } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware');

router.use(authMiddleware, adminOnly);

// ── DASHBOARD ──────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [students, sections, paySum, collegeSum, recent] = await Promise.all([
      executeQuery(`SELECT COUNT(*) AS cnt FROM ENROLLMENT e JOIN SEMESTER s ON e.semester_id=s.semester_id WHERE s.is_active='Y'`),
      executeQuery(`SELECT COUNT(*) AS cnt FROM SECTION s JOIN SEMESTER sem ON s.semester_id=sem.semester_id WHERE sem.is_active='Y' AND s.is_active='Y'`),
      executeQuery(`SELECT SUM(total_paid) AS paid, SUM(balance_due) AS bal FROM TUITION_ASSESSMENT ta JOIN ENROLLMENT e ON ta.enrollment_id=e.enrollment_id JOIN SEMESTER s ON e.semester_id=s.semester_id WHERE s.is_active='Y'`),
      executeQuery(`SELECT col.college_code, col.college_name, COUNT(DISTINCT e.student_id) AS total FROM ENROLLMENT e JOIN STUDENT st ON e.student_id=st.student_id JOIN COLLEGE col ON st.college_id=col.college_id JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE sem.is_active='Y' GROUP BY col.college_code, col.college_name ORDER BY col.college_code`),
      executeQuery(`SELECT s.student_no, s.lastname||', '||s.firstname AS full_name, e.enrollment_date, ta.balance_due, ta.payment_scheme FROM ENROLLMENT e JOIN STUDENT s ON e.student_id=s.student_id JOIN TUITION_ASSESSMENT ta ON e.enrollment_id=ta.enrollment_id JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE sem.is_active='Y' ORDER BY e.enrollment_date DESC FETCH FIRST 5 ROWS ONLY`),
    ]);
    res.json({
      enrolled: students.rows[0].CNT,
      sections: sections.rows[0].CNT,
      collected: paySum.rows[0].PAID || 0,
      outstanding: paySum.rows[0].BAL || 0,
      by_college: collegeSum.rows,
      recent_enrollments: recent.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── STUDENTS CRUD ──────────────────────────────────────────
router.get('/students', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT s.student_id, s.student_no, s.lastname, s.firstname, s.middlename, s.email, s.contact_no, c.course_code, col.college_code, s.year_level, s.status FROM STUDENT s JOIN COURSE c ON s.course_id=c.course_id JOIN COLLEGE col ON s.college_id=col.college_id ORDER BY s.lastname`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/students/:id', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT s.*, c.course_code, c.course_name, col.college_name FROM STUDENT s JOIN COURSE c ON s.course_id=c.course_id JOIN COLLEGE col ON s.college_id=col.college_id WHERE s.student_id=:id`, { id: req.params.id });
    if (!r.rows[0]) return res.status(404).json({ error: 'Student not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/students', async (req, res) => {
  const { student_no, lastname, firstname, middlename, email, contact_no, course_id, college_id, year_level } = req.body;
  try {
    await executeQuery(
      `INSERT INTO STUDENT VALUES (SEQ_STUDENT.NEXTVAL,:sno,:ln,:fn,:mn,:em,:cn,:cid,:colid,:yr,'Active')`,
      { sno:student_no, ln:lastname, fn:firstname, mn:middlename||null, em:email, cn:contact_no||null, cid:course_id, colid:college_id, yr:year_level||1 }
    );
    res.json({ message: 'Student created successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/students/:id', async (req, res) => {
  const { lastname, firstname, middlename, email, contact_no, course_id, college_id, year_level, status } = req.body;
  try {
    await executeQuery(
      `UPDATE STUDENT SET lastname=:ln, firstname=:fn, middlename=:mn, email=:em, contact_no=:cn, course_id=:cid, college_id=:colid, year_level=:yr, status=:st WHERE student_id=:id`,
      { ln:lastname, fn:firstname, mn:middlename||null, em:email, cn:contact_no||null, cid:course_id, colid:college_id, yr:year_level, st:status, id:req.params.id }
    );
    res.json({ message: 'Student updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/students/:id', async (req, res) => {
  try {
    await executeQuery(`UPDATE STUDENT SET status='Inactive' WHERE student_id=:id`, { id: req.params.id });
    res.json({ message: 'Student deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SECTIONS CRUD ──────────────────────────────────────────
router.get('/sections', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT sec.section_id, sec.section_code, sub.subject_code, sub.subject_name, sub.units, sec.faculty_name, sec.schedule, sec.room, sec.max_capacity, sec.current_count, sec.is_active, (sec.max_capacity - sec.current_count) AS slots_available FROM SECTION sec JOIN SUBJECT sub ON sec.subject_id=sub.subject_id JOIN SEMESTER sem ON sec.semester_id=sem.semester_id WHERE sem.is_active='Y' ORDER BY sub.subject_code`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sections', async (req, res) => {
  const { section_code, subject_id, faculty_name, schedule, room, max_capacity } = req.body;
  try {
    await executeQuery(
      `INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,:sc,:sid,(SELECT semester_id FROM SEMESTER WHERE is_active='Y'),:fn,:sch,:rm,:cap,0,'Y')`,
      { sc:section_code, sid:subject_id, fn:faculty_name||null, sch:schedule||null, rm:room||null, cap:max_capacity||40 }
    );
    res.json({ message: 'Section created successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/sections/:id', async (req, res) => {
  const { faculty_name, schedule, room, max_capacity, is_active } = req.body;
  try {
    await executeQuery(
      `UPDATE SECTION SET faculty_name=:fn, schedule=:sch, room=:rm, max_capacity=:cap, is_active=:act WHERE section_id=:id`,
      { fn:faculty_name, sch:schedule, rm:room, cap:max_capacity, act:is_active, id:req.params.id }
    );
    res.json({ message: 'Section updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/sections/:id', async (req, res) => {
  try {
    await executeQuery(`UPDATE SECTION SET is_active='N' WHERE section_id=:id`, { id: req.params.id });
    res.json({ message: 'Section deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ENROLLMENTS ────────────────────────────────────────────
router.get('/enrollments', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT e.enrollment_id, s.student_no, s.lastname||', '||s.firstname AS full_name, col.college_code, c.course_code, e.enrollment_date, e.status, e.total_units FROM ENROLLMENT e JOIN STUDENT s ON e.student_id=s.student_id JOIN COURSE c ON s.course_id=c.course_id JOIN COLLEGE col ON s.college_id=col.college_id JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE sem.is_active='Y' ORDER BY s.lastname`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/enrollments/:id/subjects', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT es.enroll_subject_id, sub.subject_code, sub.subject_name, sub.units, sec.section_code, sec.faculty_name, sec.schedule, sec.room FROM ENROLLED_SUBJECT es JOIN SECTION sec ON es.section_id=sec.section_id JOIN SUBJECT sub ON sec.subject_id=sub.subject_id WHERE es.enrollment_id=:id`, { id: req.params.id });
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PAYMENTS CRUD ──────────────────────────────────────────
router.get('/assessments', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT ta.assessment_id, s.student_no, s.lastname||', '||s.firstname AS full_name, col.college_code, c.course_code, ta.total_amount_due, ta.scholarship_deduction, ta.total_paid, ta.balance_due, ta.payment_scheme FROM TUITION_ASSESSMENT ta JOIN ENROLLMENT e ON ta.enrollment_id=e.enrollment_id JOIN STUDENT s ON e.student_id=s.student_id JOIN COURSE c ON s.course_id=c.course_id JOIN COLLEGE col ON s.college_id=col.college_id JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE sem.is_active='Y' ORDER BY s.lastname`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/payments', async (req, res) => {
  const { assessment_id, amount, payment_mode, receipt_number } = req.body;
  try {
    // Insert payment
    await executeQuery(
      `INSERT INTO PAYMENT VALUES (SEQ_PAYMENT.NEXTVAL,:aid,SYSDATE,:amt,:mode,:rcpt)`,
      { aid:assessment_id, amt:amount, mode:payment_mode, rcpt:receipt_number }
    );
    // Update total_paid on assessment
    await executeQuery(
      `UPDATE TUITION_ASSESSMENT SET total_paid = (SELECT NVL(SUM(amount),0) FROM PAYMENT WHERE assessment_id=:aid) WHERE assessment_id=:aid`,
      { aid: assessment_id }
    );
    res.json({ message: 'Payment recorded successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/payments/:id', async (req, res) => {
  try {
    const p = await executeQuery(`SELECT assessment_id FROM PAYMENT WHERE payment_id=:id`, { id: req.params.id });
    const aid = p.rows[0]?.ASSESSMENT_ID;
    await executeQuery(`DELETE FROM PAYMENT WHERE payment_id=:id`, { id: req.params.id });
    if (aid) {
      await executeQuery(`UPDATE TUITION_ASSESSMENT SET total_paid=(SELECT NVL(SUM(amount),0) FROM PAYMENT WHERE assessment_id=:aid) WHERE assessment_id=:aid`, { aid });
    }
    res.json({ message: 'Payment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/payments', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT p.payment_id, p.receipt_number, s.student_no, s.lastname||', '||s.firstname AS student_name, p.payment_date, p.amount, p.payment_mode FROM PAYMENT p JOIN TUITION_ASSESSMENT ta ON p.assessment_id=ta.assessment_id JOIN ENROLLMENT e ON ta.enrollment_id=e.enrollment_id JOIN STUDENT s ON e.student_id=s.student_id ORDER BY p.payment_date DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SCHOLARSHIPS CRUD ──────────────────────────────────────
router.get('/scholarships', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT * FROM SCHOLARSHIP ORDER BY scholarship_name`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/scholarships', async (req, res) => {
  const { scholarship_name, scholarship_type, max_amount } = req.body;
  try {
    await executeQuery(`INSERT INTO SCHOLARSHIP VALUES (SEQ_SCHOLARSHIP.NEXTVAL,:nm,:tp,:amt)`, { nm:scholarship_name, tp:scholarship_type, amt:max_amount });
    res.json({ message: 'Scholarship created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/scholarships/:id', async (req, res) => {
  const { scholarship_name, scholarship_type, max_amount } = req.body;
  try {
    await executeQuery(`UPDATE SCHOLARSHIP SET scholarship_name=:nm, scholarship_type=:tp, max_amount=:amt WHERE scholarship_id=:id`, { nm:scholarship_name, tp:scholarship_type, amt:max_amount, id:req.params.id });
    res.json({ message: 'Scholarship updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/scholarships/:id', async (req, res) => {
  try {
    await executeQuery(`DELETE FROM SCHOLARSHIP WHERE scholarship_id=:id`, { id: req.params.id });
    res.json({ message: 'Scholarship deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Award scholarship to student
router.post('/student-scholarships', async (req, res) => {
  const { student_id, scholarship_id, amount_awarded } = req.body;
  try {
    await executeQuery(
      `INSERT INTO STUDENT_SCHOLARSHIP VALUES (SEQ_STUDENT_SCHOLARSHIP.NEXTVAL,:sid,:schid,(SELECT semester_id FROM SEMESTER WHERE is_active='Y'),:amt,'Active')`,
      { sid:student_id, schid:scholarship_id, amt:amount_awarded }
    );
    // Update scholarship deduction on assessment
    await executeQuery(
      `UPDATE TUITION_ASSESSMENT SET scholarship_deduction = (SELECT NVL(SUM(amount_awarded),0) FROM STUDENT_SCHOLARSHIP ss JOIN SEMESTER sem ON ss.semester_id=sem.semester_id WHERE ss.student_id=(SELECT student_id FROM ENROLLMENT WHERE enrollment_id=enrollment_id) AND sem.is_active='Y') WHERE enrollment_id=(SELECT enrollment_id FROM ENROLLMENT e JOIN SEMESTER sem ON e.semester_id=sem.semester_id WHERE e.student_id=:sid AND sem.is_active='Y')`,
      { sid: student_id }
    );
    res.json({ message: 'Scholarship awarded' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/student-scholarships', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT ss.student_scholar_id, s.student_no, s.lastname||', '||s.firstname AS student_name, sch.scholarship_name, sch.scholarship_type, ss.amount_awarded, ss.status FROM STUDENT_SCHOLARSHIP ss JOIN STUDENT s ON ss.student_id=s.student_id JOIN SCHOLARSHIP sch ON ss.scholarship_id=sch.scholarship_id JOIN SEMESTER sem ON ss.semester_id=sem.semester_id WHERE sem.is_active='Y' ORDER BY s.lastname`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── USER MANAGEMENT ────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const r = await executeQuery(`SELECT u.user_id, u.username, u.role, u.is_active, s.student_no, s.lastname||', '||s.firstname AS full_name FROM USERS u LEFT JOIN STUDENT s ON u.student_id=s.student_id ORDER BY u.role, u.username`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users', async (req, res) => {
  const { username, password, role, student_id } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await executeQuery(
      `INSERT INTO USERS VALUES (SEQ_USERS.NEXTVAL,:un,:pw,:role,:sid,'Y',SYSDATE)`,
      { un:username, pw:hash, role, sid:student_id||null }
    );
    res.json({ message: 'User created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/users/:id/toggle', async (req, res) => {
  try {
    await executeQuery(`UPDATE USERS SET is_active=CASE WHEN is_active='Y' THEN 'N' ELSE 'Y' END WHERE user_id=:id`, { id: req.params.id });
    res.json({ message: 'User status toggled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── LOOKUP DATA ────────────────────────────────────────────
router.get('/colleges', async (req, res) => {
  try { res.json((await executeQuery(`SELECT * FROM COLLEGE ORDER BY college_code`)).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/courses', async (req, res) => {
  try { res.json((await executeQuery(`SELECT c.*, d.dept_name, col.college_name FROM COURSE c JOIN DEPARTMENT d ON c.dept_id=d.dept_id JOIN COLLEGE col ON d.college_id=col.college_id ORDER BY c.course_code`)).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/subjects', async (req, res) => {
  try { res.json((await executeQuery(`SELECT * FROM SUBJECT WHERE is_active='Y' ORDER BY subject_code`)).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
