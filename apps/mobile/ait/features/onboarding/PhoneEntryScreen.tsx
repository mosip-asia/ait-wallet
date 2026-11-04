import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RootRouteProps} from '../../../routes';
import {AitButton, AitScreen, AitTextField} from '../../components';
import {useTheme} from '../../theme';
import {useOnboarding} from './onboardingController';

const BrandMark: React.FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.brand}>
      <View style={[styles.logo, {backgroundColor: theme.colors.primary}]}>
        <Text style={styles.logoText}>AIT</Text>
      </View>
    </View>
  );
};

export const PhoneEntryScreen: React.FC<RootRouteProps> = ({navigation}) => {
  const theme = useTheme();
  const {beginSetup} = useOnboarding();
  const [phone, setPhone] = useState('');

  // Start the secure passcode-salt generation under the hood while the user
  // moves through the (hardcoded) phone + OTP steps.
  useEffect(() => {
    beginSetup();
  }, []);

  const digits = phone.replace(/\D/g, '');
  const canContinue = digits.length >= 8;

  return (
    <AitScreen
      title="Welcome to AIT Wallet"
      subtitle="Your verifiable credentials, secured on your device."
      footer={
        <>
          <AitButton
            testID="continuePhone"
            label="Continue with Phone Number"
            disabled={!canContinue}
            onPress={() =>
              navigation.navigate('Otp', {phone: `+66 ${phone}`})
            }
          />
          <AitButton
            testID="continueGoogle"
            label="Continue with Google"
            variant="secondary"
            disabled
          />
          <Text style={[styles.soon, {color: theme.colors.textMuted}]}>
            Google sign-in is coming soon
          </Text>
          <AitButton label="Recover Account" variant="ghost" disabled />
        </>
      }>
      <BrandMark />
      <AitTextField
        testID="phoneInput"
        label="Phone number"
        prefix="+66"
        placeholder="81 234 5678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={12}
      />
    </AitScreen>
  );
};

const styles = StyleSheet.create({
  brand: {alignItems: 'center', marginTop: 24, marginBottom: 40},
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 1},
  soon: {textAlign: 'center', fontSize: 12, marginTop: -4},
});
