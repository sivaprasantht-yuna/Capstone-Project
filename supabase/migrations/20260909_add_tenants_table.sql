-- ====================================================================
-- Migration: 20260909_add_tenants_table.sql
-- Description: Multi-Tenant Institutional Isolation (Model B)
-- Pre-seeded with top Tamil Nadu engineering institutions + default demo
-- ====================================================================

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email_domains TEXT NOT NULL,
    allow_public_showcase BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pre-seed Tamil Nadu Engineering Institutions & Default Tenant
INSERT INTO tenants (id, name, email_domains, allow_public_showcase, is_active) VALUES
    ('INST-BIT',    'Bannari Amman Institute of Technology',          'bitsathy.ac.in',                  TRUE,  TRUE),
    ('INST-PSG',    'PSG College of Technology',                      'psgtech.ac.in',                   FALSE, TRUE),
    ('INST-KEC',    'Kongu Engineering College',                      'kongu.ac.in,kongu.edu',           FALSE, TRUE),
    ('INST-KCT',    'Kumaraguru College of Technology',               'kct.ac.in',                       FALSE, TRUE),
    ('INST-CIT',    'Coimbatore Institute of Technology',             'cit.edu.in',                      FALSE, TRUE),
    ('INST-TCE',    'Thiagarajar College of Engineering',             'tce.edu',                         FALSE, TRUE),
    ('INST-AMRITA', 'Amrita Vishwa Vidyapeetham (Coimbatore)',        'cb.amrita.edu,amrita.edu',        FALSE, TRUE),
    ('INST-SREC',   'Sri Ramakrishna Engineering College',            'srec.ac.in',                      FALSE, TRUE),
    ('INST-001',    'Default Institution (Demo)',                     'gmail.com,outlook.com,yahoo.com', TRUE,  TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email_domains = EXCLUDED.email_domains,
    allow_public_showcase = EXCLUDED.allow_public_showcase,
    is_active = EXCLUDED.is_active;

-- 3. Ensure tenant_id index exists across key isolated tables
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON teams(tenant_id);
