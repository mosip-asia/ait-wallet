import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import type {RootRouteProps} from '../../../routes';
import {AitButton, AitOtpInput, AitScreen} from '../../components';
import {useTheme} from '../../theme';
import {useDemoIssuance} from './useDemoIssuance';
import type {DemoStage} from './useDemoIssuance';

const stageTitles: Record<DemoStage, string> = {
  scan: 'Add your student ID',
  loading: 'Loading student details',
  review: 'Review your student ID',
  pin: 'Confirm with your wallet PIN',
  issuing: 'Adding your student ID',
  success: 'Your student ID is ready',
  rejected: 'Request declined',
  error: 'Unable to add your student ID',
};

export const AitCredentialRequestScreen: React.FC<RootRouteProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const flow = useDemoIssuance();
  const goHome = () => navigation.reset({index: 0, routes: [{name: 'Main'}]});
  const isBusy = flow.stage === 'loading' || flow.stage === 'issuing';
  const text = {color: theme.colors.textPrimary};
  const muted = {color: theme.colors.textMuted};
  const showCredentialDetails =
    flow.stage === 'review' || flow.stage === 'success';

  return (
    <AitScreen
      title={stageTitles[flow.stage]}
      footer={
        <>
          {flow.stage === 'scan' && (
            <AitButton
              testID="simulateCredentialScan"
              label="Try a sample QR code"
              onPress={flow.scan}
            />
          )}
          {flow.stage === 'review' && (
            <>
              <AitButton
                testID="approveCredentialRequest"
                label="Continue to confirmation"
                onPress={flow.enterPin}
              />
              <AitButton
                testID="rejectCredentialRequest"
                label="Decline request"
                variant="secondary"
                onPress={flow.reject}
              />
            </>
          )}
          {flow.stage === 'pin' && (
            <>
              <AitButton
                testID="confirmCredentialPin"
                label="Confirm and add student ID"
                loading={flow.pinBusy}
                disabled={flow.pin.length !== 6}
                onPress={flow.approve}
              />
              <AitButton
                testID="backToCredentialRequest"
                label="Back to details"
                variant="ghost"
                disabled={flow.pinBusy}
                onPress={flow.review}
              />
            </>
          )}
          {flow.stage === 'error' && (
            <AitButton
              testID="retryCredentialScan"
              label="Try again"
              onPress={flow.scan}
            />
          )}
          {!isBusy && flow.stage !== 'pin' && (
            <AitButton
              testID="credentialRequestHome"
              label={
                flow.stage === 'success'
                  ? 'View my student ID'
                  : 'Back to wallet'
              }
              variant="secondary"
              onPress={goHome}
            />
          )}
        </>
      }>
      <Text style={[styles.demo, muted]}>
        Demo only · sample student details
      </Text>
      {flow.stage === 'scan' && (
        <View style={styles.center}>
          <View
            style={[
              styles.scanner,
              {
                borderColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
              },
            ]}>
            <Text style={[styles.qr, {color: theme.colors.primary}]}>▦</Text>
          </View>
          <Text style={[styles.description, muted]}>
            Use the QR code from AIT SIS to add your student ID to your wallet.
          </Text>
          <Text style={[styles.description, muted]}>
            Try a sample QR code to explore the steps with fictional student
            details.
          </Text>
        </View>
      )}
      {isBusy && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.description, muted]}>
            {flow.stage === 'loading'
              ? 'Loading the student details for you to review…'
              : 'Checking your student ID and saving it to your wallet…'}
          </Text>
        </View>
      )}
      {showCredentialDetails && flow.request && (
        <>
          {flow.stage === 'success' ? (
            <Text style={[styles.check, {color: theme.colors.success}]}>✓</Text>
          ) : (
            <>
              <Text style={[styles.issuer, text]}>
                {flow.request.issuerName}
              </Text>
              <Text style={[styles.description, muted]}>
                Check the details below before adding this student ID to your
                wallet.
              </Text>
            </>
          )}
          <View
            style={[
              styles.card,
              {
                borderColor: theme.colors.primary + '30',
                borderRadius: theme.radius.lg,
              },
            ]}>
            <Text style={[styles.cardTitle, text]}>
              {flow.request.credentialName}
            </Text>
            {flow.request.fields.map(field => (
              <View key={field.label} style={styles.row}>
                <Text style={[styles.label, muted]}>{field.label}</Text>
                <Text style={[styles.value, text]}>{field.value}</Text>
              </View>
            ))}
          </View>
          {flow.stage === 'review' && (
            <Text style={[styles.description, muted]}>
              You’ll confirm with your six-digit wallet PIN in the next step.
            </Text>
          )}
          {flow.stage === 'success' && (
            <Text style={[styles.description, muted]}>
              Your student ID has been verified and saved. You can now find it
              in your wallet.
            </Text>
          )}
        </>
      )}
      {flow.stage === 'pin' && (
        <View style={styles.pin}>
          <Text style={[styles.description, muted]}>
            Enter your six-digit wallet PIN to add this student ID. Your PIN
            stays on this device.
          </Text>
          <AitOtpInput
            testID="credentialApprovalPin"
            value={flow.pin}
            onChangeText={flow.setPin}
            mask
          />
        </View>
      )}
      {flow.stage === 'rejected' && (
        <Text style={[styles.description, muted]}>
          You declined this request. No student ID was issued or added to your
          wallet.
        </Text>
      )}
      {flow.error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, {color: theme.colors.danger}]}>
          {flow.error}
        </Text>
      ) : null}
    </AitScreen>
  );
};

const styles = StyleSheet.create({
  demo: {fontSize: 12, marginBottom: 20},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16},
  scanner: {
    width: 220,
    height: 220,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qr: {fontSize: 140},
  description: {fontSize: 14, lineHeight: 22, marginVertical: 12},
  issuer: {fontSize: 20, fontWeight: '700'},
  card: {borderWidth: 1, padding: 20, marginVertical: 16},
  cardTitle: {fontSize: 17, fontWeight: '700', marginBottom: 16},
  row: {flexDirection: 'row', gap: 16, marginVertical: 8},
  label: {flex: 1, fontSize: 13},
  value: {flex: 1.5, fontSize: 14, fontWeight: '600', textAlign: 'right'},
  check: {fontSize: 64, textAlign: 'center', marginVertical: 12},
  pin: {marginTop: 20},
  error: {fontSize: 14, marginVertical: 16},
});
