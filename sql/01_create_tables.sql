-- ============================================================
-- EnrollEase: A Web-based University Enrollment,
-- Payments, and Academic Load Processing
-- 01_create_tables.sql
-- ============================================================

BEGIN
  FOR t IN (
    SELECT table_name FROM user_tables
    WHERE table_name IN (
      'USERS','STUDENT_SCHOLARSHIP','PAYMENT','TUITION_ASSESSMENT',
      'ENROLLED_SUBJECT','ENROLLMENT','SECTION','PREREQUISITE',
      'STUDENT','SCHOLARSHIP','SEMESTER','SUBJECT',
      'COURSE','DEPARTMENT','COLLEGE'
    )
  ) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

BEGIN
  FOR s IN (
    SELECT sequence_name FROM user_sequences
    WHERE sequence_name IN (
      'SEQ_USERS','SEQ_COLLEGE','SEQ_DEPARTMENT','SEQ_COURSE',
      'SEQ_SUBJECT','SEQ_PREREQUISITE','SEQ_SEMESTER','SEQ_STUDENT',
      'SEQ_SECTION','SEQ_ENROLLMENT','SEQ_ENROLLED_SUBJECT',
      'SEQ_TUITION_ASSESSMENT','SEQ_PAYMENT',
      'SEQ_SCHOLARSHIP','SEQ_STUDENT_SCHOLARSHIP'
    )
  ) LOOP
    EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
  END LOOP;
END;
/

-- SEQUENCES
CREATE SEQUENCE SEQ_USERS               START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_COLLEGE             START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_DEPARTMENT          START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_COURSE              START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_SUBJECT             START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_PREREQUISITE        START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_SEMESTER            START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_STUDENT             START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_SECTION             START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_ENROLLMENT          START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_ENROLLED_SUBJECT    START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_TUITION_ASSESSMENT  START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_PAYMENT             START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_SCHOLARSHIP         START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_STUDENT_SCHOLARSHIP START WITH 1 INCREMENT BY 1;

-- CORE TABLES
CREATE TABLE COLLEGE (
  college_id   NUMBER        PRIMARY KEY,
  college_code VARCHAR2(10)  NOT NULL UNIQUE,
  college_name VARCHAR2(100) NOT NULL
);

CREATE TABLE DEPARTMENT (
  dept_id    NUMBER        PRIMARY KEY,
  dept_code  VARCHAR2(10)  NOT NULL UNIQUE,
  dept_name  VARCHAR2(100) NOT NULL,
  college_id NUMBER        NOT NULL,
  CONSTRAINT fk_dept_college FOREIGN KEY (college_id) REFERENCES COLLEGE(college_id)
);

CREATE TABLE COURSE (
  course_id    NUMBER        PRIMARY KEY,
  course_code  VARCHAR2(20)  NOT NULL UNIQUE,
  course_name  VARCHAR2(100) NOT NULL,
  dept_id      NUMBER        NOT NULL,
  degree_level VARCHAR2(20)  DEFAULT 'Bachelor',
  CONSTRAINT fk_course_dept FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id)
);

CREATE TABLE SUBJECT (
  subject_id   NUMBER        PRIMARY KEY,
  subject_code VARCHAR2(20)  NOT NULL UNIQUE,
  subject_name VARCHAR2(100) NOT NULL,
  units        NUMBER(2)     NOT NULL,
  dept_id      NUMBER        NOT NULL,
  subject_type VARCHAR2(20)  DEFAULT 'Lecture',
  is_active    CHAR(1)       DEFAULT 'Y',
  CONSTRAINT fk_subject_dept FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id)
);

CREATE TABLE PREREQUISITE (
  prereq_id           NUMBER PRIMARY KEY,
  subject_id          NUMBER NOT NULL,
  required_subject_id NUMBER NOT NULL,
  CONSTRAINT fk_prereq_subject  FOREIGN KEY (subject_id)          REFERENCES SUBJECT(subject_id),
  CONSTRAINT fk_prereq_required FOREIGN KEY (required_subject_id) REFERENCES SUBJECT(subject_id)
);

CREATE TABLE SEMESTER (
  semester_id   NUMBER        PRIMARY KEY,
  semester_code VARCHAR2(20)  NOT NULL UNIQUE,
  acad_year     VARCHAR2(20)  NOT NULL,
  start_date    DATE          NOT NULL,
  end_date      DATE          NOT NULL,
  is_active     CHAR(1)       DEFAULT 'Y'
);

CREATE TABLE STUDENT (
  student_id NUMBER        PRIMARY KEY,
  student_no VARCHAR2(20)  NOT NULL UNIQUE,
  lastname   VARCHAR2(50)  NOT NULL,
  firstname  VARCHAR2(50)  NOT NULL,
  middlename VARCHAR2(50),
  email      VARCHAR2(100) NOT NULL UNIQUE,
  contact_no VARCHAR2(20),
  course_id  NUMBER        NOT NULL,
  college_id NUMBER        NOT NULL,
  year_level NUMBER(1)     DEFAULT 1,
  status     VARCHAR2(20)  DEFAULT 'Active',
  CONSTRAINT fk_student_course  FOREIGN KEY (course_id)  REFERENCES COURSE(course_id),
  CONSTRAINT fk_student_college FOREIGN KEY (college_id) REFERENCES COLLEGE(college_id)
);

