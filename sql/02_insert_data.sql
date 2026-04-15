-- ============================================================
-- EnrollEase - 02_insert_data.sql
-- Run AFTER 01_create_tables.sql
-- NOTE: After inserting, run 03_create_users.js in Node.js
-- to create hashed user accounts (passwords cannot be hashed in SQL)
-- ============================================================

-- COLLEGE
INSERT INTO COLLEGE VALUES (SEQ_COLLEGE.NEXTVAL, 'CCS', 'College of Computer Studies');
INSERT INTO COLLEGE VALUES (SEQ_COLLEGE.NEXTVAL, 'COE', 'College of Engineering');
INSERT INTO COLLEGE VALUES (SEQ_COLLEGE.NEXTVAL, 'CBA', 'College of Business Administration');

-- DEPARTMENT
INSERT INTO DEPARTMENT VALUES (SEQ_DEPARTMENT.NEXTVAL, 'CS',  'Computer Science Department',        1);
INSERT INTO DEPARTMENT VALUES (SEQ_DEPARTMENT.NEXTVAL, 'IT',  'Information Technology Department',  1);
INSERT INTO DEPARTMENT VALUES (SEQ_DEPARTMENT.NEXTVAL, 'CE',  'Civil Engineering Department',       2);
INSERT INTO DEPARTMENT VALUES (SEQ_DEPARTMENT.NEXTVAL, 'ECE', 'Electronics Engineering Department', 2);
INSERT INTO DEPARTMENT VALUES (SEQ_DEPARTMENT.NEXTVAL, 'BA',  'Business Administration Department', 3);

-- COURSE
INSERT INTO COURSE VALUES (SEQ_COURSE.NEXTVAL, 'BSCS',  'BS Computer Science',           1, 'Bachelor');
INSERT INTO COURSE VALUES (SEQ_COURSE.NEXTVAL, 'BSIT',  'BS Information Technology',     2, 'Bachelor');
INSERT INTO COURSE VALUES (SEQ_COURSE.NEXTVAL, 'BSCE',  'BS Civil Engineering',          3, 'Bachelor');
INSERT INTO COURSE VALUES (SEQ_COURSE.NEXTVAL, 'BSECE', 'BS Electronics Engineering',    4, 'Bachelor');
INSERT INTO COURSE VALUES (SEQ_COURSE.NEXTVAL, 'BSBA',  'BS Business Administration',    5, 'Bachelor');

-- SUBJECT
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'CC101', 'Programming 1',           3, 1, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'CC102', 'Programming 2',           3, 1, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'CC103', 'Data Structures',         3, 1, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'CC104', 'Database Management',     3, 1, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'MATH1', 'Calculus 1',              3, 1, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'MATH2', 'Calculus 2',              3, 1, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'CE101', 'Statics of Rigid Bodies', 3, 3, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'CE102', 'Dynamics',                3, 3, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'BA101', 'Principles of Management',3, 5, 'Lecture', 'Y');
INSERT INTO SUBJECT VALUES (SEQ_SUBJECT.NEXTVAL, 'BA102', 'Financial Accounting',    3, 5, 'Lecture', 'Y');

-- PREREQUISITE
INSERT INTO PREREQUISITE VALUES (SEQ_PREREQUISITE.NEXTVAL, 2, 1);
INSERT INTO PREREQUISITE VALUES (SEQ_PREREQUISITE.NEXTVAL, 3, 2);
INSERT INTO PREREQUISITE VALUES (SEQ_PREREQUISITE.NEXTVAL, 4, 3);
INSERT INTO PREREQUISITE VALUES (SEQ_PREREQUISITE.NEXTVAL, 6, 5);

-- SEMESTER
INSERT INTO SEMESTER VALUES (SEQ_SEMESTER.NEXTVAL, '1ST-2024-2025', '2024-2025', DATE '2024-06-01', DATE '2024-10-31', 'Y');
INSERT INTO SEMESTER VALUES (SEQ_SEMESTER.NEXTVAL, '2ND-2024-2025', '2024-2025', DATE '2024-11-01', DATE '2025-03-31', 'N');

-- SCHOLARSHIP
INSERT INTO SCHOLARSHIP VALUES (SEQ_SCHOLARSHIP.NEXTVAL, 'Academic Excellence', 'Merit-based', 5000);
INSERT INTO SCHOLARSHIP VALUES (SEQ_SCHOLARSHIP.NEXTVAL, 'Financial Assistance', 'Need-based',  8000);
INSERT INTO SCHOLARSHIP VALUES (SEQ_SCHOLARSHIP.NEXTVAL, 'Athletic Grant',       'Special',     4000);

-- STUDENT
INSERT INTO STUDENT VALUES (SEQ_STUDENT.NEXTVAL,'2021-0001','dela Cruz','Juan','Santos','juan.delacruz@enrollease.edu.ph','09171234567',1,1,3,'Active');
INSERT INTO STUDENT VALUES (SEQ_STUDENT.NEXTVAL,'2021-0002','Santos','Maria','Lopez','maria.santos@enrollease.edu.ph','09182345678',2,1,3,'Active');
INSERT INTO STUDENT VALUES (SEQ_STUDENT.NEXTVAL,'2022-0001','Reyes','Pedro','Garcia','pedro.reyes@enrollease.edu.ph','09193456789',3,2,2,'Active');
INSERT INTO STUDENT VALUES (SEQ_STUDENT.NEXTVAL,'2022-0002','Flores','Ana','Cruz','ana.flores@enrollease.edu.ph','09204567890',4,2,2,'Active');
INSERT INTO STUDENT VALUES (SEQ_STUDENT.NEXTVAL,'2023-0001','Ramos','Jose','Dela Cruz','jose.ramos@enrollease.edu.ph','09215678901',5,3,1,'Active');

-- SECTION
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'CC101-A',1,1,'Prof. Santos','MWF 7-8AM','Room 101',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'CC101-B',1,1,'Prof. Santos','TTH 8-9:30AM','Room 101',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'CC102-A',2,1,'Prof. Reyes','MWF 9-10AM','Room 102',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'CC103-A',3,1,'Prof. Cruz','TTH 1-2:30PM','Room 103',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'CC104-A',4,1,'Prof. Lim','MWF 2-3PM','Room 104',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'MATH1-A',5,1,'Prof. Garcia','MWF 1-2PM','Room 201',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'MATH2-A',6,1,'Prof. Garcia','TTH 3-4:30PM','Room 201',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'CE101-A',7,1,'Prof. Torres','MWF 7-8AM','Room 301',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'CE102-A',8,1,'Prof. Flores','TTH 9-10:30AM','Room 302',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'BA101-A',9,1,'Prof. Ramos','MWF 10-11AM','Room 401',40,0,'Y');
INSERT INTO SECTION VALUES (SEQ_SECTION.NEXTVAL,'BA102-A',10,1,'Prof. Bautista','TTH 1-2:30PM','Room 402',40,0,'Y');

COMMIT;
-- After this, run: node sql/create_users.js
-- to create login accounts for admin and students
