/**
 * StatusBadge — reference AIT component showing the configurable pattern.
 * Renders credential status with ONLY theme tokens (zero hardcoded colours).
 * Swap branding tokens → restyles automatically.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';

export type CredentialStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export function StatusBadge({ status }: { status: CredentialStatus }) {
  const theme = useTheme();
  const bg = status === 'ACTIVE' ? theme.colors.success : theme.colors.danger;
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: theme.radius.pill }]}>
      <Text style={{ color: theme.colors.navBarText, fontFamily: theme.typography.body }}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
});
