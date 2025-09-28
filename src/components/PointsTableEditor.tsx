import { useState, useEffect } from 'react';
import {
  Table,
  NumberInput,
  Button,
  Group,
  Stack,
  Paper,
  Title,
  Text,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Save, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PointsTable } from '../types';
import { clearPointsCache, defaultPointsTable } from '../lib/pointsTable';

export function PointsTableEditor() {
  const [pointsTable, setPointsTable] = useState<PointsTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPointsTable();
  }, []);

  const sortPointsTable = (data: PointsTable[]) => {
    return [...data].sort((a, b) => {
      const parsePosition = (range: string) => {
        if (range === '100+') return 101; // Put 100+ at the end
        if (range.includes('-')) {
          return parseInt(range.split('-')[0]); // Use the first number for ranges
        }
        return parseInt(range); // Single numbers
      };

      return parsePosition(a.position_range) - parsePosition(b.position_range);
    });
  };

  const loadPointsTable = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('points_config')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        setPointsTable(sortPointsTable(data));
      } else {
        // If no data exists, use default table
        setPointsTable(defaultPointsTable);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load points configuration',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePointChange = (
    index: number,
    category: 'platinum' | 'gold' | 'silver' | 'bronze' | 'invitational',
    value: number
  ) => {
    const newTable = [...pointsTable];
    newTable[index] = {
      ...newTable[index],
      [category]: value,
    };
    setPointsTable(newTable);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing entries
      await supabase
        .from('points_config')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      // Insert new entries
      const { error } = await supabase
        .from('points_config')
        .insert(
          pointsTable.map((row, index) => ({
            position_range: row.position_range,
            platinum: row.platinum,
            gold: row.gold,
            silver: row.silver,
            bronze: row.bronze,
            invitational: row.invitational,
          }))
        );

      if (error) throw error;

      // Clear the cache so next calculations use the new values
      clearPointsCache();

      notifications.show({
        title: 'Success',
        message: 'Points table saved successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save points table',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setPointsTable(defaultPointsTable);
    setHasChanges(true);
    notifications.show({
      title: 'Reset',
      message: 'Points table reset to default values. Click Save to apply.',
      color: 'blue',
    });
  };

  if (loading) {
    return <Text>Loading points configuration...</Text>;
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Points Configuration</Title>
        <Group>
          <Button
            leftSection={<RotateCcw size={16} />}
            variant="light"
            onClick={handleReset}
          >
            Reset to Default
          </Button>
          <Button
            leftSection={<Save size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Group>
      </Group>

      {hasChanges && (
        <Alert color="yellow">
          You have unsaved changes. Click Save to apply them.
        </Alert>
      )}

      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Position</Table.Th>
              <Table.Th>Platinum</Table.Th>
              <Table.Th>Gold</Table.Th>
              <Table.Th>Silver</Table.Th>
              <Table.Th>Bronze</Table.Th>
              <Table.Th>Invitational</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pointsTable.map((row, index) => (
              <Table.Tr key={row.position_range}>
                <Table.Td fw={500}>{row.position_range}</Table.Td>
                <Table.Td>
                  <NumberInput
                    value={row.platinum}
                    onChange={(value) => handlePointChange(index, 'platinum', value as number)}
                    min={0}
                    step={25}
                    w={100}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={row.gold}
                    onChange={(value) => handlePointChange(index, 'gold', value as number)}
                    min={0}
                    step={25}
                    w={100}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={row.silver}
                    onChange={(value) => handlePointChange(index, 'silver', value as number)}
                    min={0}
                    step={25}
                    w={100}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={row.bronze}
                    onChange={(value) => handlePointChange(index, 'bronze', value as number)}
                    min={0}
                    step={25}
                    w={100}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={row.invitational}
                    onChange={(value) => handlePointChange(index, 'invitational', value as number)}
                    min={0}
                    step={25}
                    w={100}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}