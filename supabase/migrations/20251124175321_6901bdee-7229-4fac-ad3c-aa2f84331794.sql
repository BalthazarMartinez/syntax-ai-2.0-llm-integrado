-- Add version and status columns to artifacts table
ALTER TABLE artifacts 
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN status TEXT;