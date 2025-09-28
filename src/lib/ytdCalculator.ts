import { supabase } from './supabase';

export async function calculateYTDStandings(
  yearConfigId: string
): Promise<{ success: boolean; message: string; playerCount?: number; tournamentCount?: number; missingTournaments?: any[] }> {
  try {
    // Call the Supabase Edge Function (cached-only version)
    const { data, error } = await supabase.functions.invoke('calculate-ytd-cached', {
      body: { yearConfigId },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Failed to calculate YTD standings:', error);
    return {
      success: false,
      message: error.message || 'Failed to calculate YTD standings',
    };
  }
}