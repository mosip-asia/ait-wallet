import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {RootRouteProps} from '../../../routes';
import {AitButton, AitOtpInput, AitScreen} from '../../components';
import {useTheme} from '../../theme';

export const OtpScreen: React.FC<RootRouteProps> = ({navigation, route}) => {
  const theme = useTheme();
  const phone = (route.params as {phone?: string})?.phone ?? 'your number';
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);

  // Demo: any 6-digit code is accepted.
  const canConfirm = code.length === 6;

  return (
    <AitScreen
      title="Verify your number"
      subtitle={`Enter the 6-digit code we sent to ${phone}.`}
      footer={
        <>
          <AitButton
            testID="confirmOtp"
            label="Confirm"
            disabled={!canConfirm}
            onPress={() => navigation.navigate('Terms')}
          />
          <AitButton
            label="Edit your number"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </>
      }>
      <View style={styles.block}>
        <AitOtpInput testID="otpInput" value={code} onChangeText={setCode} />
        <Pressable onPress={() => setResent(true)} style={styles.resend}>
          <Text style={[styles.resendText, {color: theme.colors.primary}]}>
            {resent ? 'Code resent' : 'Resend OTP'}
          </Text>
        </Pressable>
      </View>
    </AitScreen>
  );
};

const styles = StyleSheet.create({
  block: {marginTop: 16},
  resend: {marginTop: 24, alignSelf: 'center'},
  resendText: {fontSize: 14, fontWeight: '600'},
});
