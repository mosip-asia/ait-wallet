import {RootRouteProps} from '../routes';
import React, {useEffect} from 'react';
import {Column} from '../components/ui';
import {useAppLayout} from './AppLayoutController';
import {AitLogo} from '../ait/components/AitLogo';
import {palette} from '../ait/theme/tokens';

export const SplashScreen: React.FC<RootRouteProps> = props => {
  const controller = useAppLayout();
  useEffect(() => {
    setTimeout(() => {
      if (controller.isLanguagesetup) {
        props.navigation.navigate('PhoneEntry');
      } else if (controller.isUnAuthorized) {
        props.navigation.navigate('Welcome');
      }
    }, 3000);
  }, [controller.isAuthorized || controller.isLanguagesetup]);
  return (
    <Column
      crossAlign="center"
      fill
      backgroundColor={palette.surfaceWhite}
      style={{justifyContent: 'center'}}>
      <AitLogo width={280} height={82} />
    </Column>
  );
};
