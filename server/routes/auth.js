const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const { executeQuery } = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const result = await executeQuery(
      `SELECT u.user_id, u.username, u.password_hash, u.role, u.student_id, u.is_active,
              s.lastname, s.firstname, s.student_no
       FROM USERS u
       LEFT JOIN STUDENT s ON u.student_id = s.student_id
       WHERE u.username = :username`,
      { username }
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    if (user.IS_ACTIVE !== 'Y') return res.status(403).json({ error: 'Account is deactivated' });
    const match = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign(
      { user_id: user.USER_ID, username: user.USERNAME, role: user.ROLE, student_id: user.STUDENT_ID },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      role: user.ROLE,
      user_id: user.USER_ID,
      username: user.USERNAME,
      student_id: user.STUDENT_ID,
      full_name: user.ROLE === 'student' ? `${user.LASTNAME}, ${user.FIRSTNAME}` : 'Administrator',
      student_no: user.STUDENT_NO
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  const { user_id, old_password, new_password } = req.body;
  try {
    const result = await executeQuery(
      `SELECT password_hash FROM USERS WHERE user_id = :id`, { id: user_id }
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const match = await bcrypt.compare(old_password, user.PASSWORD_HASH);
    if (!match) return res.status(401).json({ error: 'Old password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await executeQuery(
      `UPDATE USERS SET password_hash = :hash WHERE user_id = :id`,
      { hash, id: user_id }
    );
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
