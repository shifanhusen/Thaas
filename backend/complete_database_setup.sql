-- Complete Database Setup for Thaas Card Game
-- Run this entire script in pgAdmin 4
-- Database: cardgame

-- ============================================
-- TABLE 1: users (for authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- ============================================
-- TABLE 2: game_history (for game records)
-- ============================================
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    "roomId" VARCHAR(10) NOT NULL,
    "gameType" VARCHAR(50) NOT NULL DEFAULT 'bondi',
    players JSONB NOT NULL,
    "gameLog" JSONB,
    "totalRounds" INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "gameStatus" VARCHAR(20) NOT NULL DEFAULT 'finished'
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_history_room_id ON game_history("roomId");
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON game_history("gameType");

-- ============================================
-- VERIFY TABLES
-- ============================================
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user', 'game_history')
ORDER BY table_name;

-- View user table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user'
ORDER BY ordinal_position;

-- View game_history table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'game_history'
ORDER BY ordinal_position;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment below to insert test data

-- INSERT INTO "user" (email, password, username) VALUES
-- ('test@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'TestUser');

-- INSERT INTO game_history ("roomId", "gameType", players, "gameLog", "totalRounds", duration, "gameStatus")
-- VALUES (
--     'TEST01',
--     'bondi',
--     '[{"id":"1","name":"Player1","finishPosition":1},{"id":"2","name":"Player2","finishPosition":2}]'::jsonb,
--     '["Game started","Player1 played A♠","Game Over"]'::jsonb,
--     13,
--     300,
--     'finished'
-- );

-- ============================================
-- CHECK CURRENT DATA
-- ============================================
SELECT COUNT(*) as user_count FROM "user";
SELECT COUNT(*) as game_history_count FROM game_history;
