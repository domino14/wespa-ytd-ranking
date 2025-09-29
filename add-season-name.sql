-- Add name column to year_configs table to support custom season names
ALTER TABLE year_configs ADD COLUMN name TEXT;

-- Make name column required and unique
ALTER TABLE year_configs ALTER COLUMN name SET NOT NULL;
ALTER TABLE year_configs ADD CONSTRAINT year_configs_name_unique UNIQUE (name);

-- Drop the year column as we're now using name instead
ALTER TABLE year_configs DROP COLUMN year;