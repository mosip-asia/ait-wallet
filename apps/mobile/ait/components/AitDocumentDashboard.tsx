import React, {useRef, useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {VCMetadata} from '../../shared/VCMetadata';
import {palette, radius, spacing} from '../theme/tokens';

interface Props {
  credentials: VCMetadata[];
  onAdd: () => void;
  onBrowseIssuers?: () => void;
  renderCredential: (credential: VCMetadata) => React.ReactNode;
}

export const AitDocumentDashboard: React.FC<Props> = ({
  credentials,
  onAdd,
  onBrowseIssuers,
  renderCredential,
}) => {
  const {t} = useTranslation('AitDashboard');
  const carousel = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const sandboxCredentials = credentials.filter(vc =>
    /insurance|identity|mock/i.test(vc.credentialType),
  );
  const [studentOpen, setStudentOpen] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  // Display metadata only: grouping never changes or validates credential claims.
  const transcripts = credentials.filter(vc =>
    /transcript/i.test(vc.credentialType),
  );
  const students = credentials.filter(
    vc => /student/i.test(vc.credentialType) && !transcripts.includes(vc),
  );
  return (
    <View style={styles.container}>
      <View
        style={styles.carousel}
        onLayout={({nativeEvent}) => {
          setWidth(nativeEvent.layout.width);
          carousel.current?.scrollTo({
            x: page * nativeEvent.layout.width,
            animated: false,
          });
        }}>
        <ScrollView
          ref={carousel}
          testID="dashboardCarousel"
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={({nativeEvent}) => {
            if (width) setPage(Math.round(nativeEvent.contentOffset.x / width));
          }}>
          <Image
            source={require('../assets/ait-campus.jpg')}
            style={[styles.banner, {width}]}
            resizeMode="cover"
            accessibilityLabel={t('banner')}
          />
          <View style={[styles.mosipBanner, {width}]}>
            <Text style={styles.eyebrow}>{t('mosipEyebrow')}</Text>
            <Text style={styles.mosipTitle}>{t('mosipTitle')}</Text>
            <Text style={styles.mosipDescription}>{t('mosipDescription')}</Text>
          </View>
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(page === 0 ? 'mosipContext' : 'aitContext')}
          style={[
            styles.carouselArrow,
            page === 0 ? styles.arrowRight : styles.arrowLeft,
          ]}
          onPress={() => {
            const next = page === 0 ? 1 : 0;
            setPage(next);
            carousel.current?.scrollTo({x: next * width, animated: true});
          }}>
          <Text style={styles.arrowText}>{page === 0 ? '›' : '‹'}</Text>
        </Pressable>
      </View>
      <View style={styles.pagination}>
        {['aitContext', 'mosipContext'].map((label, index) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={t(label)}
            accessibilityState={{selected: page === index}}
            style={styles.dotTarget}
            onPress={() => {
              setPage(index);
              carousel.current?.scrollTo({x: index * width, animated: true});
            }}>
            <View style={[styles.dot, page === index && styles.activeDot]} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionTitle}>{t('documents')}</Text>
      {page === 0 ? (
        <>
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
        </>
      ) : (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{t('sandboxDocuments')}</Text>
          </View>
          {sandboxCredentials.length ? (
            sandboxCredentials.map(renderCredential)
          ) : (
            <Pressable
              testID="browseSandboxIssuers"
              accessibilityRole="button"
              onPress={onBrowseIssuers ?? onAdd}
              style={styles.emptyCard}>
              <Text style={styles.plus}>+</Text>
              <Text style={styles.addLabel}>{t('browseSandboxIssuers')}</Text>
              <Text style={styles.sandboxDescription}>
                {t('sandboxDescription')}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {paddingHorizontal: spacing.md, paddingBottom: spacing.xl},
  carousel: {marginHorizontal: -spacing.md},
  banner: {height: 180},
  carouselArrow: {
    position: 'absolute',
    top: 68,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRight: {right: spacing.sm},
  arrowLeft: {left: spacing.sm},
  arrowText: {color: palette.primary, fontSize: 30, lineHeight: 34},
  mosipBanner: {
    height: 180,
    backgroundColor: palette.primaryDark,
    padding: spacing.lg,
    paddingLeft: spacing.xl * 2,
    justifyContent: 'center',
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  mosipTitle: {
    color: palette.surfaceWhite,
    fontSize: 32,
    fontWeight: '700',
    marginVertical: spacing.sm,
  },
  mosipDescription: {color: palette.surfaceWhite, fontSize: 14, lineHeight: 21},
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dotTarget: {
    width: 20,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.textMuted + '50',
  },
  activeDot: {backgroundColor: palette.primary},
  sandboxDescription: {
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
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
