-- Removes duplicate user accounts keeping the one with the lowest ID
-- This script groups by name, role and department, ensuring unique accounts.
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id)
    FROM users
    GROUP BY name, role, department
);
