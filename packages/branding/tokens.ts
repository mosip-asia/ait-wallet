/**
 * AIT Wallet — Design Tokens (single source of visual truth)
 * -----------------------------------------------------------
 * Every colour, radius and type choice the UI uses is declared here ONCE.
 * Re-skinning the app = change values here; screens/components never change.
 * This is the mechanism behind AGENTS.md Directive #2
 * ("UI components consume tokens from packages/branding").
 *
 * Framework-agnostic (no React Native imports) so mobile + web share it.
 */

export type Hex = `#${string}`;

export interface Palette {
  primary: Hex;        // AIT Forest Green — headers, primary actions
  primaryDark: Hex;    // gradients, pressed states
  accent: Hex;         // AIT Gold — highlights, faculty badges, borders
  surfaceLight: Hex;   // app background
  surfaceWhite: Hex;   // cards, sheets
  textPrimary: Hex;    // body text / titles
  textMuted: Hex;      // secondary labels
  statusSuccess: Hex;  // valid / approved credentials
  statusDanger: Hex;   // expired / revoked
}

export const palette: Palette = {
  primary: '#0B5D34',
  primaryDark: '#063B21',
  accent: '#D4AF37',
  surfaceLight: '#F8F9FA',
  surfaceWhite: '#FFFFFF',
  textPrimary: '#1A1D20',
  textMuted: '#6C757D',
  statusSuccess: '#198754',
  statusDanger: '#DC3545',
};

export interface Typography {
  heading: string;
  body: string;
  mono: string;
}

export const typography: Typography = {
  heading: 'Inter',
  body: 'Inter',
  mono: 'JetBrains Mono',
};

/** Credential card geometry (ID-1 ratio, per branding README). */
export const card = { aspectRatio: 1.586, cornerRadius: 16 } as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
