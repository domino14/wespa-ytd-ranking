import axios from 'axios';
import { parseTournamentListHTML, parseTournamentResultsHTML } from './scraper';
import type { TournamentResultWithPlayer } from './scraper';
import type { Tournament } from '../types';

// Use local proxy in development, production URL in production
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8787/api'
  : 'https://wespa-proxy.delsolar.workers.dev/api';

export async function fetchTournaments(
  startYear: string,
  endYear: string,
  state?: string,
  partname?: string
): Promise<Omit<Tournament, 'id' | 'category'>[]> {
  const response = await axios.post(`${API_BASE}/tournaments`, {
    startyear: startYear,
    endyear: endYear,
    state: state || '',
    partname: partname || '',
  });

  return parseTournamentListHTML(response.data);
}

export async function fetchTournamentResults(
  tournamentId: number
): Promise<TournamentResultWithPlayer[]> {
  const response = await axios.get(`${API_BASE}/tournament/${tournamentId}`);
  return parseTournamentResultsHTML(response.data, tournamentId.toString());
}

export async function fetchPlayerProfile(wespaId: number): Promise<string> {
  const response = await axios.get(`${API_BASE}/player/${wespaId}`);
  return response.data;
}