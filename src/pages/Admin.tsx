import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  Stack,
  Alert,
  Tabs,
  Text,
  Badge,
  TextInput,
  ActionIcon,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { LogOut, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TournamentList } from '../components/TournamentList';
import { PointsTableEditor } from '../components/PointsTableEditor';
import { PlayerManager } from '../components/PlayerManager';
import { calculateYTDStandings } from '../lib/ytdCalculator';
import type { YearConfig } from '../types';

export function Admin() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [activeYear, setActiveYear] = useState<YearConfig | null>(null);
  const [yearConfigs, setYearConfigs] = useState<YearConfig[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<YearConfig | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadYearConfigs();
  }, []);

  const checkAuth = async () => {
    try {
      const { checkAdminAccess } = await import('../lib/auth');
      const admin = await checkAdminAccess();

      if (!admin) {
        navigate('/login');
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  };

  const loadYearConfigs = async () => {
    const { data } = await supabase
      .from('year_configs')
      .select('*')
      .order('start_date', { ascending: false });

    console.log('Year configs loaded:', data);

    if (data) {
      setYearConfigs(data);
      const active = data.find(y => y.is_active);
      console.log('Active year config:', active);
      if (active) {
        setActiveYear(active);
        setStartDate(active.start_date);
        setEndDate(active.end_date);
        setSeasonName(active.name);
      } else {
        // Set default dates for new season (Oct 1 - Sep 30)
        const currentYear = new Date().getFullYear();
        setStartDate(`${currentYear}-10-01`);
        setEndDate(`${currentYear + 1}-09-30`);
        setSeasonName(`${currentYear}-${currentYear + 1}`);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleComputeYTD = async () => {
    if (!activeYear) {
      notifications.show({
        title: 'Error',
        message: 'Please configure an active year first',
        color: 'red',
      });
      return;
    }

    try {
      const result = await calculateYTDStandings(activeYear.id);

      if (result.success) {
        notifications.show({
          title: 'YTD Calculation Complete!',
          message: (
            <div>
              <div>{result.message || `YTD standings computed successfully for ${result.playerCount} players`}</div>
              <Button
                size="xs"
                variant="white"
                mt="xs"
                onClick={() => navigate('/')}
              >
                View Rankings →
              </Button>
            </div>
          ),
          color: 'green',
          autoClose: 8000, // Give more time to read and click
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to compute YTD standings',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to compute YTD standings',
        color: 'red',
      });
    }
  };

  const handleSaveYearConfig = async () => {
    if (!startDate || !endDate || !seasonName) {
      notifications.show({
        title: 'Error',
        message: 'Please fill in all fields',
        color: 'red',
      });
      return;
    }

    const yearConfig: Omit<YearConfig, 'id' | 'created_at' | 'updated_at'> = {
      name: seasonName, // Store the custom season name
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    };

    // Deactivate other configs
    await supabase
      .from('year_configs')
      .update({ is_active: false })
      .eq('is_active', true);

    // Insert new config
    const { data, error } = await supabase
      .from('year_configs')
      .upsert(yearConfig, { onConflict: 'name' })
      .select()
      .single();

    if (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save year configuration',
        color: 'red',
      });
    } else {
      setActiveYear(data);
      notifications.show({
        title: 'Success',
        message: 'Year configuration saved',
        color: 'green',
      });
      loadYearConfigs();
    }
  };

  const handleDeleteYear = async (yearConfig: YearConfig) => {
    setYearToDelete(yearConfig);
    setDeleteModalOpen(true);
  };

  const confirmDeleteYear = async () => {
    if (!yearToDelete) return;

    try {
      // Delete YTD standings first
      const { error: standingsError } = await supabase
        .from('ytd_standings')
        .delete()
        .eq('year_config_id', yearToDelete.id);

      if (standingsError) throw standingsError;

      // Delete tournament results for tournaments in this year
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id')
        .gte('date', yearToDelete.start_date)
        .lte('date', yearToDelete.end_date);

      if (tournaments && tournaments.length > 0) {
        const { error: resultsError } = await supabase
          .from('tournament_results')
          .delete()
          .in('tournament_id', tournaments.map(t => t.id));

        if (resultsError) throw resultsError;

        // Delete tournaments
        const { error: tournamentsError } = await supabase
          .from('tournaments')
          .delete()
          .gte('date', yearToDelete.start_date)
          .lte('date', yearToDelete.end_date);

        if (tournamentsError) throw tournamentsError;
      }

      // Finally delete the year config
      const { error: yearError } = await supabase
        .from('year_configs')
        .delete()
        .eq('id', yearToDelete.id);

      if (yearError) throw yearError;

      notifications.show({
        title: 'Success',
        message: `Season ${yearToDelete.name} deleted successfully`,
        color: 'green',
      });

      // If we deleted the active year, clear it
      if (activeYear?.id === yearToDelete.id) {
        setActiveYear(null);
      }

      loadYearConfigs();
    } catch (error) {
      console.error('Failed to delete year:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete season',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setYearToDelete(null);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>WESPA YTD Admin</Title>
        <Button
          leftSection={<LogOut size={16} />}
          variant="light"
          color="red"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Group>

      <Tabs defaultValue="tournaments">
        <Tabs.List>
          <Tabs.Tab value="tournaments">Tournaments</Tabs.Tab>
          <Tabs.Tab value="players">Players</Tabs.Tab>
          <Tabs.Tab value="points">Points Table</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="tournaments" pt="xl">
          <Stack>
            <Paper p="md" withBorder>
              <Stack>
                <Title order={4}>Create New Season</Title>
                <Group>
                  <TextInput
                    label="Season Name"
                    placeholder="e.g. 2025-2026"
                    value={seasonName}
                    onChange={(e) => setSeasonName(e.currentTarget.value)}
                    w={150}
                  />
                  <TextInput
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.currentTarget.value)}
                    w={150}
                  />
                  <TextInput
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.currentTarget.value)}
                    w={150}
                  />
                  <Button
                    leftSection={<Plus size={16} />}
                    onClick={handleSaveYearConfig}
                    mt="xl"
                    color="green"
                  >
                    Create Season
                  </Button>
                </Group>
                {activeYear && (
                  <Alert color="blue" mt="md">
                    Active season: {activeYear.name} ({activeYear.start_date} to {activeYear.end_date})
                  </Alert>
                )}
              </Stack>
            </Paper>

            {activeYear && (
              <TournamentList
                startDate={activeYear.start_date}
                endDate={activeYear.end_date}
                onComputeYTD={handleComputeYTD}
              />
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="players" pt="xl">
          <PlayerManager />
        </Tabs.Panel>

        <Tabs.Panel value="points" pt="xl">
          <PointsTableEditor />
        </Tabs.Panel>

        <Tabs.Panel value="settings" pt="xl">
          <Paper p="lg" withBorder>
            <Title order={3} mb="md">Year Configurations</Title>
            <Stack>
              {yearConfigs.map(config => (
                <Paper key={config.id} p="md" withBorder bg={config.is_active ? 'blue.0' : undefined}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{config.name}</Text>
                      <Text size="sm" c="dimmed">
                        {config.start_date} to {config.end_date}
                      </Text>
                    </div>
                    <Group>
                      {config.is_active && (
                        <Badge color="blue">Active</Badge>
                      )}
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleDeleteYear(config)}
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Delete Year Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Season"
        size="md"
      >
        <Stack>
          <Text>
            Are you sure you want to delete the {yearToDelete?.name} season?
          </Text>
          <Text size="sm" c="dimmed">
            This will permanently delete:
          </Text>
          <Text size="sm" c="dimmed" ml="md">
            • All tournaments in this season ({yearToDelete?.start_date} to {yearToDelete?.end_date})
            <br />
            • All tournament results for these tournaments
            <br />
            • All YTD standings for this season
          </Text>
          <Text size="sm" c="red" fw={500}>
            This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDeleteYear}>
              Delete Season
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}