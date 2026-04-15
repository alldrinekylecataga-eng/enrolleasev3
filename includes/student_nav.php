<?php
$current = basename($_SERVER['PHP_SELF']);
$user = getCurrentUser();
?>
<aside class="sidebar">
  <div class="sidebar-top">
    <div class="logo-wrap">
      <div class="logo-icon">E</div>
      <div><div class="logo-text">EnrollEase</div><div class="logo-sub">Student Portal</div></div>
    </div>
  </div>
  <nav class="nav">
    <div class="nav-group">My Account</div>
    <a class="nav-item <?= $current==='dashboard.php'?'active':'' ?>"   href="/student/dashboard.php"><span class="nav-dot"></span>My Dashboard</a>
    <a class="nav-item <?= $current==='profile.php'?'active':'' ?>"     href="/student/profile.php"><span class="nav-dot"></span>My Profile</a>
    <div class="nav-group">Enrollment</div>
    <a class="nav-item <?= $current==='enroll.php'?'active':'' ?>"      href="/student/enroll.php"><span class="nav-dot"></span>Enroll / Add Subjects</a>
    <a class="nav-item <?= $current==='my_subjects.php'?'active':'' ?>" href="/student/my_subjects.php"><span class="nav-dot"></span>My Subjects</a>
    <div class="nav-group">Payments</div>
    <a class="nav-item <?= $current==='payment.php'?'active':'' ?>"     href="/student/payment.php"><span class="nav-dot"></span>My Balance</a>
    <a class="nav-item <?= $current==='pay_history.php'?'active':'' ?>" href="/student/pay_history.php"><span class="nav-dot"></span>Payment History</a>
    <div class="nav-group">Settings</div>
    <a class="nav-item <?= $current==='settings.php'?'active':'' ?>"    href="/student/settings.php"><span class="nav-dot"></span>Change Password</a>
  </nav>
  <div class="sidebar-foot">
    <span class="user-name"><?= htmlspecialchars($user['full_name'] ?? '') ?></span>
    <a href="/logout.php" class="logout-link">Sign out</a>
  </div>
</aside>
