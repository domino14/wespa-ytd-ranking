import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Table,
  Paper,
  Text,
  Group,
  Badge,
  Loader,
  Stack,
  TextInput,
  ActionIcon,
  Select,
  Button,
} from '@mantine/core';
import { Search, Trophy, X, Calendar, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { YTDStanding, YearConfig } from '../types';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function Standings() {
  const [standings, setStandings] = useState<YTDStanding[]>([]);
  const [filteredStandings, setFilteredStandings] = useState<YTDStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [yearConfigs, setYearConfigs] = useState<YearConfig[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    loadYearConfigs();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadStandings();
    }
  }, [selectedYear]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredStandings(
        standings.filter(s =>
          s.player_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredStandings(standings);
    }
  }, [searchTerm, standings]);

  const loadYearConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('year_configs')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setYearConfigs(data);
        // Default to active year or most recent year
        const activeYear = data.find(y => y.is_active) || data[0];
        setSelectedYear(activeYear.id);
      } else {
        // No year configs found - stop loading
        setYearConfigs([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load year configurations:', error);
      setLoading(false);
    }
  };

  const loadStandings = async () => {
    if (!selectedYear) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ytd_standings')
        .select('*')
        .eq('year_config_id', selectedYear)
        .order('total_points', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setStandings(data);
        setFilteredStandings(data);
        setLastUpdated(data[0].last_updated);
      } else {
        setStandings([]);
        setFilteredStandings([]);
        setLastUpdated(null);
      }
    } catch (error) {
      console.error('Failed to load standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge color="yellow" leftSection={<Trophy size={14} />} size="md" style={{ minWidth: '60px' }}>1st</Badge>;
    if (rank === 2) return <Badge color="gray" size="md" style={{ minWidth: '50px' }}>2nd</Badge>;
    if (rank === 3) return <Badge color="orange" size="md" style={{ minWidth: '50px' }}>3rd</Badge>;
    if (rank <= 10) return <Badge color="blue" size="md" style={{ minWidth: '70px' }}>Top 10</Badge>;
    if (rank <= 20) return <Badge color="cyan" size="md" style={{ minWidth: '70px' }}>Top 20</Badge>;
    return null;
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Paper p="xl" ta="center">
          <Loader size="lg" />
          <Text mt="md">Loading standings...</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack>
        <Group justify="space-between">
          <div>
            <Title order={1}>WESPA Year-to-Date Rankings</Title>
            {lastUpdated && (
              <Text size="sm" c="dimmed" mt="xs">
                Last updated: {format(new Date(lastUpdated), 'PPP')}
              </Text>
            )}
          </div>
          <Group>
            <Button
              component={Link}
              to="/admin"
              leftSection={<Settings size={16} />}
              variant="light"
              color="gray"
            >
              Admin
            </Button>
            <Select
              leftSection={<Calendar size={16} />}
              placeholder="Select Year"
              value={selectedYear}
              onChange={setSelectedYear}
              data={yearConfigs.map(config => ({
                value: config.id,
                label: `${config.name} (${config.start_date} to ${config.end_date})`,
              }))}
              w={300}
            />
            <TextInput
              placeholder="Search players..."
              leftSection={<Search size={16} />}
              rightSection={
                searchTerm && (
                  <ActionIcon size="sm" variant="subtle" onClick={() => setSearchTerm('')}>
                    <X size={14} />
                  </ActionIcon>
                )
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              w={250}
            />
          </Group>
        </Group>

        {filteredStandings.length === 0 ? (
          <Paper p="xl" ta="center">
            <Text size="lg" c="dimmed">
              {searchTerm ? 'No players found matching your search' : 'No standings available yet'}
            </Text>
          </Paper>
        ) : (
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={140}>Rank</Table.Th>
                  <Table.Th w={200}>Player</Table.Th>
                  <Table.Th ta="center">Tournaments</Table.Th>
                  <Table.Th ta="center">Best Finish</Table.Th>
                  <Table.Th ta="right">Total Points</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredStandings.map((standing, index) => (
                  <Table.Tr key={standing.player_id}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap" align="center">
                        <Text fw={500}>{index + 1}</Text>
                        {getRankBadge(index + 1)}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{standing.player_name}</Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Badge variant="light">{standing.tournaments_played}</Badge>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Badge
                        variant="filled"
                        color={standing.best_finish === 1 ? 'yellow' : 'blue'}
                      >
                        {standing.best_finish === 1 ? '🏆 1st' : `${standing.best_finish}${getOrdinalSuffix(standing.best_finish)}`}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text fw={700} size="lg">
                        {standing.total_points.toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}