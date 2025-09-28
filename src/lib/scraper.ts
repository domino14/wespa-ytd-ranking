import type { Tournament, TournamentResult } from '../types';

export function parseTournamentListHTML(html: string): Omit<Tournament, 'id' | 'category'>[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tournaments: Omit<Tournament, 'id' | 'category'>[] = [];

  console.log('HTML length:', html.length);

  // Look for tournament data patterns in the HTML
  const tournamentMatches = html.match(/tournament/gi) || [];
  console.log('Found "tournament" mentions:', tournamentMatches.length);

  // Look for table patterns
  const tableMatches = html.match(/<table[^>]*>/gi) || [];
  console.log('Found tables:', tableMatches.length);

  // Look for links to tournament pages
  const linkMatches = html.match(/href="[^"]*\.html"/gi) || [];
  console.log('Found .html links:', linkMatches.length);

  // Show some of the actual HTML content around tournaments
  const tourneyIndex = html.toLowerCase().indexOf('tournament');
  if (tourneyIndex > -1) {
    console.log('HTML around first "tournament":', html.substring(tourneyIndex - 200, tourneyIndex + 500));
  }

  // Find all tournament rows - try different selectors
  let rows = doc.querySelectorAll('tr.roweven, tr.rowodd');
  console.log('Found tournament rows (roweven/rowodd):', rows.length);

  if (rows.length === 0) {
    // Try any table rows
    rows = doc.querySelectorAll('tr');
    console.log('Found all table rows:', rows.length);

    // Show all rows to debug
    const dataRows: Element[] = [];
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      const thCells = row.querySelectorAll('th');
      console.log(`Row ${index}: ${cells.length} td cells, ${thCells.length} th cells`);
      if (cells.length > 0) {
        console.log(`  TD content:`, Array.from(cells).map(c => c.textContent?.trim()).slice(0, 5));
      }
      if (thCells.length > 0) {
        console.log(`  TH content:`, Array.from(thCells).map(c => c.textContent?.trim()).slice(0, 5));
      }
      if (cells.length >= 3) {
        dataRows.push(row);
      }
    });
    rows = dataRows as any;
  }

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      const dateCell = cells[1];
      const linkCell = cells[2].querySelector('a');

      if (dateCell && linkCell) {
        const href = linkCell.getAttribute('href');
        const wespaId = href ? parseInt(href.match(/\/(\d+)\.html$/)?.[1] || '0') : 0;

        tournaments.push({
          wespa_id: wespaId,
          name: linkCell.textContent?.trim() || '',
          date: dateCell.textContent?.trim() || '',
          url: `https://wespa.org${href}`,
        });
      }
    }
  });

  return tournaments;
}

export interface TournamentResultWithPlayer extends Omit<TournamentResult, 'id' | 'player_id'> {
  player_wespa_id: number;
  player_name: string;
}

export function parseTournamentResultsHTML(html: string, tournamentId: string): TournamentResultWithPlayer[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const results: TournamentResultWithPlayer[] = [];

  // Find all result rows
  const rows = doc.querySelectorAll('tr.roweven, tr.rowodd');

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 10) {
      // Parse position (e.g., "5 of 38")
      const positionText = cells[1]?.textContent?.trim() || '';
      const positionMatch = positionText.match(/(\d+)\s+of\s+(\d+)/);

      if (positionMatch) {
        const position = parseInt(positionMatch[1]);
        const totalPlayers = parseInt(positionMatch[2]);

        // Get player link
        const playerLink = cells[3]?.querySelector('a');
        const playerHref = playerLink?.getAttribute('href');
        const playerWespaId = playerHref ? parseInt(playerHref.match(/\/(\d+)\.html$/)?.[1] || '0') : 0;
        const playerName = playerLink?.textContent?.trim() || '';

        // Get game stats
        const wins = parseInt(cells[4]?.textContent?.trim() || '0');
        const losses = parseInt(cells[5]?.textContent?.trim() || '0');
        const byes = parseInt(cells[6]?.textContent?.trim() || '0');
        const spread = parseInt(cells[7]?.textContent?.trim() || '0');

        // Get ratings
        const oldRating = cells[8] ? parseInt(cells[8].textContent?.trim() || '0') : undefined;
        const newRating = cells[9] ? parseInt(cells[9].textContent?.trim() || '0') : undefined;
        const ratingChange = cells[10] ? parseInt(cells[10].textContent?.trim() || '0') : undefined;

        results.push({
          tournament_id: tournamentId,
          position,
          total_players: totalPlayers,
          wins,
          losses,
          byes,
          spread,
          old_rating: oldRating,
          new_rating: newRating,
          rating_change: ratingChange,
          player_wespa_id: playerWespaId,
          player_name: playerName,
        });
      }
    }
  });

  return results;
}

export function extractPlayerFromResult(row: HTMLElement): { wespaId: number; name: string } | null {
  const playerLink = row.querySelector('td:nth-child(4) a');
  if (!playerLink) return null;

  const href = playerLink.getAttribute('href');
  const wespaId = href ? parseInt(href.match(/\/(\d+)\.html$/)?.[1] || '0') : 0;
  const name = playerLink.textContent?.trim() || '';

  return { wespaId, name };
}