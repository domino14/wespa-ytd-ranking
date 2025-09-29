-- Create tables for WESPA YTD Ranking System

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wespa_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wespa_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT CHECK (category IN ('platinum', 'gold', 'silver', 'bronze', 'invitational')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament results table
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  total_players INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  byes INTEGER NOT NULL,
  spread INTEGER NOT NULL,
  old_rating INTEGER,
  new_rating INTEGER,
  rating_change INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- Year configuration table
CREATE TABLE year_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- YTD standings cache table
CREATE TABLE ytd_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_config_id UUID REFERENCES year_configs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  total_points INTEGER NOT NULL,
  tournaments_played INTEGER NOT NULL,
  best_finish INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year_config_id, player_id)
);

-- Points table configuration
CREATE TABLE points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_range TEXT NOT NULL,
  platinum INTEGER NOT NULL,
  gold INTEGER NOT NULL,
  silver INTEGER NOT NULL,
  bronze INTEGER NOT NULL,
  invitational INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default points configuration
INSERT INTO points_config (position_range, platinum, gold, silver, bronze, invitational) VALUES
('1', 10000, 8000, 6000, 4000, 6500),
('2', 9000, 7200, 5400, 3600, 5850),
('3', 8000, 6400, 4800, 3200, 5200),
('4', 7000, 5600, 4200, 2800, 4600),
('5', 6000, 4800, 3600, 2400, 4000),
('6-10', 5000, 4000, 3000, 2000, 3500),
('11-15', 4500, 3600, 2700, 1800, 3100),
('16-20', 4000, 3200, 2400, 1600, 2700),
('21-25', 3500, 2800, 2100, 1400, 2300),
('26-30', 3000, 2400, 1800, 1200, 1900),
('31-35', 2500, 2000, 1500, 1000, 1600),
('36-40', 2000, 1600, 1200, 800, 1300),
('41-45', 1600, 1300, 1000, 650, 1050),
('46-50', 1300, 1050, 800, 500, 850),
('51-55', 1100, 900, 675, 450, 725),
('56-60', 950, 775, 575, 375, 625),
('61-65', 850, 700, 525, 350, 550),
('66-70', 750, 625, 475, 325, 500),
('71-75', 675, 575, 425, 300, 450),
('76-80', 600, 525, 375, 275, 400),
('81-85', 525, 450, 325, 225, 350),
('86-90', 450, 400, 300, 200, 300),
('91-95', 400, 350, 250, 175, 275),
('96-100', 350, 300, 225, 150, 250),
('100+', 300, 250, 200, 125, 225);

-- Create indexes for performance
CREATE INDEX idx_tournaments_date ON tournaments(date);
CREATE INDEX idx_tournaments_category ON tournaments(category);
CREATE INDEX idx_tournament_results_tournament_id ON tournament_results(tournament_id);
CREATE INDEX idx_tournament_results_player_id ON tournament_results(player_id);
CREATE INDEX idx_ytd_standings_year_config ON ytd_standings(year_config_id);
CREATE INDEX idx_ytd_standings_total_points ON ytd_standings(year_config_id, total_points DESC);
CREATE INDEX idx_year_configs_active ON year_configs(is_active);
CREATE INDEX idx_year_configs_year ON year_configs(year);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ytd_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ytd_standings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON year_configs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON points_config FOR SELECT USING (true);

-- Create policies for authenticated write access
CREATE POLICY "Authenticated write access" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON tournaments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON tournament_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON ytd_standings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON year_configs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON points_config FOR ALL USING (auth.role() = 'authenticated');