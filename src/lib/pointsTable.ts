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

    if (range === '101+' && position >= 101) {
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
  { position_range: '2', platinum: 9000, gold: 7200, silver: 5400, bronze: 3600, invitational: 5850 },
  { position_range: '3', platinum: 8000, gold: 6400, silver: 4800, bronze: 3200, invitational: 5200 },
  { position_range: '4', platinum: 7000, gold: 5600, silver: 4200, bronze: 2800, invitational: 4600 },
  { position_range: '5', platinum: 6000, gold: 4800, silver: 3600, bronze: 2400, invitational: 4000 },
  { position_range: '6-10', platinum: 5000, gold: 4000, silver: 3000, bronze: 2000, invitational: 3500 },
  { position_range: '11-15', platinum: 4500, gold: 3600, silver: 2700, bronze: 1800, invitational: 3100 },
  { position_range: '16-20', platinum: 4000, gold: 3200, silver: 2400, bronze: 1600, invitational: 2700 },
  { position_range: '21-25', platinum: 3500, gold: 2800, silver: 2100, bronze: 1400, invitational: 2300 },
  { position_range: '26-30', platinum: 3000, gold: 2400, silver: 1800, bronze: 1200, invitational: 1900 },
  { position_range: '31-35', platinum: 2500, gold: 2000, silver: 1500, bronze: 1000, invitational: 1600 },
  { position_range: '36-40', platinum: 2000, gold: 1600, silver: 1200, bronze: 800, invitational: 1300 },
  { position_range: '41-45', platinum: 1600, gold: 1300, silver: 1000, bronze: 650, invitational: 1050 },
  { position_range: '46-50', platinum: 1300, gold: 1050, silver: 800, bronze: 500, invitational: 850 },
  { position_range: '51-55', platinum: 1100, gold: 900, silver: 675, bronze: 450, invitational: 725 },
  { position_range: '56-60', platinum: 950, gold: 775, silver: 575, bronze: 375, invitational: 625 },
  { position_range: '61-65', platinum: 850, gold: 700, silver: 525, bronze: 350, invitational: 550 },
  { position_range: '66-70', platinum: 750, gold: 625, silver: 475, bronze: 325, invitational: 500 },
  { position_range: '71-75', platinum: 675, gold: 575, silver: 425, bronze: 300, invitational: 450 },
  { position_range: '76-80', platinum: 600, gold: 525, silver: 375, bronze: 275, invitational: 400 },
  { position_range: '81-85', platinum: 525, gold: 450, silver: 325, bronze: 225, invitational: 350 },
  { position_range: '86-90', platinum: 450, gold: 400, silver: 300, bronze: 200, invitational: 300 },
  { position_range: '91-95', platinum: 400, gold: 350, silver: 250, bronze: 175, invitational: 275 },
  { position_range: '96-100', platinum: 350, gold: 300, silver: 225, bronze: 150, invitational: 250 },
  { position_range: '101+', platinum: 300, gold: 250, silver: 200, bronze: 125, invitational: 225 },
];