import { useState, useEffect } from 'react';
import {
  Table,
  Badge,
  Button,
  Select,
  Group,
  Stack,
  Text,
  Loader,
  Paper,
  Progress,
  Modal,
  Alert,
  Tooltip,
  Indicator,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Save, RefreshCw, Download, Database, Info, CheckCircle } from 'lucide-react';
import type { Tournament, TournamentCategory } from '../types';
import { fetchTournaments } from '../lib/api';
import { supabase } from '../lib/supabase';
import { importAllMissingResults } from '../lib/tournamentImporter';
import type { ImportProgress } from '../lib/tournamentImporter';

interface TournamentListProps {
  startDate: string;
  endDate: string;
  onComputeYTD: () => void;
}

const categoryColors: Record<TournamentCategory, string> = {
  platinum: 'violet',
  gold: 'yellow',
  silver: 'gray',
  bronze: 'orange',
  invitational: 'blue',
};

export function TournamentList({ startDate, endDate, onComputeYTD }: TournamentListProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categories, setCategories] = useState<Record<number, TournamentCategory | undefined>>({});
  const [cachedStatus, setCachedStatus] = useState<Record<string, boolean>>({});
  const [missingCount, setMissingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Helper function to check if tournament is within season range
  const isWithinSeasonRange = (tournamentDate: string) => {
    return tournamentDate >= startDate && tournamentDate <= endDate;
  };

  // Load tournaments from database immediately
  const loadFromDatabase = async () => {
    setLoading(true);
    try {
      // Fetch existing data from Supabase only - include all tournaments from the year range
      const startYear = startDate.split('-')[0];
      const endYear = endDate.split('-')[0];
      const { data: existingTournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .gte('date', `${startYear}-01-01`)
        .lte('date', `${endYear}-12-31`)
        .order('date', { ascending: false });

      if (error) throw error;

      if (existingTournaments && existingTournaments.length > 0) {
        setTournaments(existingTournaments);

        // Set categories from database
        const cats: Record<number, TournamentCategory | undefined> = {};
        existingTournaments.forEach(t => {
          if (t.category) {
            cats[t.wespa_id] = t.category;
          }
        });
        setCategories(cats);

        // Check cache status for tagged tournaments
        await checkCacheStatus(existingTournaments.filter(t => t.category));
      }
    } catch (error) {
      console.error('Failed to load tournaments from database:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync with WESPA to get latest tournaments
  const syncWithWESPA = async () => {
    setSyncing(true);
    try {
      // Extract year range from dates for WESPA API
      const startYear = startDate.split('-')[0];
      const endYear = endDate.split('-')[0];

      console.log('Syncing with WESPA:', startYear, endYear, `(${startDate} to ${endDate})`);
      const wespaData = await fetchTournaments(startYear, endYear);

      // Fetch existing data from Supabase for merging (include all tournaments from the year range)
      const { data: existingTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .gte('date', `${startYear}-01-01`)
        .lte('date', `${endYear}-12-31`);

      // Merge data - WESPA data is authoritative for tournament existence
      const mergedTournaments = wespaData.map(t => {
        const existing = existingTournaments?.find(e => e.wespa_id === t.wespa_id);
        return {
          ...t,
          id: existing?.id || crypto.randomUUID(),
          category: existing?.category,
        } as Tournament;
      });

      setTournaments(mergedTournaments);

      // Update categories
      const cats: Record<number, TournamentCategory | undefined> = {};
      mergedTournaments.forEach(t => {
        if (t.category) {
          cats[t.wespa_id] = t.category;
        }
      });
      setCategories(cats);

      // Check cache status for tagged tournaments
      await checkCacheStatus(mergedTournaments.filter(t => t.category));

      // Update sync time
      setLastSyncTime(new Date());

      notifications.show({
        title: 'Sync Complete',
        message: `Found ${mergedTournaments.length} tournaments from WESPA`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Sync Failed',
        message: 'Failed to sync with WESPA. Using cached data.',
        color: 'yellow',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Load on mount: first from DB (instant), then sync with WESPA (background)
  useEffect(() => {
    loadFromDatabase();
    // Small delay to let DB data show first
    const syncTimer = setTimeout(() => {
      syncWithWESPA();
    }, 500);

    return () => clearTimeout(syncTimer);
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkCacheStatus = async (taggedTournaments: Tournament[]) => {
    if (taggedTournaments.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('tournament_results')
        .select('tournament_id')
        .in('tournament_id', taggedTournaments.map(t => t.id));

      if (!error && data) {
        const cached: Record<string, boolean> = {};
        let missing = 0;

        taggedTournaments.forEach(tournament => {
          const hasResults = data.some(d => d.tournament_id === tournament.id);
          cached[tournament.id] = hasResults;
          if (!hasResults) missing++;
        });

        setCachedStatus(cached);
        setMissingCount(missing);
      }
    } catch (error) {
      console.error('Failed to check cache status:', error);
    }
  };

  const handleCategoryChange = (wespaId: number, category: TournamentCategory | '') => {
    setCategories(prev => {
      const newCategories = {
        ...prev,
        [wespaId]: category === '' ? undefined : category,
      };

      // Recheck cache status for tagged tournaments
      const taggedTournaments = tournaments.filter(t =>
        newCategories[t.wespa_id] || t.id === tournaments.find(tour => tour.wespa_id === wespaId)?.id
      );
      setTimeout(() => checkCacheStatus(taggedTournaments), 100);

      return newCategories;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get all tournaments that have changes (tagged or untagged)
      const changedTournaments = tournaments.filter(t => {
        const currentCategory = categories[t.wespa_id];
        const dbCategory = t.category;
        // Include if category has changed (including null changes)
        return currentCategory !== dbCategory || t.wespa_id in categories;
      });

      // Prepare tournaments to save
      const tournamentsToSave = changedTournaments.map(t => ({
        id: t.id,
        wespa_id: t.wespa_id,
        name: t.name,
        date: t.date,
        category: categories[t.wespa_id] || null, // Explicitly set null for untagged
        url: t.url,
      }));

      // Find tournaments that are being untagged (currently have null category but exist in categories state)
      const untaggedTournamentIds = changedTournaments
        .filter(t => categories[t.wespa_id] === undefined && t.category !== null)
        .map(t => t.id);

      // Delete results for untagged tournaments first
      if (untaggedTournamentIds.length > 0) {
        console.log('Deleting results for untagged tournaments:', untaggedTournamentIds);
        const { error: deleteError } = await supabase
          .from('tournament_results')
          .delete()
          .in('tournament_id', untaggedTournamentIds);

        if (deleteError) {
          console.error('Failed to delete results for untagged tournaments:', deleteError);
        }
      }

      // Upsert tournaments to Supabase
      if (tournamentsToSave.length > 0) {
        const { error } = await supabase
          .from('tournaments')
          .upsert(tournamentsToSave, { onConflict: 'wespa_id' });

        if (error) throw error;
      }

      // Update local tournament state to reflect saved changes
      const updatedTournaments = tournaments.map(t => {
        if (t.wespa_id in categories) {
          return { ...t, category: categories[t.wespa_id] || undefined };
        }
        return t;
      });
      setTournaments(updatedTournaments);

      // Clear untagged entries from categories state
      const cleanedCategories = { ...categories };
      Object.keys(cleanedCategories).forEach(key => {
        if (cleanedCategories[parseInt(key)] === undefined) {
          delete cleanedCategories[parseInt(key)];
        }
      });
      setCategories(cleanedCategories);

      notifications.show({
        title: 'Success',
        message: 'Tournaments saved successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Save error:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save tournaments',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndImport = async () => {
    // First save all tag changes (including deleting results for untagged)
    await handleSave();

    // Then import results for tagged tournaments
    await handleImportResults();
  };

  const handleSaveAndCompute = async () => {
    await handleSave();
    onComputeYTD();
  };

  const handleImportResults = async () => {
    setShowImportModal(true);
    setImporting(true);

    // Get only tagged tournaments
    const taggedTournaments = tournaments
      .filter(t => categories[t.wespa_id])
      .map(t => ({
        id: t.id,
        wespa_id: t.wespa_id,
        name: t.name,
      }));

    if (taggedTournaments.length === 0) {
      notifications.show({
        title: 'No Tagged Tournaments',
        message: 'Please tag tournaments before importing results',
        color: 'yellow',
      });
      setImporting(false);
      setShowImportModal(false);
      return;
    }

    const result = await importAllMissingResults(
      taggedTournaments,
      (progress) => setImportProgress(progress)
    );

    setImporting(false);

    notifications.show({
      title: 'Import Complete',
      message: `Imported: ${result.imported}, Skipped: ${result.skipped}, Failed: ${result.failed}`,
      color: result.failed > 0 ? 'yellow' : 'green',
    });

    // Refresh cache status after import
    const taggedTournamentsForCache = tournaments.filter(t => categories[t.wespa_id]);
    await checkCacheStatus(taggedTournamentsForCache);

    setTimeout(() => {
      setShowImportModal(false);
      setImportProgress(null);
    }, 2000);
  };

  if (loading) {
    return (
      <Paper p="xl" ta="center">
        <Loader size="lg" />
        <Text mt="md">Loading tournaments...</Text>
      </Paper>
    );
  }

  const taggedCount = Object.values(categories).filter(Boolean).length;

  // Check if there are any changes to save (tagged, untagged, or modified)
  const hasChanges = tournaments.some(t => {
    const currentCategory = categories[t.wespa_id];
    const dbCategory = t.category;
    return currentCategory !== dbCategory || t.wespa_id in categories;
  });

  // Count tournaments within season range
  const tournamentsInRange = tournaments.filter(t => isWithinSeasonRange(t.date));
  const taggedInRangeCount = tournamentsInRange.filter(t => categories[t.wespa_id]).length;

  return (
    <Stack>
      {/* Workflow Guidance */}
      {taggedCount === 0 && (
        <Alert
          icon={<Info size={16} />}
          title="Getting Started"
          color="blue"
          variant="light"
        >
          <Text size="sm">
            <strong>Step 1:</strong> Tag tournaments with their categories (Platinum, Gold, etc.)
            <br />
            <strong>Step 2:</strong> Click "Save Tags & Import" to save and import results
            <br />
            <strong>Step 3:</strong> Click "Compute YTD" to calculate standings
          </Text>
        </Alert>
      )}

      {taggedCount > 0 && missingCount === 0 && (
        <Alert
          icon={<CheckCircle size={16} />}
          title="Ready for YTD Calculation"
          color="green"
          variant="light"
        >
          <Text size="sm">
            All tagged tournaments have cached results. You can now calculate YTD standings.
          </Text>
        </Alert>
      )}

      <Group justify="space-between">
        <Group>
          <Text size="lg" fw={500}>
            Found {tournaments.length} tournaments ({tournamentsInRange.length} in season range)
          </Text>
          {syncing && (
            <Badge color="blue" variant="light">
              Syncing with WESPA...
            </Badge>
          )}
          {lastSyncTime && !syncing && (
            <Badge color="gray" variant="light">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </Badge>
          )}
          {missingCount > 0 && (
            <Badge color="yellow" variant="light">
              {missingCount} need import
            </Badge>
          )}
        </Group>
        <Group>
          <Button
            leftSection={<RefreshCw size={16} />}
            variant="light"
            onClick={syncWithWESPA}
            loading={syncing}
          >
            Sync with WESPA
          </Button>

          <Button
            leftSection={<Save size={16} />}
            onClick={handleSaveAndImport}
            loading={saving || importing}
            disabled={!hasChanges}
            color="blue"
          >
            Save Tags & Import
          </Button>

          <Tooltip
            label={
              taggedInRangeCount === 0
                ? "Tag tournaments within the season range first"
                : missingCount > 0
                ? "Some tournaments need import, but you can still compute YTD with current data"
                : "Calculate YTD standings with current tournament data"
            }
          >
            <div>
              <Indicator
                disabled={missingCount === 0}
                color="red"
                size={10}
                offset={7}
              >
                <Button
                  leftSection={<Database size={16} />}
                  onClick={handleSaveAndCompute}
                  loading={saving}
                  color={missingCount > 0 ? "yellow" : "green"}
                  variant={missingCount > 0 ? "light" : "filled"}
                  disabled={false}
                >
                  {missingCount > 0 ? "Import First!" : "Compute YTD"}
                </Button>
              </Indicator>
            </div>
          </Tooltip>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Tournament</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tournaments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
            .map((tournament) => {
              const isInRange = isWithinSeasonRange(tournament.date);
              return (
                <Table.Tr
                  key={tournament.wespa_id}
                  style={{
                    opacity: isInRange ? 1 : 0.5,
                    backgroundColor: isInRange ? undefined : 'var(--mantine-color-gray-1)'
                  }}
                >
                  <Table.Td>{tournament.date}</Table.Td>
                  <Table.Td>
                    <a
                      href={tournament.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {tournament.name}
                    </a>
                    {!isInRange && (
                      <Badge size="xs" color="gray" variant="light" ml="xs">
                        Outside Season
                      </Badge>
                    )}
                  </Table.Td>
                <Table.Td>
                  <Select
                    value={categories[tournament.wespa_id] || ''}
                    onChange={(value) =>
                      handleCategoryChange(tournament.wespa_id, value as TournamentCategory | '')
                    }
                    data={[
                      { value: '', label: 'Not Tagged' },
                      { value: 'platinum', label: 'Platinum/Majors' },
                      { value: 'gold', label: 'Gold' },
                      { value: 'silver', label: 'Silver' },
                      { value: 'bronze', label: 'Bronze' },
                      { value: 'invitational', label: 'Invitational' },
                    ]}
                    w={180}
                  />
                  {categories[tournament.wespa_id] && (
                    <Badge
                      color={categoryColors[categories[tournament.wespa_id]!]}
                      size="sm"
                      mt="xs"
                    >
                      {categories[tournament.wespa_id]}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  {categories[tournament.wespa_id] ? (
                    cachedStatus[tournament.id] ? (
                      <Tooltip label="Tournament results are cached in database">
                        <Badge color="green" variant="light" leftSection={<CheckCircle size={12} />}>
                          Cached
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Tooltip label="Tournament results need to be imported">
                        <Badge color="yellow" variant="light" leftSection={<Download size={12} />}>
                          Import Needed
                        </Badge>
                      </Tooltip>
                    )
                  ) : (
                    <Badge color="gray" variant="light">
                      Not Tagged
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => window.open(tournament.url, '_blank')}
                  >
                    View Results
                  </Button>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      <Modal
        opened={showImportModal}
        onClose={() => !importing && setShowImportModal(false)}
        title="Importing Tournament Results"
        size="md"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack>
          {importProgress && (
            <>
              <Text size="sm" c="dimmed">
                {importProgress.status === 'importing' && `Importing: ${importProgress.tournamentName}`}
                {importProgress.status === 'skipped' && `Skipped (cached): ${importProgress.tournamentName}`}
                {importProgress.status === 'success' && `Completed: ${importProgress.tournamentName}`}
                {importProgress.status === 'error' && `Failed: ${importProgress.tournamentName}`}
              </Text>
              <Progress
                value={(importProgress.current / importProgress.total) * 100}
                color={importProgress.status === 'error' ? 'red' : 'blue'}
                animated={importing}
              />
              <Text size="xs" ta="center" c="dimmed">
                {importProgress.current} of {importProgress.total} tournaments
              </Text>
            </>
          )}
          {!importing && importProgress && (
            <Button onClick={() => setShowImportModal(false)}>Close</Button>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}