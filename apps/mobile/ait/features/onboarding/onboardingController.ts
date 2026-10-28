/**
 * useOnboarding — the AIT onboarding flow's single integration point with Inji's
 * auth state machine (machines/auth.ts).
 *
 * The AIT screens are presentation-only; the real passcode security lives in the
 * auth machine. We drive it through the same states the stock Inji flow uses:
 *
 *   languagesetup --SELECT--> introSlider (generates the secure passcode salt)
 *                --NEXT--> settingUp --SETUP_PASSCODE--> authorized (stores the
 *                          Argon2-hashed passcode + salt via the encrypted store)
 *
 * Phone number + OTP are hardcoded demo steps (no backend). The PIN is genuine.
 */
import {useCallback, useContext} from 'react';
import {useSelector} from '@xstate/react';
import {GlobalContext} from '../../../shared/GlobalContext';
import {
  AuthEvents,
  selectAuthorized,
  selectPasscodeSalt,
} from '../../../machines/auth';
import {hashData} from '../../../shared/commonUtil';
import {argon2iConfig} from '../../../shared/constants';

export function useOnboarding() {
  const {appService} = useContext(GlobalContext);
  const authService = appService.children.get('auth');
  if (!authService) throw new Error('Wallet authentication is unavailable.');
  const passcodeSalt = useSelector(authService, selectPasscodeSalt);
  const commitPasscode = useCallback(
    async (passcode: string) => {
      if (!authService || !passcodeSalt) {
        throw new Error(
          'Wallet security is still initializing. Please try again.',
        );
      }
      const hashedPasscode = await hashData(
        passcode,
        passcodeSalt,
        argon2iConfig,
      );
      authService.send(AuthEvents.SETUP_PASSCODE(hashedPasscode));
    },
    [authService, passcodeSalt],
  );

  return {
    isAuthorized: useSelector(authService, selectAuthorized),
    isSaltReady: !!passcodeSalt,

    /** languagesetup -> introSlider: begins secure salt generation early. */
    beginSetup: () => authService?.send(AuthEvents.SELECT()),

    /** introSlider -> settingUp: machine is now ready to accept the passcode. */
    proceedToPasscode: () => authService?.send(AuthEvents.NEXT()),

    /** settingUp -> authorized: persists the hashed passcode. */
    commitPasscode,
  };
}
