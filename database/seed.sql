-- =============================================================================
-- CapstoneHub — Production Seed Data
-- =============================================================================
-- This file seeds minimal bootstrap data for any college deploying CapstoneHub.
-- Faculty, students, and projects below use a neutral @demo.capstonehub.app
-- domain for initial demo purposes.
--
-- HOW TO USE FOR YOUR COLLEGE:
--   1. Run this file AFTER Spring Boot starts (Hibernate auto-creates tables).
--   2. Log in as admin@capstonehub.app with password Admin@123
--   3. Go to Admin Panel → Bulk Import Faculty / Invite Faculty via email.
--   4. Faculty can then self-register or be invited via their college email.
--
-- DEFAULT CREDENTIALS (change in production!):
--   Admin    : admin@capstonehub.app          | Admin@123
--   Faculty  : firstname.lastname@demo.capstonehub.app | Faculty@123
--   Students : firstname.lastname@student.demo.capstonehub.app | Student@123
--
-- BCrypt hash (strength 12) for all demo passwords:
--   $2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.
-- =============================================================================


-- =============================================================================
-- 1. SKILLS CATALOG
--    (Universal — works for any engineering/science college)
-- =============================================================================
INSERT INTO skills (skill_name, category) VALUES
  -- Programming
  ('Python',                'Programming'),
  ('Java',                  'Programming'),
  ('C',                     'Programming'),
  ('C++',                   'Programming'),
  ('MATLAB',                'Programming'),
  ('R Programming',         'Programming'),
  -- Frontend
  ('React',                 'Frontend'),
  ('Angular',               'Frontend'),
  ('Vue.js',                'Frontend'),
  ('UI/UX Design',          'Design'),
  ('Figma',                 'Design'),
  -- Backend
  ('Node.js',               'Backend'),
  ('Spring Boot',           'Backend'),
  ('FastAPI',               'Backend'),
  ('Django',                'Backend'),
  -- AI/ML
  ('Machine Learning',      'AI/ML'),
  ('Deep Learning',         'AI/ML'),
  ('TensorFlow',            'AI/ML'),
  ('Computer Vision',       'AI/ML'),
  ('NLP',                   'AI/ML'),
  ('Generative AI',         'AI/ML'),
  -- Analytics
  ('Data Science',          'Analytics'),
  ('Data Visualization',    'Analytics'),
  ('Business Analysis',     'Management'),
  -- Hardware / Embedded
  ('IoT',                   'Hardware'),
  ('Embedded C',            'Hardware'),
  ('PCB Design',            'Hardware'),
  ('Arduino',               'Hardware'),
  ('Raspberry Pi',          'Hardware'),
  ('VLSI Design',           'Hardware'),
  ('Robotics',              'Hardware'),
  ('3D Printing',           'Hardware'),
  ('Sensors & Actuators',   'Hardware'),
  -- ECE / EEE / EIE
  ('Signal Processing',     'ECE'),
  ('Wireless Networks',     'ECE'),
  ('Power Systems',         'EEE'),
  ('PLC / SCADA',           'EEE'),
  ('Industrial Automation', 'EIE'),
  ('Biomedical Instrumentation', 'Biomedical'),
  -- Database / DevOps
  ('PostgreSQL',            'Database'),
  ('MongoDB',               'Database'),
  ('MySQL',                 'Database'),
  ('Docker',                'DevOps'),
  ('Cloud (AWS/GCP)',       'DevOps'),
  ('Kubernetes',            'DevOps'),
  -- Security / Web3
  ('Cybersecurity',         'Security'),
  ('Blockchain',            'Web3'),
  -- Emerging
  ('AR/VR',                 'Emerging Tech'),
  -- Domain-specific
  ('Bioinformatics',        'Biotechnology'),
  ('Genetic Engineering',   'Biotechnology'),
  ('Structural Analysis',   'Civil'),
  ('AutoCAD',               'Civil'),
  ('Food Processing',       'Food Tech'),
  ('Quality Control',       'Food Tech'),
  ('Apparel Design',        'Fashion Tech'),
  ('Textile Manufacturing', 'Fashion Tech')
