-- Prevent member_count < senior_count corruption
-- member_count counts ALL members (students + seniors + external)
-- senior_count counts only seniors from the owning college
-- Therefore member_count must always be >= senior_count

ALTER TABLE communities
  ADD CONSTRAINT member_count_gte_senior_count
  CHECK (member_count >= senior_count);
