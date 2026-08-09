-- =============================================================================
-- CapstoneHub: Complete Database Reset & Clean Script
-- Deletes all mock/duplicate data across all tables with CASCADE.
-- Leaves the database clean so you can create real accounts from scratch.
-- =============================================================================

TRUNCATE TABLE 
    evaluations,
    submissions,
    certificates,
    events,
    messages,
    notifications,
    milestones,
    mentorships,
    team_members,
    teams,
    projects,
    user_skills,
    student_profiles,
    faculty_profiles,
    users
CASCADE;

-- Re-insert primary System Admin account (Password: Admin@123)
INSERT INTO users (name, email, password_hash, role, department, is_active, is_verified, created_at, updated_at)
VALUES (
  'System Admin',
  'admin@capstonehub.app',
  '$2a$12$kS1u2Hh3kJ4R5m8v9nP0QuELFOBmHkA5fGrZiJ1pYoT8cWxbDsN2.',
  'ADMIN', 
  'Administration', 
  true, 
  true,
  NOW(), 
  NOW()
) ON CONFLICT (email) DO NOTHING;
