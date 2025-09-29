-- Migration: Add country column to players table
-- Run this on existing databases to add country support

ALTER TABLE players ADD COLUMN IF NOT EXISTS country TEXT;

-- Add index for country queries (optional for performance)
CREATE INDEX IF NOT EXISTS idx_players_country ON players(country);