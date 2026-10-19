/**
 * ait/security — AIT authentication POLICIES (not an implementation).
 *
 * IMPORTANT: Inji already provides biometric/passcode unlock
 * (react-native-biometrics + its auth/biometrics machines). We do NOT rebuild
 * it. This layer only decides WHEN authentication is required and wraps Inji's
 * existing capability.
 */

/** Sensitive actions that must be gated behind local authentication. */
export type GuardedAction =
  | 'open-wallet'
  | 'present-credential'  // Proof of Possession signing
  | 'claim-pid'
  | 'request-transcript';

export interface AuthPolicy {
  /** Does this action require a fresh biometric/passkey authorisation? */
  requiresAuth(action: GuardedAction): boolean;
}

/** Default AIT policy. Tune per product decision; wraps Inji's biometric gate. */
export const defaultAuthPolicy: AuthPolicy = {
  requiresAuth(action) {
    switch (action) {
      case 'open-wallet':
      case 'present-credential':
      case 'claim-pid':
      case 'request-transcript':
        return true;
      default:
        return false;
    }
  },
};
