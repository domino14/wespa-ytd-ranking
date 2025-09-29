import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PointsTable {
  position_range: string;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  invitational: number;
}

function getPointsForPosition(
  position: number,
  category: string,
  pointsTable: PointsTable[]
): number {
  for (const row of pointsTable) {
    const range = row.position_range;

    if (range === '100+' && position > 100) {
      return row[category as keyof PointsTable] as number;
    }

    if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      if (position >= min && position <= max) {
        return row[category as keyof PointsTable] as number;
      }
    } else {
      const exactPosition = Number(range);
      if (position === exactPosition) {
        return row[category as keyof PointsTable] as number;
      }
    }
  }

  return 0;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { yearConfigId } = await req.json()

    if (!yearConfigId) {
      return new Response(
        JSON.stringify({ error: 'yearConfigId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get year configuration
    const { data: yearConfig, error: yearError } = await supabase
      .from('year_configs')
      .select('*')
      .eq('id', yearConfigId)
      .single()

    if (yearError || !yearConfig) {
      return new Response(
        JSON.stringify({ error: 'Year configuration not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get all tagged tournaments in date range
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .gte('date', yearConfig.start_date)
      .lte('date', yearConfig.end_date)
      .not('category', 'is', null)

    if (tournamentsError || !tournaments) {
      throw new Error('Failed to fetch tournaments')
    }

    // Get points configuration
    const { data: pointsTable, error: pointsError } = await supabase
      .from('points_config')
      .select('*')
      .order('id')

    if (pointsError || !pointsTable || pointsTable.length === 0) {
      throw new Error('Failed to load points configuration')
    }

    // Track player points and missing tournaments
    const playerPoints = new Map()
    const missingTournaments = []

    // Process each tournament
    for (const tournament of tournaments) {
      console.log(`Processing tournament: ${tournament.name}`)

      // Get cached results ONLY - no external fetching
      const { data: results } = await supabase
        .from('tournament_results')
        .select('*, players(*)')
        .eq('tournament_id', tournament.id)

      if (!results || results.length === 0) {
        console.warn(`No cached results for tournament: ${tournament.name}`)
        missingTournaments.push({
          id: tournament.id,
          wespa_id: tournament.wespa_id,
          name: tournament.name
        })
        continue // Skip this tournament
      }

      // Calculate points for each player
      for (const result of results) {
        const points = getPointsForPosition(result.position, tournament.category, pointsTable)
        const playerId = result.player_id
        const playerName = result.players?.name || 'Unknown'

        if (!playerPoints.has(playerId)) {
          playerPoints.set(playerId, {
            player_id: playerId,
            player_name: playerName,
            total_points: 0,
            tournaments_played: 0,
            best_finish: result.position,
            tournaments: [],
          })
        }

        const playerData = playerPoints.get(playerId)
        playerData.total_points += points
        playerData.tournaments_played += 1
        playerData.best_finish = Math.min(playerData.best_finish, result.position)
        playerData.tournaments.push({
          name: tournament.name,
          position: result.position,
          points,
        })
      }
    }

    // Convert to array and sort by points
    const standings = Array.from(playerPoints.values())
      .sort((a, b) => b.total_points - a.total_points)
      .map((standing) => {
        // Remove tournaments array as it's not in the database schema
        const { tournaments, ...standingData } = standing
        return {
          ...standingData,
          year_config_id: yearConfigId,
          last_updated: new Date().toISOString(),
        }
      })

    // Save standings to cache (using transaction-like approach)
    // First, delete existing standings for this year
    const { error: deleteError } = await supabase
      .from('ytd_standings')
      .delete()
      .eq('year_config_id', yearConfigId)

    if (deleteError) {
      throw new Error('Failed to clear existing standings')
    }

    // Then insert new standings
    if (standings.length > 0) {
      const { error: insertError } = await supabase
        .from('ytd_standings')
        .insert(standings)

      if (insertError) {
        throw new Error('Failed to save new standings')
      }
    }

    const response = {
      success: true,
      message: `Successfully calculated YTD standings for ${standings.length} players`,
      playerCount: standings.length,
      tournamentCount: tournaments.length,
      processedCount: tournaments.length - missingTournaments.length,
      missingTournaments: missingTournaments.length > 0 ? missingTournaments : undefined
    }

    if (missingTournaments.length > 0) {
      response.message += `. Note: ${missingTournaments.length} tournament(s) have no cached results and were skipped.`
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in calculate-ytd-cached function:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to calculate YTD standings',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})