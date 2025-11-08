export type TournamentCategory = 'platinum' | 'gold' | 'silver' | 'bronze' | 'invitational';

export interface Tournament {
  id: string;
  wespa_id: number;
  name: string;
  date: string;
  category?: TournamentCategory;
  url: string;
  created_at?: string;
  updated_at?: string;
}

export interface Player {
  id: string;
  wespa_id: number;
  name: string;
  country?: string;
  created_at?: string;
}

export interface TournamentResult {
  id: string;
  tournament_id: string;
  player_id: string;
  position: number;
  total_players: number;
  wins: number;
  losses: number;
  byes: number;
  spread: number;
  old_rating?: number;
  new_rating?: number;
  rating_change?: number;
  created_at?: string;
}

export interface YTDStanding {
  id?: string;
  year_config_id: string;
  player_id: string;
  player_name: string;
  player_country?: string;
  total_points: number;
  tournaments_played: number;
  best_finish: number;
  last_updated: string;
  wespa_id?: number;
}

export interface PointsTable {
  id?: string;
  position_range: string;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  invitational: number;
  created_at?: string;
}

export interface YearConfig {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}