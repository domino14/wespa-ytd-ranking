import { supabase } from './supabase';
import { fetchTournamentResults } from './api';

export interface ImportProgress {
  current: number;
  total: number;
  tournamentName: string;
  status: 'importing' | 'success' | 'error' | 'skipped';
}

export async function importTournamentResults(
  tournamentId: string,
  wespaId: number,
  tournamentName: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<boolean> {
  try {
    // Check if already imported
    const { data: existingResults } = await supabase
      .from('tournament_results')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1);

    if (existingResults && existingResults.length > 0) {
      onProgress?.({
        current: 1,
        total: 1,
        tournamentName,
        status: 'skipped'
      });
      return true; // Already imported
    }

    onProgress?.({
      current: 0,
      total: 1,
      tournamentName,
      status: 'importing'
    });

    // Fetch from WESPA via CF Worker
    const wespaResults = await fetchTournamentResults(wespaId);

    // Collect unique players
    const uniquePlayers = new Map<number, string>();
    for (const result of wespaResults) {
      if (result.player_wespa_id && result.player_name) {
        uniquePlayers.set(result.player_wespa_id, result.player_name);
      }
    }

    // Batch upsert players
    if (uniquePlayers.size > 0) {
      const playersToUpsert = Array.from(uniquePlayers.entries()).map(([wespaId, name]) => ({
        wespa_id: wespaId,
        name: name,
      }));

      const { error: playerError } = await supabase
        .from('players')
        .upsert(playersToUpsert, {
          onConflict: 'wespa_id',
          ignoreDuplicates: false
        })
        .select();

      if (playerError) {
        throw new Error('Failed to save players');
      }

      // Get all player IDs
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, wespa_id')
        .in('wespa_id', Array.from(uniquePlayers.keys()));

      const playerIdMap = new Map<number, string>();
      if (allPlayers) {
        for (const player of allPlayers) {
          playerIdMap.set(player.wespa_id, player.id);
        }
      }

      // Prepare tournament results
      const resultInserts = [];
      for (const result of wespaResults) {
        const playerId = playerIdMap.get(result.player_wespa_id);
        if (playerId) {
          const { player_wespa_id, player_name, tournament_id, ...resultData } = result;
          resultInserts.push({
            tournament_id: tournamentId,
            player_id: playerId,
            ...resultData,
          });
        }
      }

      // Batch insert results
      if (resultInserts.length > 0) {
        const { error: resultsError } = await supabase
          .from('tournament_results')
          .insert(resultInserts);

        if (resultsError) {
          throw new Error('Failed to save tournament results');
        }
      }
    }

    onProgress?.({
      current: 1,
      total: 1,
      tournamentName,
      status: 'success'
    });

    return true;
  } catch (error) {
    console.error(`Failed to import ${tournamentName}:`, error);

    onProgress?.({
      current: 1,
      total: 1,
      tournamentName,
      status: 'error'
    });

    return false;
  }
}

export async function importAllMissingResults(
  tournaments: Array<{ id: string; wespa_id: number; name: string }>,
  onProgress?: (progress: ImportProgress) => void
): Promise<{ imported: number; skipped: number; failed: number }> {
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];

    const success = await importTournamentResults(
      tournament.id,
      tournament.wespa_id,
      tournament.name,
      (progress) => {
        onProgress?.({
          ...progress,
          current: i + 1,
          total: tournaments.length
        });
      }
    );

    if (success) {
      const { data } = await supabase
        .from('tournament_results')
        .select('id')
        .eq('tournament_id', tournament.id)
        .limit(1);

      if (data && data.length > 0) {
        imported++;
      } else {
        skipped++;
      }
    } else {
      failed++;
    }
  }

  return { imported, skipped, failed };
}