import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {RootRouteProps} from '../../../routes';
import {AitOtpInput, AitScreen} from '../../components';
import {useTheme} from '../../theme';
import {useOnboarding} from './onboardingController';

type Stage = 'enter' | 'confirm';

export const AitPinScreen: React.FC<RootRouteProps> = ({navigation}) => {
  const theme = useTheme();
  const {commitPasscode} = useOnboarding();
  const [stage, setStage] = useState<Stage>('enter');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (stage === 'enter' && pin.length === 6) {
      setStage('confirm');
    }
  }, [pin, stage]);

  useEffect(() => {
    if (stage === 'confirm' && confirm.length === 6) {
      if (confirm === pin) {
        commitPasscode(pin); // settingUp -> authorized (stores hashed PIN + salt)
        navigation.navigate('Congratulations');
      } else {
        setError('PINs did not match. Please try again.');
        setPin('');
        setConfirm('');
        setStage('enter');
      }
    }
  }, [confirm, pin, stage]);

  const isEnter = stage === 'enter';

  return (
    <AitScreen
      title={isEnter ? 'Create your PIN' : 'Confirm your PIN'}
      subtitle={
        isEnter
          ? 'Set a 6-digit PIN to secure your wallet on this device.'
          : 'Re-enter your PIN to confirm.'
      }>
      <View style={styles.block}>
        <AitOtpInput
          key={stage}
          testID={isEnter ? 'pinEnter' : 'pinConfirm'}
          mask
          value={isEnter ? pin : confirm}
          onChangeText={isEnter ? setPin : setConfirm}
        />
        {error ? (
          <Text style={[styles.error, {color: theme.colors.danger}]}>
            {error}
          </Text>
        ) : null}
      </View>
    </AitScreen>
  );
};

const styles = StyleSheet.create({
  block: {marginTop: 24},
  error: {textAlign: 'center', fontSize: 13, marginTop: 20, fontWeight: '500'},
});
