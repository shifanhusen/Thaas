-- Table for storing Digu Game Sessions
CREATE TABLE IF NOT EXISTS digu_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(10) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    winner_id VARCHAR(255),
    winner_name VARCHAR(255),
    total_rounds INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'finished'
);

-- Table for storing Player Stats per Game
CREATE TABLE IF NOT EXISTS digu_game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES digu_games(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    is_bot BOOLEAN DEFAULT FALSE,
    final_total_score INT DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE
);

-- Table for storing Round History
CREATE TABLE IF NOT EXISTS digu_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES digu_games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    winner_id VARCHAR(255),
    winner_name VARCHAR(255),
    scores JSONB, -- Stores scores for this round: { "playerId": score, ... }
    end_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_digu_games_winner ON digu_games(winner_id);
CREATE INDEX IF NOT EXISTS idx_digu_players_player ON digu_game_players(player_id);