ON CONFLICT (skill_name) DO NOTHING;



-- =============================================================================
-- 2. SYSTEM ADMIN
--    (The first admin bootstraps the platform for the college)
-- =============================================================================
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at)
VALUES (
  'System Admin',
  'admin@capstonehub.app',
  '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.',
  'ADMIN', 'Administration', true, NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;


-- =============================================================================
-- 3. DEMO FACULTY
--    Seeded with real academic profiles (BIT College) for demonstration.
--    Replace email domains with your college domain in production.
--    e.g. UPDATE users SET email = REPLACE(email, '@demo.capstonehub.app', '@yourcollege.edu')
--         WHERE role = 'FACULTY';
-- =============================================================================

-- ── Computer Science and Engineering (CSE) ────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Sasikala D',        'sasikala.d@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSE', true, NOW(), NOW()),
  ('Dr. Premalatha K',      'premalatha.k@demo.capstonehub.app',      '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSE', true, NOW(), NOW()),
  ('Dr. Sathishkumar P',    'sathishkumar.p@demo.capstonehub.app',    '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSE', true, NOW(), NOW()),
  ('Dr. Sangeethaa S N',    'sangeethaa.sn@demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSE', true, NOW(), NOW()),
  ('Dr. Rajeshkumar G',     'rajeshkumar.g@demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSE', true, NOW(), NOW()),
  ('Dr. Karthiga M',        'karthiga.m@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSE', true, NOW(), NOW()),
  ('Dr. Praveen V',         'praveen.v@demo.capstonehub.app',         '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSE', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Database Systems, Data Mining, Cloud Computing', 6, 0, 'AVAILABLE', 4.8, 25
  FROM users u WHERE u.email = 'sasikala.d@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Machine Learning, Data Mining, Soft Computing', 5, 0, 'AVAILABLE', 4.7, 30
  FROM users u WHERE u.email = 'premalatha.k@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Distributed Systems, Cloud Computing, Networks', 5, 0, 'AVAILABLE', 4.6, 22
  FROM users u WHERE u.email = 'sathishkumar.p@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Natural Language Processing, AI, Web Technologies', 5, 0, 'AVAILABLE', 4.5, 18
  FROM users u WHERE u.email = 'sangeethaa.sn@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Computer Networks, Cybersecurity, Operating Systems', 5, 0, 'AVAILABLE', 4.4, 15
  FROM users u WHERE u.email = 'rajeshkumar.g@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'Deep Learning, Computer Vision, Python', 4, 0, 'AVAILABLE', 4.5, 10
  FROM users u WHERE u.email = 'karthiga.m@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'Computer Vision, Robotics, Embedded Systems', 4, 0, 'AVAILABLE', 4.4, 11
  FROM users u WHERE u.email = 'praveen.v@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'sasikala.d@demo.capstonehub.app'
    AND s.skill_name IN ('Python','PostgreSQL','Cloud (AWS/GCP)','Data Science')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'premalatha.k@demo.capstonehub.app'
    AND s.skill_name IN ('Machine Learning','Deep Learning','Python','TensorFlow','Data Science')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'sathishkumar.p@demo.capstonehub.app'
    AND s.skill_name IN ('Docker','Cloud (AWS/GCP)','Spring Boot','PostgreSQL')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'sangeethaa.sn@demo.capstonehub.app'
    AND s.skill_name IN ('NLP','Machine Learning','Python','React')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'karthiga.m@demo.capstonehub.app'
    AND s.skill_name IN ('Deep Learning','Computer Vision','Python','TensorFlow')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'praveen.v@demo.capstonehub.app'
    AND s.skill_name IN ('Robotics','Computer Vision','Arduino','Python')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Artificial Intelligence and Data Science (AI&DS) ─────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Gomathi R',         'gomathi.r@demo.capstonehub.app',         '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&DS', true, NOW(), NOW()),
  ('Dr. Sundara Murthy S',  'sundaramurthy.s@demo.capstonehub.app',   '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&DS', true, NOW(), NOW()),
  ('Dr. Eswaramoorthy V',   'eswaramoorthy.v@demo.capstonehub.app',   '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&DS', true, NOW(), NOW()),
  ('Dr. Arun Kumar R',      'arunkumar.r@demo.capstonehub.app',       '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&DS', true, NOW(), NOW()),
  ('Dr. Balasamy K',        'balasamy.k@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&DS', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Artificial Intelligence, Data Science, Big Data Analytics', 6, 0, 'AVAILABLE', 4.9, 32
  FROM users u WHERE u.email = 'gomathi.r@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Data Mining, Knowledge Discovery, Statistical Learning', 5, 0, 'AVAILABLE', 4.6, 20
  FROM users u WHERE u.email = 'sundaramurthy.s@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Predictive Analytics, Business Intelligence, Python', 5, 0, 'AVAILABLE', 4.5, 17
  FROM users u WHERE u.email = 'eswaramoorthy.v@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'Machine Learning, Computer Vision, Deep Learning', 4, 0, 'AVAILABLE', 4.5, 15
  FROM users u WHERE u.email = 'arunkumar.r@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'Federated Learning, Privacy-Preserving AI, Blockchain', 4, 0, 'AVAILABLE', 4.2, 9
  FROM users u WHERE u.email = 'balasamy.k@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'gomathi.r@demo.capstonehub.app'
    AND s.skill_name IN ('Machine Learning','Deep Learning','Data Science','Python','TensorFlow')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'arunkumar.r@demo.capstonehub.app'
    AND s.skill_name IN ('Machine Learning','Computer Vision','Deep Learning','Python')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'balasamy.k@demo.capstonehub.app'
    AND s.skill_name IN ('Blockchain','Machine Learning','Python','Data Science')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Artificial Intelligence and Machine Learning (AI&ML) ──────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Bharathi A',        'bharathi.a@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&ML', true, NOW(), NOW()),
  ('Dr. Gopalakrishnan B',  'gopalakrishnan.b@demo.capstonehub.app',  '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&ML', true, NOW(), NOW()),
  ('Dr. Rajasekar S S',     'rajasekar.ss@demo.capstonehub.app',      '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&ML', true, NOW(), NOW()),
  ('Dr. Karthikeyan G',     'karthikeyan.g@demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'AI&ML', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Neural Networks, Explainable AI, Transfer Learning', 6, 0, 'AVAILABLE', 4.8, 28
  FROM users u WHERE u.email = 'bharathi.a@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Evolutionary Computation, Swarm Intelligence, Optimization', 5, 0, 'AVAILABLE', 4.6, 22
  FROM users u WHERE u.email = 'gopalakrishnan.b@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'Generative AI, GANs, Diffusion Models', 4, 0, 'AVAILABLE', 4.4, 14
  FROM users u WHERE u.email = 'rajasekar.ss@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Assistant Professor', 'TensorFlow, PyTorch, Model Deployment, MLOps', 3, 0, 'AVAILABLE', 4.2, 8
  FROM users u WHERE u.email = 'karthikeyan.g@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'bharathi.a@demo.capstonehub.app'
    AND s.skill_name IN ('Machine Learning','Deep Learning','NLP','Python','TensorFlow')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'karthikeyan.g@demo.capstonehub.app'
    AND s.skill_name IN ('TensorFlow','Python','Deep Learning','Generative AI')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Electronics and Communication Engineering (ECE) ──────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Prakash S P',       'prakash.sp@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'ECE', true, NOW(), NOW()),
  ('Dr. Harikumar R',       'harikumar.r@demo.capstonehub.app',       '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'ECE', true, NOW(), NOW()),
  ('Dr. Poongodi C',        'poongodi.c@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'ECE', true, NOW(), NOW()),
  ('Dr. Pushpavalli M',     'pushpavalli.m@demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'ECE', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'VLSI Design, Embedded Systems, Signal Processing', 6, 0, 'AVAILABLE', 4.7, 26
  FROM users u WHERE u.email = 'prakash.sp@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Biomedical Signal Processing, Telemedicine, Sensor Fusion', 5, 0, 'AVAILABLE', 4.8, 35
  FROM users u WHERE u.email = 'harikumar.r@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Wireless Communication, 5G Networks, Antenna Design', 5, 0, 'AVAILABLE', 4.5, 19
  FROM users u WHERE u.email = 'poongodi.c@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'IoT, Embedded Systems, PCB Design', 4, 0, 'AVAILABLE', 4.3, 11
  FROM users u WHERE u.email = 'pushpavalli.m@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'prakash.sp@demo.capstonehub.app'
    AND s.skill_name IN ('VLSI Design','Embedded C','Signal Processing','Arduino')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'harikumar.r@demo.capstonehub.app'
    AND s.skill_name IN ('Signal Processing','Python','MATLAB','IoT')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'pushpavalli.m@demo.capstonehub.app'
    AND s.skill_name IN ('IoT','Embedded C','PCB Design','Arduino','Raspberry Pi')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Information Technology (IT) ───────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Naveena S',         'naveena.s@demo.capstonehub.app',         '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'IT', true, NOW(), NOW()),
  ('Dr. Palanisamy C',      'palanisamy.c@demo.capstonehub.app',      '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'IT', true, NOW(), NOW()),
  ('Dr. Chandraprabha K',   'chandraprabha.k@demo.capstonehub.app',   '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'IT', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Network Security, Cloud Computing, Information Systems', 6, 0, 'AVAILABLE', 4.7, 24
  FROM users u WHERE u.email = 'naveena.s@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Distributed Computing, Parallel Processing, Grid Computing', 5, 0, 'AVAILABLE', 4.5, 18
  FROM users u WHERE u.email = 'palanisamy.c@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'Full Stack Development, React, Node.js, REST APIs', 4, 0, 'AVAILABLE', 4.6, 16
  FROM users u WHERE u.email = 'chandraprabha.k@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'naveena.s@demo.capstonehub.app'
    AND s.skill_name IN ('Cybersecurity','Cloud (AWS/GCP)','Docker','Spring Boot')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'chandraprabha.k@demo.capstonehub.app'
    AND s.skill_name IN ('React','Node.js','MongoDB','PostgreSQL','UI/UX Design')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Electrical and Electronics Engineering (EEE) ─────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Maheswari K T',     'maheswari.kt@demo.capstonehub.app',      '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'EEE', true, NOW(), NOW()),
  ('Dr. Sivaraman P',       'sivaraman.p@demo.capstonehub.app',       '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'EEE', true, NOW(), NOW()),
  ('Dr. Veerakumar S',      'veerakumar.s@demo.capstonehub.app',      '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'EEE', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Power Systems, Smart Grid, Renewable Energy', 6, 0, 'AVAILABLE', 4.6, 22
  FROM users u WHERE u.email = 'maheswari.kt@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Control Systems, PLC, Industrial Automation, SCADA', 5, 0, 'AVAILABLE', 4.4, 16
  FROM users u WHERE u.email = 'sivaraman.p@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'IoT-based Energy Management, Solar Energy Systems', 4, 0, 'AVAILABLE', 4.2, 10
  FROM users u WHERE u.email = 'veerakumar.s@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'maheswari.kt@demo.capstonehub.app'
    AND s.skill_name IN ('Power Systems','MATLAB','IoT','Arduino')
ON CONFLICT (user_id, skill_id) DO NOTHING;
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'sivaraman.p@demo.capstonehub.app'
    AND s.skill_name IN ('PLC / SCADA','Embedded C','MATLAB','IoT')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Agricultural Engineering ──────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Chelladurai V',     'chelladurai.v@demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Agricultural Engineering', true, NOW(), NOW()),
  ('Dr. Vasudevan M',       'vasudevan.m@demo.capstonehub.app',       '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Agricultural Engineering', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Precision Agriculture, Farm Automation, IoT in Agriculture', 5, 0, 'AVAILABLE', 4.5, 18
  FROM users u WHERE u.email = 'chelladurai.v@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Associate Professor', 'Agricultural Machinery, Drone Technology, Remote Sensing', 4, 0, 'AVAILABLE', 4.2, 10
  FROM users u WHERE u.email = 'vasudevan.m@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'chelladurai.v@demo.capstonehub.app'
    AND s.skill_name IN ('IoT','Arduino','Raspberry Pi','Python','Data Science')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Biotechnology ─────────────────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Balakrishnaraja R', 'balakrishnaraja.r@demo.capstonehub.app', '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Biotechnology', true, NOW(), NOW()),
  ('Dr. Kannan K P',        'kannan.kp@demo.capstonehub.app',         '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Biotechnology', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Bioinformatics, Genetic Engineering, Molecular Biology', 5, 0, 'AVAILABLE', 4.6, 20
  FROM users u WHERE u.email = 'balakrishnaraja.r@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Professor', 'Microbiology, Fermentation Technology, Drug Discovery', 5, 0, 'AVAILABLE', 4.5, 17
  FROM users u WHERE u.email = 'kannan.kp@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'balakrishnaraja.r@demo.capstonehub.app'
    AND s.skill_name IN ('Bioinformatics','Python','Data Science','Genetic Engineering')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Civil Engineering ─────────────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Mohanraj A',        'mohanraj.a@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Civil Engineering', true, NOW(), NOW()),
  ('Dr. Geethamani R',      'geethamani.r@demo.capstonehub.app',      '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Civil Engineering', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Structural Engineering, Concrete Technology, Smart Infrastructure', 5, 0, 'AVAILABLE', 4.4, 16
  FROM users u WHERE u.email = 'mohanraj.a@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Assistant Professor', 'GIS Mapping, Remote Sensing, AutoCAD', 3, 0, 'AVAILABLE', 4.1, 7
  FROM users u WHERE u.email = 'geethamani.r@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'mohanraj.a@demo.capstonehub.app'
    AND s.skill_name IN ('Structural Analysis','AutoCAD','MATLAB')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Biomedical Engineering ──────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Malathi N',         'malathi.n@demo.capstonehub.app',         '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Biomedical Engineering', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Biomedical Instrumentation, Medical Image Processing, Wearable Sensors', 5, 0, 'AVAILABLE', 4.5, 14
  FROM users u WHERE u.email = 'malathi.n@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'malathi.n@demo.capstonehub.app'
    AND s.skill_name IN ('Biomedical Instrumentation','IoT','Signal Processing')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Computer Science and Business Systems ─────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Kousalya K',        'kousalya.k@demo.capstonehub.app',        '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSBS', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Business Analytics, Enterprise Systems, Software Engineering', 5, 0, 'AVAILABLE', 4.3, 11
  FROM users u WHERE u.email = 'kousalya.k@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'kousalya.k@demo.capstonehub.app'
    AND s.skill_name IN ('Business Analysis','Data Science','Java')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Computer Science and Design ───────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Senthil Kumar P',   'senthilkumar.p@demo.capstonehub.app',    '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'CSD', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Human-Computer Interaction, UI/UX Design, AR/VR', 5, 0, 'AVAILABLE', 4.6, 19
  FROM users u WHERE u.email = 'senthilkumar.p@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'senthilkumar.p@demo.capstonehub.app'
    AND s.skill_name IN ('UI/UX Design','Figma','AR/VR','React')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Computer Technology ───────────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Selvakumar S',      'selvakumar.s@demo.capstonehub.app',      '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Computer Technology', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Cloud Computing, Edge Computing, DevOps', 5, 0, 'AVAILABLE', 4.4, 15
  FROM users u WHERE u.email = 'selvakumar.s@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;


-- ── Electronics and Instrumentation Engineering ───────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Rathinasamy M',     'rathinasamy.m@demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'EIE', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Process Control, Industrial Automation, Sensor Networks', 5, 0, 'AVAILABLE', 4.5, 17
  FROM users u WHERE u.email = 'rathinasamy.m@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'rathinasamy.m@demo.capstonehub.app'
    AND s.skill_name IN ('Industrial Automation','Sensors & Actuators','PLC / SCADA')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- ── Fashion Technology ────────────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Radhika R',         'radhika.r@demo.capstonehub.app',         '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Fashion Technology', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Apparel Design, E-Textiles, Sustainable Fashion', 5, 0, 'AVAILABLE', 4.3, 10
  FROM users u WHERE u.email = 'radhika.r@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;


-- ── Food Technology ───────────────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Anitha G',          'anitha.g@demo.capstonehub.app',          '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Food Technology', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Food Processing, Nutraceuticals, Quality Control', 5, 0, 'AVAILABLE', 4.4, 12
  FROM users u WHERE u.email = 'anitha.g@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;


-- ── Information Science and Engineering ───────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Balamurugan S',     'balamurugan.s@demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'ISE', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Information Security, Knowledge Graphs, Data Analytics', 5, 0, 'AVAILABLE', 4.5, 16
  FROM users u WHERE u.email = 'balamurugan.s@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;


-- ── Mechatronics Engineering ──────────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Dr. Karthik S',         'karthik.s@demo.capstonehub.app',         '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'FACULTY', 'Mechatronics', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty_profiles (user_id, designation, bio, max_team_capacity, current_team_count, availability_status, mentor_rating, total_ratings)
SELECT u.id, 'Head of Department', 'Robotics, Automation, Cyber-Physical Systems', 5, 0, 'AVAILABLE', 4.6, 21
  FROM users u WHERE u.email = 'karthik.s@demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, 4 FROM users u, skills s
  WHERE u.email = 'karthik.s@demo.capstonehub.app'
    AND s.skill_name IN ('Robotics','Embedded C','IoT')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- =============================================================================
-- 4. INDUSTRY PARTNER (Demo)
-- =============================================================================
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at)
VALUES (
  'TechNova Solutions',
  'partner@technova.com',
  '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.',
  'INDUSTRY', 'Technology', true, NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;


-- =============================================================================
-- 5. DEMO STUDENTS (8 sample students across departments)
-- =============================================================================
INSERT INTO users (name, email, password_hash, role, department, is_active, created_at, updated_at) VALUES
  ('Arjun Selvam',     'arjun.selvam@student.demo.capstonehub.app',    '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'CSE',                    true, NOW(), NOW()),
  ('Meena Lakshmi',    'meena.lakshmi@student.demo.capstonehub.app',   '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'AI&DS',                   true, NOW(), NOW()),
  ('Rohith Kumar',     'rohith.kumar@student.demo.capstonehub.app',    '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'ECE',                    true, NOW(), NOW()),
  ('Sneha Rajan',      'sneha.rajan@student.demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'AI&ML',                   true, NOW(), NOW()),
  ('Karthick Pandi',   'karthick.pandi@student.demo.capstonehub.app',  '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'IT',                     true, NOW(), NOW()),
  ('Divya Priya',      'divya.priya@student.demo.capstonehub.app',     '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'CSE',                    true, NOW(), NOW()),
  ('Sanjay Murugan',   'sanjay.murugan@student.demo.capstonehub.app',  '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'EEE',                    true, NOW(), NOW()),
  ('Lakshana Devi',    'lakshana.devi@student.demo.capstonehub.app',   '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.', 'STUDENT', 'Biotechnology',           true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Student Profiles
INSERT INTO student_profiles (user_id, year_of_study, github_link)
SELECT u.id, 4, 'https://github.com/arjun-selvam'
  FROM users u WHERE u.email = 'arjun.selvam@student.demo.capstonehub.app' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, year_of_study) SELECT u.id, 3 FROM users u WHERE u.email = 'meena.lakshmi@student.demo.capstonehub.app'   ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, year_of_study) SELECT u.id, 4 FROM users u WHERE u.email = 'rohith.kumar@student.demo.capstonehub.app'    ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, year_of_study) SELECT u.id, 3 FROM users u WHERE u.email = 'sneha.rajan@student.demo.capstonehub.app'     ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, year_of_study) SELECT u.id, 4 FROM users u WHERE u.email = 'karthick.pandi@student.demo.capstonehub.app'  ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, year_of_study) SELECT u.id, 4 FROM users u WHERE u.email = 'divya.priya@student.demo.capstonehub.app'     ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, year_of_study) SELECT u.id, 3 FROM users u WHERE u.email = 'sanjay.murugan@student.demo.capstonehub.app'  ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, year_of_study) SELECT u.id, 4 FROM users u WHERE u.email = 'lakshana.devi@student.demo.capstonehub.app'   ON CONFLICT (user_id) DO NOTHING;

-- Student Skills
INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'Python' THEN 4 WHEN 'Spring Boot' THEN 3 ELSE 2 END
  FROM users u, skills s WHERE u.email = 'arjun.selvam@student.demo.capstonehub.app'
    AND s.skill_name IN ('Python','Spring Boot','PostgreSQL','Machine Learning')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'Machine Learning' THEN 4 WHEN 'Data Science' THEN 4 WHEN 'Python' THEN 4 ELSE 2 END
  FROM users u, skills s WHERE u.email = 'meena.lakshmi@student.demo.capstonehub.app'
    AND s.skill_name IN ('Machine Learning','Data Science','Python','TensorFlow')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'IoT' THEN 4 WHEN 'Embedded C' THEN 4 WHEN 'Arduino' THEN 3 ELSE 2 END
  FROM users u, skills s WHERE u.email = 'rohith.kumar@student.demo.capstonehub.app'
    AND s.skill_name IN ('IoT','Embedded C','Arduino','Signal Processing')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'Deep Learning' THEN 4 WHEN 'Computer Vision' THEN 4 WHEN 'Python' THEN 3 ELSE 2 END
  FROM users u, skills s WHERE u.email = 'sneha.rajan@student.demo.capstonehub.app'
    AND s.skill_name IN ('Deep Learning','Computer Vision','Python','NLP')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'React' THEN 4 WHEN 'Node.js' THEN 4 WHEN 'MongoDB' THEN 3 ELSE 2 END
  FROM users u, skills s WHERE u.email = 'karthick.pandi@student.demo.capstonehub.app'
    AND s.skill_name IN ('React','Node.js','MongoDB','UI/UX Design')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'React' THEN 4 WHEN 'Spring Boot' THEN 4 WHEN 'PostgreSQL' THEN 3 ELSE 2 END
  FROM users u, skills s WHERE u.email = 'divya.priya@student.demo.capstonehub.app'
    AND s.skill_name IN ('React','Spring Boot','PostgreSQL','Docker')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'Power Systems' THEN 4 WHEN 'MATLAB' THEN 3 ELSE 2 END
  FROM users u, skills s WHERE u.email = 'sanjay.murugan@student.demo.capstonehub.app'
    AND s.skill_name IN ('Power Systems','MATLAB','IoT','PLC / SCADA')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level)
SELECT u.id, s.id, CASE s.skill_name WHEN 'Bioinformatics' THEN 4 WHEN 'Python' THEN 3 ELSE 1 END
  FROM users u, skills s WHERE u.email = 'lakshana.devi@student.demo.capstonehub.app'
    AND s.skill_name IN ('Bioinformatics','Python','Data Science','Genetic Engineering')
ON CONFLICT (user_id, skill_id) DO NOTHING;


-- =============================================================================
-- 6. DEMO PROJECTS (production-relevant problem statements)
-- =============================================================================
INSERT INTO projects (title, description, domain, tech_stack, max_team_size, posted_by, status, is_industry_proposed, upvote_count, created_at, updated_at)
SELECT 'Smart Agriculture Monitoring System',
  'Design an IoT-based agriculture system that monitors soil moisture, temperature, humidity, and sunlight using sensor nodes. Sends real-time alerts via mobile app with a web dashboard for analytics.',
  'IoT', 'Arduino, ESP8266, React Native, Node.js, MongoDB', 4,
  u.id, 'APPROVED', false, 24, NOW(), NOW()
FROM users u WHERE u.email = 'admin@capstonehub.app' ON CONFLICT DO NOTHING;

INSERT INTO projects (title, description, domain, tech_stack, max_team_size, posted_by, status, is_industry_proposed, upvote_count, created_at, updated_at)
SELECT 'AI-Powered Crop Disease Detection',
  'Deep learning model that identifies crop diseases from smartphone photos. Works offline, supports regional language voice instructions, integrates with agri-market APIs for treatment recommendations.',
  'AI/ML', 'Python, TensorFlow, React Native, FastAPI, MongoDB', 5,
  u.id, 'APPROVED', false, 31, NOW(), NOW()
FROM users u WHERE u.email = 'admin@capstonehub.app' ON CONFLICT DO NOTHING;

INSERT INTO projects (title, description, domain, tech_stack, max_team_size, posted_by, status, is_industry_proposed, upvote_count, created_at, updated_at)
SELECT 'Real-Time Supply Chain Transparency Platform',
  'Blockchain-based platform to track goods from manufacturer to consumer with QR code scanning, tamper-proof audit trails, and supplier dashboards.',
  'Blockchain', 'Ethereum, Solidity, React, Node.js, PostgreSQL', 4,
  u.id, 'APPROVED', true, 22, NOW(), NOW()
FROM users u WHERE u.email = 'partner@technova.com' ON CONFLICT DO NOTHING;

INSERT INTO projects (title, description, domain, tech_stack, max_team_size, posted_by, status, is_industry_proposed, upvote_count, created_at, updated_at)
SELECT 'Autonomous Campus Navigation Robot',
  'Autonomous robot capable of navigating a college campus, avoiding obstacles, and delivering documents between departments using SLAM mapping and ROS control.',
  'Robotics', 'ROS, Python, OpenCV, Raspberry Pi, Arduino, 3D Printing', 5,
  u.id, 'APPROVED', false, 18, NOW(), NOW()
FROM users u WHERE u.email = 'admin@capstonehub.app' ON CONFLICT DO NOTHING;

INSERT INTO projects (title, description, domain, tech_stack, max_team_size, posted_by, status, is_industry_proposed, upvote_count, created_at, updated_at)
SELECT 'Predictive Maintenance for Industrial Machinery',
  'Data analytics platform using vibration sensor data and ML to predict machinery failures. Includes anomaly detection, maintenance scheduling, and downtime cost analysis dashboards.',
  'Data Science', 'Python, TensorFlow, React, PostgreSQL, Docker', 4,
  u.id, 'APPROVED', true, 16, NOW(), NOW()
FROM users u WHERE u.email = 'partner@technova.com' ON CONFLICT DO NOTHING;

INSERT INTO projects (title, description, domain, tech_stack, max_team_size, posted_by, status, is_industry_proposed, upvote_count, created_at, updated_at)
SELECT 'Bioinformatics Platform for Genomic Research',
  'Web-based platform for researchers to upload genomic sequences, run BLAST searches, visualize phylogenetic trees, and predict protein structures.',
  'Biotechnology', 'Python, Biopython, React, FastAPI, PostgreSQL', 4,
  u.id, 'APPROVED', false, 12, NOW(), NOW()
FROM users u WHERE u.email = 'admin@capstonehub.app' ON CONFLICT DO NOTHING;

INSERT INTO projects (title, description, domain, tech_stack, max_team_size, posted_by, status, is_industry_proposed, upvote_count, created_at, updated_at)
SELECT 'Smart Campus Energy Monitoring System',
  'IoT-based energy monitoring system for college campus buildings. Tracks electricity usage in real-time across departments, detects abnormal consumption, and recommends cost reduction strategies.',
  'IoT', 'Arduino, Raspberry Pi, React, Node.js, PostgreSQL', 4,
  u.id, 'APPROVED', false, 19, NOW(), NOW()
FROM users u WHERE u.email = 'admin@capstonehub.app' ON CONFLICT DO NOTHING;

-- =============================================================================
-- QUICK REFERENCE
-- =============================================================================
-- Admin    : admin@capstonehub.app                        | Admin@123
-- Faculty  : firstname.lastname@demo.capstonehub.app      | Faculty@123
-- Students : firstname.lastname@student.demo.capstonehub.app | Student@123
-- Industry : partner@technova.com                         | Faculty@123
--
-- TO MIGRATE TO YOUR COLLEGE DOMAIN (run after seeding):
--   UPDATE users SET email = REPLACE(email, '@demo.capstonehub.app', '@yourcollege.edu')
--   WHERE role = 'FACULTY';
--   UPDATE users SET email = REPLACE(email, '@student.demo.capstonehub.app', '@student.yourcollege.edu')
--   WHERE role = 'STUDENT';
-- =============================================================================
