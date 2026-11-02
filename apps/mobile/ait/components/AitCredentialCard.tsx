import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Share from 'react-native-share';
import {Buffer} from 'buffer';
import {useVcItemController} from '../../components/VC/VCItemController';
import {VCProcessor} from '../../components/VC/common/VCProcessor';
import type {VCItemProps} from '../../components/VC/Views/VCCardView';
import {palette, radius, spacing} from '../theme/tokens';

/** A full-size local credential summary; issuer metadata fetching is not required. */
export const AitCredentialCard: React.FC<VCItemProps> = ({
  vcMetadata,
  isDownloading,
}) => {
  const {t} = useTranslation('AitDashboard');
  const controller = useVcItemController(vcMetadata);
  const [claims, setClaims] = useState<Record<string, any> | null>(null);
  const [exporting, setExporting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    setClaims(null);
    setLoadError(false);
    if (controller.credential?.credential) {
      VCProcessor.processForRendering(controller.credential, vcMetadata.format)
        .then(data => {
          if (active) setClaims(data?.fullResolvedPayload ?? data);
        })
        .catch(() => {
          if (active) setLoadError(true);
        });
    }
    return () => {
      active = false;
    };
  }, [controller.credential, vcMetadata.format]);

  const subject = claims?.credentialSubject ?? claims ?? {};
  const text = (value: unknown): string =>
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const name =
    text(subject.name) ||
    [
      text(subject.givenName ?? subject.given_name),
      text(subject.familyName ?? subject.family_name),
    ]
      .filter(Boolean)
      .join(' ');
  const identifier = text(
    subject.identifier ?? subject.studentId ?? subject.student_id,
  );
  const course = text(claims?.about?.name ?? subject.about?.name);
  const issuer =
    text(claims?.issuer?.name) ||
    vcMetadata.issuer ||
    text(claims?.issuer) ||
    t('notAvailable');
  const status =
    vcMetadata.isRevoked === 'TRUE'
      ? 'revoked'
      : vcMetadata.isExpired
      ? 'expired'
      : vcMetadata.isVerified
      ? 'verified'
      : 'notVerified';
  const ready = Boolean(controller.credential?.credential) && !isDownloading;

  const download = async () => {
    if (!ready || exporting) return;
    setExporting(true);
    try {
      // Export the original signed payload, never the reconstructed display claims.
      const payload = controller.credential.credential;
      const json = typeof payload !== 'string';
      const content = json ? JSON.stringify(payload, null, 2) : payload;
      const mime = json ? 'application/json' : 'text/plain';
      await Share.open({
        title: t('download'),
        filename: 'credential',
        type: mime,
        url: `data:${mime};base64,${Buffer.from(content, 'utf8').toString(
          'base64',
        )}`,
        failOnCancel: false,
      });
    } catch {
      Alert.alert(t('downloadFailed'), t('downloadFailedDescription'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Modal
        visible={detailsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsOpen(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDetailsOpen(false)}
              style={styles.back}>
              <Text style={styles.buttonText}>‹ {t('backToDashboard')}</Text>
            </Pressable>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.name}>{t('moreDetails')}</Text>
              <Text style={styles.value}>
                {name || vcMetadata.credentialType}
              </Text>
              {!!identifier && <Text style={styles.value}>{identifier}</Text>}
              {!!course && <Text style={styles.value}>{course}</Text>}
              {[
                ['issuedBy', issuer],
                [
                  'issuedOn',
                  text(
                    claims?.validFrom ?? claims?.issuanceDate ?? claims?.iat,
                  ),
                ],
                [
                  'validUntil',
                  text(
                    claims?.validUntil ?? claims?.expirationDate ?? claims?.exp,
                  ),
                ],
                ['credentialSerial', text(claims?.id ?? claims?.jti)],
                ['credentialFormat', vcMetadata.format],
                ['credentialStatus', t(status)],
              ].map(([label, value]) => (
                <View key={label}>
                  <Text style={styles.label}>{t(label)}</Text>
                  <Text selectable style={styles.value}>
                    {value || t('notAvailable')}
                  </Text>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={download}
                disabled={!ready || exporting}
                style={[styles.button, styles.detailDownload]}>
                <Text style={styles.buttonText}>
                  {t(exporting ? 'downloading' : 'download')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <View style={styles.statusRow}>
        <Text style={styles.status}>{t(status)}</Text>
        <Text style={styles.format}>{vcMetadata.format}</Text>
      </View>
      <View style={styles.details}>
        {isDownloading || (!claims && !loadError) ? (
          <ActivityIndicator color={palette.primary} />
        ) : (
          <>
            <Text style={styles.name}>{name || vcMetadata.credentialType}</Text>
            {!!identifier && <Text style={styles.value}>{identifier}</Text>}
            {!!course && <Text style={styles.value}>{course}</Text>}
            <Text style={styles.label}>{t('issuedBy')}</Text>
            <Text style={styles.value}>{issuer}</Text>
            <Text style={styles.label}>{t('credentialFormat')}</Text>
            <Text style={styles.value}>
              {vcMetadata.format || t('notAvailable')}
            </Text>
            {loadError && (
              <Text style={styles.value}>{t('detailsUnavailable')}</Text>
            )}
          </>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="viewDashboardCredential"
          disabled={!ready}
          onPress={() => setDetailsOpen(true)}
          style={[styles.button, !ready && styles.disabled]}>
          <Text style={styles.buttonText}>{t('view')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="downloadDashboardCredential"
          disabled={!ready || exporting}
          onPress={download}
          style={[styles.button, (!ready || exporting) && styles.disabled]}>
          <Text style={styles.buttonText}>
            {t(exporting ? 'downloading' : 'download')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrim: {flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066'},
  sheet: {
    maxHeight: '85%',
    backgroundColor: palette.surfaceWhite,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
  },
  sheetContent: {padding: spacing.lg},
  back: {
    padding: spacing.lg,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: palette.surfaceLight,
  },
  detailDownload: {marginTop: spacing.lg, flex: 0},
  card: {
    minHeight: 260,
    padding: spacing.lg,
    backgroundColor: palette.surfaceWhite,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  status: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  format: {color: palette.textMuted, fontSize: 11, flexShrink: 1},
  details: {
    minHeight: 150,
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  name: {
    color: palette.textPrimary,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  value: {color: palette.textPrimary, fontSize: 15, lineHeight: 23},
  label: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  actions: {flexDirection: 'row', gap: spacing.md},
  button: {
    flex: 1,
    minHeight: 46,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.primary,
    borderRadius: radius.sm,
  },
  buttonText: {color: palette.primary, fontSize: 14, fontWeight: '600'},
  disabled: {opacity: 0.45},
});