CREATE TABLE SCHOLARSHIP (
  scholarship_id   NUMBER        PRIMARY KEY,
  scholarship_name VARCHAR2(100) NOT NULL,
  scholarship_type VARCHAR2(50),
  max_amount       NUMBER(10,2)  DEFAULT 0
);

-- USERS TABLE (authentication)
CREATE TABLE USERS (
  user_id       NUMBER        PRIMARY KEY,
  username      VARCHAR2(50)  NOT NULL UNIQUE,
  password_hash VARCHAR2(255) NOT NULL,
  role          VARCHAR2(20)  NOT NULL CHECK (role IN ('admin','student')),
  student_id    NUMBER,
  is_active     CHAR(1)       DEFAULT 'Y',
  created_at    DATE          DEFAULT SYSDATE,
  CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
);

-- ENROLLMENT TABLES
CREATE TABLE SECTION (
  section_id    NUMBER        PRIMARY KEY,
  section_code  VARCHAR2(20)  NOT NULL,
  subject_id    NUMBER        NOT NULL,
  semester_id   NUMBER        NOT NULL,
  faculty_name  VARCHAR2(100),
  schedule      VARCHAR2(50),
  room          VARCHAR2(30),
  max_capacity  NUMBER(3)     DEFAULT 40,
  current_count NUMBER(3)     DEFAULT 0,
  is_active     CHAR(1)       DEFAULT 'Y',
  CONSTRAINT fk_section_subject  FOREIGN KEY (subject_id)  REFERENCES SUBJECT(subject_id),
  CONSTRAINT fk_section_semester FOREIGN KEY (semester_id) REFERENCES SEMESTER(semester_id)
);

CREATE TABLE ENROLLMENT (
  enrollment_id   NUMBER        PRIMARY KEY,
  student_id      NUMBER        NOT NULL,
  semester_id     NUMBER        NOT NULL,
  enrollment_date DATE          DEFAULT SYSDATE,
  status          VARCHAR2(20)  DEFAULT 'Active',
  total_units     NUMBER(2)     DEFAULT 0,
  is_active       CHAR(1)       DEFAULT 'Y',
  CONSTRAINT fk_enrollment_student  FOREIGN KEY (student_id)  REFERENCES STUDENT(student_id),
  CONSTRAINT fk_enrollment_semester FOREIGN KEY (semester_id) REFERENCES SEMESTER(semester_id),
  CONSTRAINT uq_enrollment UNIQUE (student_id, semester_id)
);

CREATE TABLE ENROLLED_SUBJECT (
  enroll_subject_id NUMBER        PRIMARY KEY,
  enrollment_id     NUMBER        NOT NULL,
  section_id        NUMBER        NOT NULL,
  enlist_date       DATE          DEFAULT SYSDATE,
  status            VARCHAR2(20)  DEFAULT 'Active',
  CONSTRAINT fk_es_enrollment FOREIGN KEY (enrollment_id) REFERENCES ENROLLMENT(enrollment_id),
  CONSTRAINT fk_es_section    FOREIGN KEY (section_id)    REFERENCES SECTION(section_id),
  CONSTRAINT uq_enrolled_subject UNIQUE (enrollment_id, section_id)
);

-- PAYMENT TABLES
CREATE TABLE TUITION_ASSESSMENT (
  assessment_id         NUMBER        PRIMARY KEY,
  enrollment_id         NUMBER        NOT NULL UNIQUE,
  total_amount_due      NUMBER(10,2)  DEFAULT 0,
  scholarship_deduction NUMBER(10,2)  DEFAULT 0,
  total_paid            NUMBER(10,2)  DEFAULT 0,
  balance_due           NUMBER(10,2)  GENERATED ALWAYS AS
                          (total_amount_due - scholarship_deduction - total_paid) VIRTUAL,
  assessment_date       DATE          DEFAULT SYSDATE,
  payment_scheme        VARCHAR2(30)  DEFAULT 'Full',
  CONSTRAINT fk_ta_enrollment FOREIGN KEY (enrollment_id) REFERENCES ENROLLMENT(enrollment_id)
);

CREATE TABLE PAYMENT (
  payment_id     NUMBER        PRIMARY KEY,
  assessment_id  NUMBER        NOT NULL,
  payment_date   DATE          DEFAULT SYSDATE,
  amount         NUMBER(10,2)  NOT NULL,
  payment_mode   VARCHAR2(30)  NOT NULL,
  receipt_number VARCHAR2(100) NOT NULL UNIQUE,
  CONSTRAINT fk_payment_assessment FOREIGN KEY (assessment_id) REFERENCES TUITION_ASSESSMENT(assessment_id)
);

CREATE TABLE STUDENT_SCHOLARSHIP (
  student_scholar_id NUMBER        PRIMARY KEY,
  student_id         NUMBER        NOT NULL,
  scholarship_id     NUMBER        NOT NULL,
  semester_id        NUMBER        NOT NULL,
  amount_awarded     NUMBER(10,2)  DEFAULT 0,
  status             VARCHAR2(20)  DEFAULT 'Active',
  CONSTRAINT fk_ss_student     FOREIGN KEY (student_id)     REFERENCES STUDENT(student_id),
  CONSTRAINT fk_ss_scholarship FOREIGN KEY (scholarship_id) REFERENCES SCHOLARSHIP(scholarship_id),
  CONSTRAINT fk_ss_semester    FOREIGN KEY (semester_id)    REFERENCES SEMESTER(semester_id)
);

COMMIT;
