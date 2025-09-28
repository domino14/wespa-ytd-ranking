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
  ActionIcon,
  Progress,
  Modal,
  Alert,
  Tooltip,
  Indicator,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Save, RefreshCw, Download, Database, Info, AlertCircle, CheckCircle } from 'lucide-react';
import type { Tournament, TournamentCategory } from '../types';
import { fetchTournaments } from '../lib/api';
import { supabase } from '../lib/supabase';
import { importAllMissingResults } from '../lib/tournamentImporter';
import type { ImportProgress } from '../lib/tournamentImporter';

interface TournamentListProps {
  startYear: string;
  endYear: string;
  onComputeYTD: () => void;
}

const categoryColors: Record<TournamentCategory, string> = {
  platinum: 'violet',
  gold: 'yellow',
  silver: 'gray',
  bronze: 'orange',
  invitational: 'blue',
};

export function TournamentList({ startYear, endYear, onComputeYTD }: TournamentListProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categories, setCategories] = useState<Record<number, TournamentCategory | undefined>>({});
  const [cachedStatus, setCachedStatus] = useState<Record<string, boolean>>({});
  const [missingCount, setMissingCount] = useState(0);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      // Fetch from WESPA - try 2024 if 2025 has no data
      console.log('Searching for tournaments:', startYear, endYear);
      const wespaData = await fetchTournaments(startYear, endYear);

      // Fetch existing data from Supabase
      const { data: existingTournaments } = await supabase
        .from('tournaments')
        .select('*')
        .gte('date', `${startYear}-01-01`)
        .lte('date', `${endYear}-12-31`);

      // Merge data
      const mergedTournaments = wespaData.map(t => {
        const existing = existingTournaments?.find(e => e.wespa_id === t.wespa_id);
        return {
          ...t,
          id: existing?.id || crypto.randomUUID(),
          category: existing?.category,
        } as Tournament;
      });

      setTournaments(mergedTournaments);

      // Set categories
      const cats: Record<number, TournamentCategory | undefined> = {};
      mergedTournaments.forEach(t => {
        if (t.category) {
          cats[t.wespa_id] = t.category;
        }
      });
      setCategories(cats);

      // Check cache status for tagged tournaments
      await checkCacheStatus(mergedTournaments.filter(t => t.category));
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load tournaments',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed automatic loading - tournaments are only loaded when "Refresh" is clicked

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
      // Prepare tournaments to save (only tagged ones)
      const tournamentsToSave = tournaments
        .filter(t => categories[t.wespa_id])
        .map(t => ({
          id: t.id,
          wespa_id: t.wespa_id,
          name: t.name,
          date: t.date,
          category: categories[t.wespa_id],
          url: t.url,
        }));

      // Upsert to Supabase
      const { error } = await supabase
        .from('tournaments')
        .upsert(tournamentsToSave, { onConflict: 'wespa_id' });

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Tournaments saved successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save tournaments',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
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
  const cachedCount = Object.values(cachedStatus).filter(Boolean).length;

  return (
    <Stack>
      {/* Workflow Guidance */}
      {taggedCount > 0 && missingCount > 0 && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Action Required: Import Tournament Results"
          color="yellow"
          variant="light"
        >
          <Text size="sm">
            <strong>Step 1:</strong> {missingCount} tagged tournament(s) need their results imported before calculating YTD standings.
            <br />
            <strong>Step 2:</strong> After importing, click "Save & Compute YTD" to generate standings.
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
            <strong>Step 2:</strong> Import tournament results from WESPA
            <br />
            <strong>Step 3:</strong> Calculate YTD standings
          </Text>
        </Alert>
      )}

      <Group justify="space-between">
        <Group>
          <Text size="lg" fw={500}>
            Found {tournaments.length} tournaments
          </Text>
          {taggedCount > 0 && (
            <Badge color="blue" variant="light">
              {taggedCount} tagged
            </Badge>
          )}
          {cachedCount > 0 && (
            <Badge color="green" variant="light">
              {cachedCount} cached
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
            onClick={loadTournaments}
          >
            Refresh
          </Button>

          <Tooltip
            label={
              taggedCount === 0
                ? "Tag tournaments first"
                : missingCount === 0
                ? "All results already cached"
                : `Import results for ${missingCount} tournament(s)`
            }
          >
            <div>
              <Indicator
                disabled={missingCount === 0}
                color="yellow"
                size={10}
                offset={7}
              >
                <Button
                  leftSection={<Download size={16} />}
                  variant="light"
                  color="blue"
                  onClick={handleImportResults}
                  loading={importing}
                  disabled={taggedCount === 0}
                >
                  Import Results
                </Button>
              </Indicator>
            </div>
          </Tooltip>

          <Button
            leftSection={<Save size={16} />}
            onClick={handleSave}
            loading={saving}
          >
            Save Tags
          </Button>

          <Tooltip
            label={
              taggedCount === 0
                ? "Tag tournaments first"
                : missingCount > 0
                ? "Import tournament results first"
                : "Calculate YTD standings"
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
                  disabled={taggedCount === 0}
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
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((tournament) => (
              <Table.Tr key={tournament.wespa_id}>
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
            ))}
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