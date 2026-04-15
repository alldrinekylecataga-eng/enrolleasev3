<?php
require_once '../includes/db.php';
require_once '../includes/auth.php';
requireStudent();

$sid = getCurrentUser()['student_id'];

$profile  = dbSelectOne("SELECT s.*, c.course_code, c.course_name, col.college_name, col.college_code FROM student s JOIN course c ON s.course_id=c.course_id JOIN college col ON s.college_id=col.college_id WHERE s.student_id=?", [$sid]);
$subjects = dbSelect("SELECT es.enroll_subject_id, sub.subject_code, sub.subject_name, sub.units, sec.section_code, sec.faculty_name, sec.schedule FROM enrolled_subject es JOIN enrollment e ON es.enrollment_id=e.enrollment_id JOIN section sec ON es.section_id=sec.section_id JOIN subject sub ON sec.subject_id=sub.subject_id JOIN semester sem ON e.semester_id=sem.semester_id WHERE e.student_id=? AND sem.is_active='Y' ORDER BY sub.subject_code", [$sid]);
$payment  = dbSelectOne("SELECT ta.total_amount_due, ta.scholarship_deduction, ta.total_paid, (ta.total_amount_due-ta.scholarship_deduction-ta.total_paid) AS balance_due FROM tuition_assessment ta JOIN enrollment e ON ta.enrollment_id=e.enrollment_id JOIN semester sem ON e.semester_id=sem.semester_id WHERE e.student_id=? AND sem.is_active='Y'", [$sid]);
$recentPay= dbSelect("SELECT p.receipt_number, p.payment_date, p.amount, p.payment_mode FROM payment p JOIN tuition_assessment ta ON p.assessment_id=ta.assessment_id JOIN enrollment e ON ta.enrollment_id=e.enrollment_id JOIN semester sem ON e.semester_id=sem.semester_id WHERE e.student_id=? AND sem.is_active='Y' ORDER BY p.payment_date DESC LIMIT 5", [$sid]);
$totalUnits = array_sum(array_column($subjects,'units'));
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>EnrollEase — My Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
<div class="layout">
<?php include '../includes/student_nav.php'; ?>
<div class="main">
  <header class="header">
    <div class="header-left"><h1>My Dashboard</h1><div class="hdiv"></div><p>Welcome, <?= htmlspecialchars($profile['firstname'] ?? '') ?></p></div>
    <span class="sem-pill">1st Semester 2024–2025</span>
  </header>
  <div class="content">
    <div class="stats-3">
      <div class="stat blue"><div class="stat-label">Enrolled subjects</div><div class="stat-val"><?= count($subjects) ?></div><div class="stat-sub">This semester</div></div>
      <div class="stat green"><div class="stat-label">Total units</div><div class="stat-val"><?= $totalUnits ?></div><div class="stat-sub">This semester</div></div>
      <div class="stat red"><div class="stat-label">Balance due</div><div class="stat-val"><?= peso($payment['balance_due'] ?? 0) ?></div><div class="stat-sub">Tuition balance</div></div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-head"><span class="card-title">My enrolled subjects</span></div>
        <table class="tbl">
          <thead><tr><th>Code</th><th>Subject</th><th>Units</th><th>Section</th><th>Schedule</th></tr></thead>
          <tbody>
            <?php foreach ($subjects as $s): ?>
            <tr>
              <td class="mono"><?= htmlspecialchars($s['subject_code']) ?></td>
              <td><?= htmlspecialchars($s['subject_name']) ?></td>
              <td class="mono"><?= $s['units'] ?></td>
              <td class="mono"><?= htmlspecialchars($s['section_code']) ?></td>
              <td><?= htmlspecialchars($s['schedule'] ?? '—') ?></td>
            </tr>
            <?php endforeach; ?>
            <?php if (empty($subjects)): ?><tr class="empty-row"><td colspan="5">No subjects enlisted yet. <a href="/student/enroll.php">Enroll now</a></td></tr><?php endif; ?>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Recent payments</span></div>
        <table class="tbl">
          <thead><tr><th>Receipt</th><th>Date</th><th>Amount</th><th>Mode</th></tr></thead>
          <tbody>
            <?php foreach ($recentPay as $p): ?>
            <tr>
              <td class="mono" style="font-size:10px"><?= htmlspecialchars($p['receipt_number']) ?></td>
              <td class="mono"><?= fmtDate($p['payment_date']) ?></td>
              <td class="mono" style="color:var(--green)"><?= peso($p['amount']) ?></td>
              <td><span class="tag tag-blue"><?= htmlspecialchars($p['payment_mode']) ?></span></td>
            </tr>
            <?php endforeach; ?>
            <?php if (empty($recentPay)): ?><tr class="empty-row"><td colspan="4">No payments yet</td></tr><?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
</div>
</body>
</html>
