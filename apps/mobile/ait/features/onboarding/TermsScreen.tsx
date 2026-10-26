import React, {useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {RootRouteProps} from '../../../routes';
import {AitButton, AitCheckbox, AitScreen} from '../../components';
import {useTheme} from '../../theme';
import {useOnboarding} from './onboardingController';

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`;

export const TermsScreen: React.FC<RootRouteProps> = ({navigation}) => {
  const theme = useTheme();
  const {proceedToPasscode} = useOnboarding();
  const [agreed, setAgreed] = useState(false);

  return (
    <AitScreen
      title="Terms of Use"
      footer={
        <>
          <AitCheckbox
            testID="agreeTerms"
            checked={agreed}
            onToggle={() => setAgreed(v => !v)}
            label="I have read and agree to the AIT Wallet Terms of Use."
          />
          <AitButton
            testID="submitTerms"
            label="Agree & Continue"
            disabled={!agreed}
            onPress={() => {
              proceedToPasscode(); // introSlider -> settingUp
              navigation.navigate('AitPin');
            }}
          />
        </>
      }>
      <Text style={[styles.body, {color: theme.colors.textMuted}]}>{LOREM}</Text>
    </AitScreen>
  );
};

const styles = StyleSheet.create({
  body: {fontSize: 14, lineHeight: 22},
});
