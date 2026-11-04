import React from 'react';
import {StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Column, Text} from '../../components/ui';
import {palette, radius, spacing} from '../theme/tokens';

export const AitDashboardHeader: React.FC = () => {
  const {t} = useTranslation('MyVcsTab');

  return (
    <Column style={styles.container}>
      <Text weight="semibold" style={styles.title}>
        {t('dashboardTitle')}
      </Text>
      <Text style={styles.description}>{t('dashboardDescription')}</Text>
    </Column>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: spacing.xs,
    borderLeftColor: palette.primary,
    backgroundColor: palette.primary + '0D',
  },
  title: {color: palette.primary, fontSize: 22, lineHeight: 30},
  description: {
    color: palette.textMuted,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
});
