import { useState, useEffect } from 'react';
import {
  Table,
  Paper,
  TextInput,
  ActionIcon,
  Group,
  Text,
  Badge,
  Stack,
  Button,
  Modal,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Search, Edit, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { scrapeCountryForPlayer } from '../lib/tournamentImporter';
import { COMMON_COUNTRIES } from '../lib/countries';

interface Player {
  id: string;
  wespa_id: number;
  name: string;
  country: string | null;
  created_at: string;
}

export function PlayerManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editCountry, setEditCountry] = useState('');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [bulkScraping, setBulkScraping] = useState(false);

  // Use centralized country list
  const commonCountries = COMMON_COUNTRIES;

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredPlayers(
        players.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.wespa_id.toString().includes(searchTerm)
        )
      );
    } else {
      setFilteredPlayers(players);
    }
  }, [searchTerm, players]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
      setFilteredPlayers(data || []);
    } catch (error) {
      console.error('Failed to load players:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load players',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCountry = (player: Player) => {
    setSelectedPlayer(player);
    setEditCountry(player.country || '');
    setEditModalOpen(true);
  };

  const handleSaveCountry = async () => {
    if (!selectedPlayer) return;

    try {
      const { error } = await supabase
        .from('players')
        .update({ country: editCountry || null })
        .eq('id', selectedPlayer.id);

      if (error) throw error;

      // Update the local state immediately
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === selectedPlayer.id
            ? { ...p, country: editCountry || null }
            : p
        )
      );

      notifications.show({
        title: 'Success',
        message: 'Country updated successfully',
        color: 'green',
      });

      setEditModalOpen(false);
      setSelectedPlayer(null);
      setEditCountry('');
    } catch (error) {
      console.error('Failed to update country:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update country',
        color: 'red',
      });
    }
  };

  const handleRefreshCountry = async (player: Player) => {
    setRefreshing(player.id);
    try {
      const country = await scrapeCountryForPlayer(player.wespa_id);

      if (country) {
        const { error } = await supabase
          .from('players')
          .update({ country })
          .eq('id', player.id);

        if (error) throw error;

        // Update the local state immediately
        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === player.id
              ? { ...p, country }
              : p
          )
        );

        notifications.show({
          title: 'Success',
          message: `Updated ${player.name} with country: ${country}`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'No Country Found',
          message: `Could not extract country for ${player.name}`,
          color: 'yellow',
        });
      }
    } catch (error) {
      console.error('Failed to refresh country:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to refresh country',
        color: 'red',
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleBulkScrape = async () => {
    setBulkScraping(true);
    try {
      const playersToScrape = players.filter(p => !p.country).slice(0, 20); // Limit to 20 players

      if (playersToScrape.length === 0) {
        notifications.show({
          title: 'No Players to Scrape',
          message: 'All players already have country data',
          color: 'blue',
        });
        return;
      }

      let scraped = 0;
      let failed = 0;

      for (const player of playersToScrape) {
        try {
          // Rate limiting - 2 seconds between requests
          if (scraped > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          const country = await scrapeCountryForPlayer(player.wespa_id);

          if (country) {
            const { error } = await supabase
              .from('players')
              .update({ country })
              .eq('id', player.id);

            if (!error) {
              scraped++;
              console.log(`Updated ${player.name} with country: ${country}`);

              // Update the local state immediately to show in UI
              setPlayers(prevPlayers =>
                prevPlayers.map(p =>
                  p.id === player.id
                    ? { ...p, country }
                    : p
                )
              );
            } else {
              failed++;
              console.error(`Failed to update ${player.name}:`, error);
            }
          } else {
            console.log(`No country found for ${player.name}`);
          }
        } catch (error) {
          failed++;
          console.error(`Error scraping ${player.name}:`, error);
        }
      }

      notifications.show({
        title: 'Bulk Scrape Complete',
        message: `Successfully scraped ${scraped} countries, ${failed} failed`,
        color: scraped > 0 ? 'green' : 'yellow',
      });
    } catch (error) {
      console.error('Bulk scrape failed:', error);
      notifications.show({
        title: 'Error',
        message: 'Bulk country scraping failed',
        color: 'red',
      });
    } finally {
      setBulkScraping(false);
    }
  };

  if (loading) {
    return (
      <Paper p="xl" ta="center">
        <Loader size="lg" />
        <Text mt="md">Loading players...</Text>
      </Paper>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Text size="lg" fw={500}>
            Players ({players.length} total, {players.filter(p => !p.country).length} missing country)
          </Text>
          {players.filter(p => !p.country).length > 0 && (
            <Button
              size="sm"
              variant="light"
              color="blue"
              loading={bulkScraping}
              onClick={handleBulkScrape}
              leftSection={<RefreshCw size={14} />}
            >
              Scrape Missing Countries ({Math.min(20, players.filter(p => !p.country).length)})
            </Button>
          )}
        </Group>
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
          w={300}
        />
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>WESPA ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Country</Table.Th>
              <Table.Th w={150}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPlayers.map((player) => (
              <Table.Tr key={player.id}>
                <Table.Td>
                  <Text size="sm" c="dimmed">{player.wespa_id}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={500}>{player.name}</Text>
                </Table.Td>
                <Table.Td>
                  {player.country ? (
                    <Badge variant="light" color="blue">
                      {player.country}
                    </Badge>
                  ) : (
                    <Badge variant="light" color="gray">
                      No country
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="light"
                      onClick={() => handleEditCountry(player)}
                    >
                      <Edit size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="blue"
                      loading={refreshing === player.id}
                      onClick={() => handleRefreshCountry(player)}
                    >
                      <RefreshCw size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Edit Country Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Country - ${selectedPlayer?.name}`}
        size="sm"
      >
        <Stack>
          <TextInput
            label="Country"
            placeholder="Enter country name"
            value={editCountry}
            onChange={(e) => setEditCountry(e.currentTarget.value)}
            list="country-suggestions"
          />
          <datalist id="country-suggestions">
            {commonCountries.map(country => (
              <option key={country} value={country} />
            ))}
          </datalist>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCountry}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}