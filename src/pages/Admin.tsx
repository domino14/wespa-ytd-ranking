import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  Stack,
  NumberInput,
  Alert,
  Tabs,
  Text,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { LogOut, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TournamentList } from '../components/TournamentList';
import { PointsTableEditor } from '../components/PointsTableEditor';
import { calculateYTDStandings } from '../lib/ytdCalculator';
import type { YearConfig } from '../types';

export function Admin() {
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [activeYear, setActiveYear] = useState<YearConfig | null>(null);
  const [yearConfigs, setYearConfigs] = useState<YearConfig[]>([]);
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
      .order('year', { ascending: false });

    console.log('Year configs loaded:', data);

    if (data) {
      setYearConfigs(data);
      const active = data.find(y => y.is_active);
      console.log('Active year config:', active);
      if (active) {
        setActiveYear(active);
        setStartYear(parseInt(active.start_date.split('-')[0]));
        setEndYear(parseInt(active.end_date.split('-')[0]));
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
          title: 'Success',
          message: result.message || `YTD standings computed successfully for ${result.playerCount} players`,
          color: 'green',
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
    const yearConfig: Omit<YearConfig, 'id' | 'created_at' | 'updated_at'> = {
      year: startYear,
      start_date: `${startYear}-01-01`,
      end_date: `${endYear}-12-31`,
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
      .upsert(yearConfig, { onConflict: 'year' })
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
          <Tabs.Tab value="points">Points Table</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="tournaments" pt="xl">
          <Stack>
            <Paper p="md" withBorder>
              <Group>
                <NumberInput
                  label="Start Year"
                  value={startYear}
                  onChange={(val) => setStartYear(val as number)}
                  min={2020}
                  max={2030}
                />
                <NumberInput
                  label="End Year"
                  value={endYear}
                  onChange={(val) => setEndYear(val as number)}
                  min={2020}
                  max={2030}
                />
                <Button
                  leftSection={<Calendar size={16} />}
                  onClick={handleSaveYearConfig}
                  mt="xl"
                >
                  Set Active Year
                </Button>
              </Group>
              {activeYear && (
                <Alert color="blue" mt="md">
                  Active year: {activeYear.start_date} to {activeYear.end_date}
                </Alert>
              )}
            </Paper>

            <TournamentList
              startYear={startYear.toString()}
              endYear={endYear.toString()}
              onComputeYTD={handleComputeYTD}
            />
          </Stack>
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
                      <Text fw={500}>Year {config.year}</Text>
                      <Text size="sm" c="dimmed">
                        {config.start_date} to {config.end_date}
                      </Text>
                    </div>
                    {config.is_active && (
                      <Badge color="blue">Active</Badge>
                    )}
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}