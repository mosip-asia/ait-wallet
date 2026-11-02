import React, {useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {VCMetadata} from '../../shared/VCMetadata';
import {palette, radius, spacing} from '../theme/tokens';

interface Props {
  credentials: VCMetadata[];
  onAdd: () => void;
  renderCredential: (credential: VCMetadata) => React.ReactNode;
}

export const AitDocumentDashboard: React.FC<Props> = ({
  credentials,
  onAdd,
  renderCredential,
}) => {
  const {t} = useTranslation('AitDashboard');
  const [studentOpen, setStudentOpen] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  // Display metadata only: grouping never changes or validates credential claims.
  const transcripts = credentials.filter(vc =>
    /transcript/i.test(vc.credentialType),
  );
  const students = credentials.filter(
    vc => /student/i.test(vc.credentialType) && !transcripts.includes(vc),
  );
  const others = credentials.filter(
    vc => !students.includes(vc) && !transcripts.includes(vc),
  );

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/ait-campus.jpg')}
        style={styles.banner}
        resizeMode="cover"
        accessibilityLabel={t('banner')}
      />
      <Text style={styles.sectionTitle}>{t('documents')}</Text>
      <View style={styles.panel}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{expanded: studentOpen}}
          onPress={() => setStudentOpen(!studentOpen)}
          style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{t('studentId')}</Text>
          <Text style={styles.chevron}>{studentOpen ? '▴' : '▾'}</Text>
        </Pressable>
        {studentOpen &&
          (students.length ? (
            students.slice(0, 1).map(renderCredential)
          ) : (
            <Pressable
              testID="addStudentId"
              accessibilityRole="button"
              accessibilityLabel={t('addStudentId')}
              onPress={onAdd}
              style={styles.emptyCard}>
              <Text style={styles.plus}>+</Text>
              <Text style={styles.addLabel}>{t('addStudentId')}</Text>
            </Pressable>
          ))}
      </View>
      <View style={styles.panel}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{expanded: transcriptOpen}}
          onPress={() => setTranscriptOpen(!transcriptOpen)}
          style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{t('transcript')}</Text>
          <Text style={styles.chevron}>{transcriptOpen ? '▴' : '▾'}</Text>
        </Pressable>
        {transcriptOpen &&
          (transcripts.length ? (
            transcripts.map(renderCredential)
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={onAdd}
              style={styles.transcriptEmpty}>
              <Text style={styles.addLabel}>{t('addTranscript')}</Text>
            </Pressable>
          ))}
      </View>
      {others.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('otherCredentials')}</Text>
          {others.map(renderCredential)}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {paddingHorizontal: spacing.md, paddingBottom: spacing.xl},
  banner: {
    width: 'auto',
    alignSelf: 'stretch',
    height: 180,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  panel: {
    borderWidth: 1,
    borderColor: palette.primary + '40',
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceWhite,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: palette.primary + '0D',
    gap: spacing.sm,
  },
  panelTitle: {
    flex: 1,
    color: palette.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {color: palette.primary, fontSize: 19},
  emptyCard: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  plus: {color: palette.primary, fontSize: 32, marginBottom: spacing.sm},
  addLabel: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  transcriptEmpty: {padding: spacing.lg},
});
