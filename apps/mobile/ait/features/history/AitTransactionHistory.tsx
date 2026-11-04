import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {palette, radius, spacing} from '../../theme/tokens';

export interface Transaction {
  timestamp: number | string;
  type: string;
  _vcKey?: string;
  issuer?: string;
  deviceName?: string;
  info?: string;
  verifierName?: string;
  requestedInformation?: string[];
}
interface Props {
  activities: Transaction[];
  refreshing: boolean;
  onRefresh: () => void;
  renderActivity: (activity: Transaction) => React.ReactNode;
}
const status = (type: string) => {
  if (type === 'USER_DECLINED_CONSENT') return 'rejected';
  if (/FAIL|INVALID|ERROR|MISMATCH|NO_SELECTED|NO_CREDENTIAL/.test(type))
    return 'failed';
  if (
    [
      'SHARED_SUCCESSFULLY',
      'SHARED_AFTER_RETRY',
      'SHARED_WITH_FACE_VERIFIACTION',
      'SHARED_WITH_FACE_VERIFICATION_AFTER_RETRY',
      'VC_SHARED',
      'VC_SHARED_WITH_VERIFICATION_CONSENT',
      'PRESENCE_VERIFIED_AND_VC_SHARED',
      'QRLOGIN_SUCCESFULL',
    ].includes(type)
  )
    return 'approved';
  return 'recorded';
};
const timestamp = (activity: Transaction) =>
  new Date(activity.timestamp).getTime();

export const AitTransactionHistory: React.FC<Props> = ({
  activities,
  refreshing,
  onRefresh,
  renderActivity,
}) => {
  const {t} = useTranslation('AitHistory');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [issuer, setIssuer] = useState('');
  const [oldestFirst, setOldestFirst] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [outcome, setOutcome] = useState('all');
  const issuers = Array.from(
    new Set(
      activities
        .map(item => item.issuer)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const filtered = activities
    .filter(
      item =>
        (!issuer || item.issuer === issuer) &&
        (outcome === 'all' || status(item.type) === outcome),
    )
    .slice()
    .sort((a, b) =>
      oldestFirst ? timestamp(a) - timestamp(b) : timestamp(b) - timestamp(a),
    );
  const dateLabel = (item: Transaction) =>
    Number.isFinite(timestamp(item))
      ? new Date(item.timestamp).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : t('notRecorded');
  const groups = new Map<string, Transaction[]>();
  filtered.forEach(item => {
    const key = dateLabel(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('issuerFilter')}
          onPress={() => {
            const index = issuers.indexOf(issuer);
            setIssuer(index + 1 < issuers.length ? issuers[index + 1] : '');
          }}
          style={styles.chip}>
          <Text style={styles.chipText}>{issuer || t('allIssuers')} ▾</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOldestFirst(!oldestFirst)}
          style={styles.chip}>
          <Text style={styles.chipText}>
            {t('time')} {oldestFirst ? '↑' : '↓'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('filter')}
          onPress={() => setFilterOpen(true)}
          style={styles.chip}>
          <Text style={styles.chipText}>
            {t('filter')}
            {outcome !== 'all' ? ' •' : ''}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {!filtered.length && (
          <Text testID="noHistory" style={styles.empty}>
            {t(activities.length ? 'noMatches' : 'noHistory')}
          </Text>
        )}
        {Array.from(groups, ([date, items]) => (
          <View key={date}>
            <Text style={styles.date}>{date}</Text>
            {items.map((item, index) => (
              <Pressable
                key={`${item.timestamp}-${item._vcKey}-${index}`}
                testID="transactionRow"
                accessibilityRole="button"
                onPress={() => setSelected(item)}
                style={styles.row}>
                <View style={styles.rowContent}>{renderActivity(item)}</View>
                <Text
                  style={[
                    styles.outcome,
                    {
                      color:
                        status(item.type) === 'approved'
                          ? palette.primary
                          : ['failed', 'rejected'].includes(status(item.type))
                          ? palette.statusDanger
                          : palette.textMuted,
                    },
                  ]}>
                  {t(status(item.type))} ›
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}>
        <View style={styles.scrim}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(null)}
              style={styles.back}>
              <Text style={styles.chipText}>‹ {t('title')}</Text>
            </Pressable>
            {selected && (
              <ScrollView contentContainerStyle={styles.details}>
                <Text style={styles.heading}>{t('transactionDetails')}</Text>
                {renderActivity(selected)}
                <Text style={styles.date}>{t('receivedOn')}</Text>
                <Text style={styles.value}>
                  {Number.isFinite(timestamp(selected))
                    ? new Date(selected.timestamp).toLocaleString()
                    : t('notRecorded')}
                </Text>
                <Text style={styles.date}>{t('requestedBy')}</Text>
                <Text style={styles.value}>
                  {selected.verifierName ||
                    selected.deviceName ||
                    t('notRecorded')}
                </Text>
                <Text style={styles.date}>{t('outcome')}</Text>
                <Text style={styles.value}>{t(status(selected.type))}</Text>
                {!!selected.info && (
                  <Text style={styles.value}>{selected.info}</Text>
                )}
                <Text style={styles.heading}>{t('requestedInformation')}</Text>
                {selected.requestedInformation?.length ? (
                  selected.requestedInformation.map((field, index) => (
                    <Text key={`${field}-${index}`} style={styles.value}>
                      • {field}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.value}>{t('notRecorded')}</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.heading}>{t('filter')}</Text>
            {['all', 'approved', 'rejected', 'failed', 'recorded'].map(
              value => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{selected: outcome === value}}
                  style={styles.back}
                  onPress={() => {
                    setOutcome(value);
                    setFilterOpen(false);
                  }}>
                  <Text style={styles.chipText}>
                    {t(value)}
                    {outcome === value ? ' ✓' : ''}
                  </Text>
                </Pressable>
              ),
            )}
            <Pressable
              accessibilityRole="button"
              style={styles.back}
              onPress={() => setFilterOpen(false)}>
              <Text style={styles.chipText}>{t('close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: palette.surfaceLight},
  toolbar: {flexDirection: 'row', gap: spacing.sm, padding: spacing.md},
  chip: {
    borderWidth: 1,
    borderColor: palette.primary + '40',
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    flexShrink: 1,
  },
  chipText: {color: palette.primary, fontWeight: '600', fontSize: 13},
  list: {padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl},
  date: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderColor: palette.primary + '30',
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceWhite,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  rowContent: {flex: 1},
  outcome: {
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  empty: {
    textAlign: 'center',
    color: palette.textMuted,
    paddingVertical: spacing.xl,
  },
  scrim: {flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066'},
  sheet: {
    maxHeight: '85%',
    backgroundColor: palette.surfaceWhite,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  back: {padding: spacing.md, minHeight: 48},
  details: {padding: spacing.md},
  heading: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginVertical: spacing.md,
  },
  value: {color: palette.textPrimary, fontSize: 15, lineHeight: 24},
});
