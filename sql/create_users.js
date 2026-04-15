// ============================================================
// create_users.js — Run this after 02_insert_data.sql
// This creates login accounts with properly hashed passwords
// Run with: node sql/create_users.js
// ============================================================

const bcrypt   = require('bcryptjs');
const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const users = [
  // Admin account
  { username: 'admin',        password: 'admin123',    role: 'admin',   student_id: null },
  // Student accounts (student_id matches INSERT order above: 1-5)
  { username: '2021-0001',    password: 'student123',  role: 'student', student_id: 1 },
  { username: '2021-0002',    password: 'student123',  role: 'student', student_id: 2 },
  { username: '2022-0001',    password: 'student123',  role: 'student', student_id: 3 },
  { username: '2022-0002',    password: 'student123',  role: 'student', student_id: 4 },
  { username: '2023-0001',    password: 'student123',  role: 'student', student_id: 5 },
];

async function createUsers() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user:          process.env.DB_USER,
      password:      process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SID}`
    });

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.execute(
        `INSERT INTO USERS VALUES (SEQ_USERS.NEXTVAL, :un, :pw, :role, :sid, 'Y', SYSDATE)`,
        { un: u.username, pw: hash, role: u.role, sid: u.student_id },
        { autoCommit: true }
      );
      console.log(`✓ Created user: ${u.username} (${u.role})`);
    }

    console.log('\n✓ All users created successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin     → username: admin       | password: admin123');
    console.log('  Students  → username: [student_no] | password: student123');
    console.log('  Example   → username: 2021-0001   | password: student123');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

createUsers();
