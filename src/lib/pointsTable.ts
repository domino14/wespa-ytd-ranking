import type { PointsTable, TournamentCategory } from '../types';
import { supabase } from './supabase';

let cachedPointsTable: PointsTable[] | null = null;

export async function getPointsTable(): Promise<PointsTable[]> {
  if (cachedPointsTable) {
    return cachedPointsTable;
  }

  const { data, error } = await supabase
    .from('points_config')
    .select('*')
    .order('id');

  if (error || !data || data.length === 0) {
    throw new Error('Failed to load points configuration from database');
  }

  cachedPointsTable = data;
  return data;
}

export function clearPointsCache() {
  cachedPointsTable = null;
}

export async function getPointsForPosition(
  position: number,
  category: TournamentCategory
): Promise<number> {
  const pointsTable = await getPointsTable();

  for (const row of pointsTable) {
    const range = row.position_range;

    if (range === '100+' && position > 100) {
      return row[category];
    }

    if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      if (position >= min && position <= max) {
        return row[category];
      }
    } else {
      const exactPosition = Number(range);
      if (position === exactPosition) {
        return row[category];
      }
    }
  }

  return 0;
}

// Default points table for initial database seeding
export const defaultPointsTable: PointsTable[] = [
  { position_range: '1', platinum: 10000, gold: 8000, silver: 6000, bronze: 4000, invitational: 6500 },
  { position_range: '2', platinum: 8500, gold: 7000, silver: 5000, bronze: 3500, invitational: 5750 },
  { position_range: '3', platinum: 7500, gold: 6000, silver: 4250, bronze: 3000, invitational: 5000 },
  { position_range: '4', platinum: 6500, gold: 5250, silver: 3750, bronze: 2750, invitational: 4500 },
  { position_range: '5', platinum: 6000, gold: 4500, silver: 3250, bronze: 2250, invitational: 4000 },
  { position_range: '6-10', platinum: 5000, gold: 4000, silver: 3000, bronze: 2000, invitational: 3500 },
  { position_range: '11-15', platinum: 4500, gold: 3500, silver: 2500, bronze: 1500, invitational: 3000 },
  { position_range: '16-20', platinum: 4000, gold: 3000, silver: 2000, bronze: 1250, invitational: 2250 },
  { position_range: '21-25', platinum: 3750, gold: 2750, silver: 1750, bronze: 1000, invitational: 2000 },
  { position_range: '26-30', platinum: 3000, gold: 2000, silver: 1250, bronze: 750, invitational: 1500 },
  { position_range: '31-35', platinum: 2500, gold: 1500, silver: 1000, bronze: 500, invitational: 1250 },
  { position_range: '36-40', platinum: 2000, gold: 1250, silver: 750, bronze: 350, invitational: 1000 },
  { position_range: '41-45', platinum: 1500, gold: 1000, silver: 600, bronze: 300, invitational: 750 },
  { position_range: '46-50', platinum: 1000, gold: 750, silver: 500, bronze: 350, invitational: 600 },
  { position_range: '51-55', platinum: 750, gold: 600, silver: 450, bronze: 300, invitational: 500 },
  { position_range: '56-60', platinum: 700, gold: 650, silver: 400, bronze: 325, invitational: 450 },
  { position_range: '61-65', platinum: 650, gold: 600, silver: 375, bronze: 300, invitational: 425 },
  { position_range: '66-70', platinum: 600, gold: 575, silver: 350, bronze: 275, invitational: 400 },
  { position_range: '71-75', platinum: 575, gold: 550, silver: 325, bronze: 250, invitational: 375 },
  { position_range: '76-80', platinum: 550, gold: 525, silver: 300, bronze: 225, invitational: 350 },
  { position_range: '81-85', platinum: 525, gold: 500, silver: 275, bronze: 200, invitational: 325 },
  { position_range: '86-90', platinum: 500, gold: 475, silver: 250, bronze: 175, invitational: 300 },
  { position_range: '91-95', platinum: 475, gold: 450, silver: 225, bronze: 150, invitational: 275 },
  { position_range: '96-100', platinum: 450, gold: 425, silver: 200, bronze: 125, invitational: 250 },
  { position_range: '100+', platinum: 425, gold: 400, silver: 175, bronze: 100, invitational: 225 },
];