/**
 * onboarding feature — types (stub).
 * Wallet login uses the user's own Google account; AIT Google is NOT used for
 * registration (deleted after graduation → recovery risk). Subsequent access
 * uses Passkey, authorised by device PIN/biometrics. (Per team decision 16 Oct.)
 */

export type OnboardingStep =
  | 'welcome'
  | 'google-signin'   // personal Google — not AIT Google
  | 'passkey-setup'   // subsequent logins
  | 'done';

export interface OnboardingState {
  step: OnboardingStep;
  /** Guest until a permanent account is created (Tier 1 → Tier 2). */
  isGuest: boolean;
}
