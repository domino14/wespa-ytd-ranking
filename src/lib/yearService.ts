import { supabase } from './supabase';
import type { YearConfig, YTDStanding } from '../types';

export async function getAvailableYears(): Promise<YearConfig[]> {
  const { data, error } = await supabase
    .from('year_configs')
    .select('*')
    .order('year', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch available years');
  }

  return data || [];
}

export async function getActiveYear(): Promise<YearConfig | null> {
  const { data, error } = await supabase
    .from('year_configs')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    // If no active year, return the most recent year
    const years = await getAvailableYears();
    return years.length > 0 ? years[0] : null;
  }

  return data;
}

export async function getStandingsForYear(yearConfigId: string): Promise<YTDStanding[]> {
  const { data, error } = await supabase
    .from('ytd_standings')
    .select('*')
    .eq('year_config_id', yearConfigId)
    .order('total_points', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch standings for year');
  }

  return data || [];
}