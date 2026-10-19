/**
 * TranscriptScreen — feature UI (illustrative).
 * Shows the clean dependency direction:
 *   screen → machine (flow) → ait-api (integration) → Inji storage
 * The screen never verifies credentials or manages keys itself.
 */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { next } from './transcript.machine';
import type { TranscriptRequestStatus } from './transcript.types';

export function TranscriptScreen() {
  const theme = useTheme();
  const [status, setStatus] = useState<TranscriptRequestStatus>('idle');

  return (
    <View style={{ backgroundColor: theme.colors.background, padding: theme.spacing.lg }}>
      <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.heading }}>
        Academic Transcript
      </Text>
      <Text style={{ color: theme.colors.textMuted }}>Status: {status}</Text>
      <Pressable
        onPress={() => setStatus((s) => next(s, 'REQUEST'))}
        style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: theme.spacing.md }}
      >
        <Text style={{ color: theme.colors.navBarText }}>Request transcript</Text>
      </Pressable>
    </View>
  );
}
