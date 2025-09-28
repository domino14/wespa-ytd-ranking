export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Route: /api/tournaments - Fetch tournament list
    if (url.pathname === '/api/tournaments' && request.method === 'POST') {
      try {
        const body = await request.json() as {
          startyear: string;
          endyear: string;
          state?: string;
          partname?: string;
        };

        const formData = new FormData();
        formData.append('startyear', body.startyear);
        formData.append('endyear', body.endyear);
        formData.append('state', body.state || 'all');  // Default to 'all' like the form
        formData.append('partname', body.partname || '');

        // Debug: log what we're sending
        console.log('Form data being sent:', {
          startyear: body.startyear,
          endyear: body.endyear,
          state: body.state,
          partname: body.partname
        });

        const response = await fetch('https://wespa.org/aardvark/cgi-bin/find_tournament.pl', {
          method: 'POST',
          body: formData,
        });

        const html = await response.text();

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch tournaments' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Route: /api/tournament/:id - Fetch tournament results
    if (url.pathname.startsWith('/api/tournament/') && request.method === 'GET') {
      const tournamentId = url.pathname.split('/').pop();

      try {
        const response = await fetch(`https://wespa.org/aardvark/html/tournaments/${tournamentId}.html`);
        const html = await response.text();

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch tournament results' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Route: /api/years - Get available years
    if (url.pathname === '/api/years' && request.method === 'GET') {
      try {
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/year_configs?select=*&order=year.desc`, {
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Supabase error: ${response.status}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch years',
          message: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Route: /api/standings/:yearId - Get standings for a specific year
    if (url.pathname.startsWith('/api/standings/') && request.method === 'GET') {
      try {
        const pathParts = url.pathname.split('/');
        const yearId = pathParts[3]; // /api/standings/{yearId}

        if (!yearId) {
          return new Response(JSON.stringify({ error: 'Year ID is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        // Handle special "current" endpoint
        let queryUrl: string;
        if (yearId === 'current') {
          // First get the active year config
          const yearResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/year_configs?select=id&is_active=eq.true&limit=1`, {
            headers: {
              'apikey': env.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          if (!yearResponse.ok) {
            throw new Error(`Failed to fetch active year: ${yearResponse.status}`);
          }

          const yearData = await yearResponse.json();
          if (!yearData || yearData.length === 0) {
            return new Response(JSON.stringify({ error: 'No active year configured' }), {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }

          const activeYearId = yearData[0].id;
          queryUrl = `${env.SUPABASE_URL}/rest/v1/ytd_standings?select=player_name,total_points,tournaments_played,best_finish,last_updated&year_config_id=eq.${activeYearId}&order=total_points.desc`;
        } else {
          // Direct year ID query
          queryUrl = `${env.SUPABASE_URL}/rest/v1/ytd_standings?select=player_name,total_points,tournaments_played,best_finish,last_updated&year_config_id=eq.${yearId}&order=total_points.desc`;
        }

        const response = await fetch(queryUrl, {
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Supabase error: ${response.status}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=180', // Cache for 3 minutes
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch standings',
          message: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};