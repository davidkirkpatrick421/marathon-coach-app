ALTER TABLE activities ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE activities
SET name = raw_data->>'name'
WHERE name IS NULL AND raw_data IS NOT NULL;
