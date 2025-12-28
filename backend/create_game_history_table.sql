-- Migration: Create game_history table
-- Run this in pgAdmin 4

CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(10) NOT NULL,
    game_type VARCHAR(50) NOT NULL DEFAULT 'bondi',
    players JSONB NOT NULL,
    game_log JSONB,
    total_rounds INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    game_status VARCHAR(20) NOT NULL DEFAULT 'finished'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_history_room_id ON game_history(room_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON game_history(game_type);

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_history'
ORDER BY ordinal_position;
