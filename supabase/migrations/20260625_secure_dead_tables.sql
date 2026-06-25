-- Enable RLS on dead tables that are completely unused in the codebase
-- This is safe because:
-- 1. A full codebase audit confirmed zero reads, inserts, or updates to these tables from both client and server.
-- 2. No policies are created, which means the default behavior is to DENY ALL operations to any anon or authenticated user.
-- 3. Only service_role and postgres superuser bypass RLS.
-- Therefore, this guarantees zero impact on production while securing the tables against unauthorized access.

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_verifications ENABLE ROW LEVEL SECURITY;
