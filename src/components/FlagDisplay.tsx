import { useEffect, useState } from 'react';
import { Tooltip, Badge, Text } from '@mantine/core';
import { getCountryFlag, getCountryName } from '../lib/flagUtils';
import { doesBrowserSupportFlagEmojis, getCountryCode } from '../lib/flagDetection';

interface FlagDisplayProps {
  countryCodeOrName: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function FlagDisplay({
  countryCodeOrName,
  size = 'md',
}: FlagDisplayProps) {
  const [supportsFlagEmoji, setSupportsFlagEmoji] = useState<boolean>(true);

  useEffect(() => {
    // Check for flag emoji support on mount
    setSupportsFlagEmoji(doesBrowserSupportFlagEmojis());
  }, []);

  // Get the flag emoji and country name
  const flag = getCountryFlag(countryCodeOrName);
  const countryName = getCountryName(countryCodeOrName);
  const countryCode = getCountryCode(countryName || countryCodeOrName);

  // If no country data, return null
  if (!countryCodeOrName || !countryName) {
    return null;
  }

  // Size mappings for text and badge
  const sizeMap = {
    sm: { fontSize: '1em', badgeSize: 'sm' as const },
    md: { fontSize: '1.2em', badgeSize: 'md' as const },
    lg: { fontSize: '1.5em', badgeSize: 'lg' as const },
  };

  const { fontSize, badgeSize } = sizeMap[size];

  // If browser supports flag emojis and we have a flag, show it with tooltip
  if (supportsFlagEmoji && flag) {
    return (
      <Tooltip label={countryName} withArrow>
        <Text component="span" size="lg" style={{ fontSize, cursor: 'default' }}>
          {flag}
        </Text>
      </Tooltip>
    );
  }

  // Fallback for browsers that don't support flag emojis
  // Show a styled country code badge with tooltip
  return (
    <Tooltip label={countryName} withArrow>
      <Badge
        size={badgeSize}
        variant="light"
        color="blue"
        style={{
          cursor: 'default',
          minWidth: size === 'lg' ? '45px' : size === 'md' ? '38px' : '32px',
          fontWeight: 600,
        }}
      >
        {countryCode}
      </Badge>
    </Tooltip>
  );
}

// Wrapper component for inline flag display (next to player name)
interface InlineFlagDisplayProps extends FlagDisplayProps {
  playerName: string;
}

export function InlineFlagDisplay({
  countryCodeOrName,
  playerName,
  size = 'md',
}: InlineFlagDisplayProps) {
  const [supportsFlagEmoji, setSupportsFlagEmoji] = useState<boolean>(true);

  useEffect(() => {
    setSupportsFlagEmoji(doesBrowserSupportFlagEmojis());
  }, []);

  const flag = getCountryFlag(countryCodeOrName);
  const countryName = getCountryName(countryCodeOrName);

  // If no country, just show the player name
  if (!countryCodeOrName || !countryName) {
    return <Text fw={500}>{playerName}</Text>;
  }

  return (
    <>
      {flag && supportsFlagEmoji ? (
        <FlagDisplay countryCodeOrName={countryCodeOrName} size={size} />
      ) : !supportsFlagEmoji ? (
        <FlagDisplay countryCodeOrName={countryCodeOrName} size={size} />
      ) : null}
      <div>
        <Text fw={500}>{playerName}</Text>
        {/* Show country name below player name if no flag support and not already shown */}
        {!flag && !supportsFlagEmoji && (
          <Text size="xs" c="dimmed">
            {countryName}
          </Text>
        )}
      </div>
    </>
  );
}