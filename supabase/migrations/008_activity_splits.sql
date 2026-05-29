-- Add dedicated splits column so trends tool can read split data without loading full raw_data
ALTER TABLE activities ADD COLUMN IF NOT EXISTS splits JSONB;
