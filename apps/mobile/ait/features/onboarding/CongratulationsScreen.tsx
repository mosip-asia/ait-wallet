import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RootRouteProps} from '../../../routes';
import {AitButton, AitScreen} from '../../components';
import {useTheme} from '../../theme';
import {useOnboarding} from './onboardingController';

export const CongratulationsScreen: React.FC<RootRouteProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const {isAuthorized} = useOnboarding();
  const walletId = useMemo(
    () => 'AIT-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    [],
  );

  const finish = () => navigation.reset({index: 0, routes: [{name: 'Main'}]});

  return (
    <AitScreen
      footer={
        <>
          <AitButton
            testID="scanCredentialRequest"
            label="Scan credential QR"
            disabled={!isAuthorized}
            onPress={() => navigation.navigate('AitCredentialRequest')}
          />
          <AitButton
            testID="finishOnboarding"
            label="Continue without scanning"
            variant="secondary"
            disabled={!isAuthorized}
            onPress={finish}
          />
        </>
      }>
      <View style={styles.center}>
        <View style={[styles.badge, {backgroundColor: theme.colors.success}]}>
          <Text style={styles.tick}>{'✓'}</Text>
        </View>
        <Text style={[styles.title, {color: theme.colors.textPrimary}]}>
          Congratulations
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.textMuted}]}>
          You&apos;ve installed your AIT Wallet.
        </Text>

        <View
          style={[
            styles.idCard,
            {borderColor: '#E2E8E5', borderRadius: theme.radius.lg},
          ]}>
          <Text style={[styles.idLabel, {color: theme.colors.textMuted}]}>
            Wallet ID
          </Text>
          <Text style={[styles.idValue, {color: theme.colors.primary}]}>
            {walletId}
          </Text>
        </View>
      </View>
    </AitScreen>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tick: {color: '#FFFFFF', fontSize: 44, fontWeight: '800'},
  title: {fontSize: 26, fontWeight: '700', marginBottom: 8},
  subtitle: {fontSize: 15, textAlign: 'center', marginBottom: 32},
  idCard: {
    borderWidth: 1.5,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  idValue: {fontSize: 20, fontWeight: '800', letterSpacing: 1},
});
