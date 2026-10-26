/**
 * ait/theme/tokens — mobile-local design tokens.
 *
 * These mirror `packages/branding/tokens.ts` (the canonical, framework-agnostic
 * source of visual truth). They are duplicated here ONLY because Metro is not yet
 * configured to resolve the `packages/branding` workspace package from the mobile
 * app (see apps/mobile/ARCHITECTURE.md §3: "packages/branding ... must configure
 * Metro, TypeScript, dependency resolution"). Once that wiring lands, delete this
 * file and point ait/theme/theme.ts back at `@ait/branding`.
 */
export type Hex = `#${string}`;

export interface Palette {
  primary: Hex; primaryDark: Hex; accent: Hex;
  surfaceLight: Hex; surfaceWhite: Hex;
  textPrimary: Hex; textMuted: Hex;
  statusSuccess: Hex; statusDanger: Hex;
}

export const palette: Palette = {
  primary: '#0B5D34',      // AIT Forest Green
  primaryDark: '#063B21',
  accent: '#D4AF37',       // AIT Gold
  surfaceLight: '#F8F9FA',
  surfaceWhite: '#FFFFFF',
  textPrimary: '#1A1D20',
  textMuted: '#6C757D',
  statusSuccess: '#198754',
  statusDanger: '#DC3545',
};

export interface Typography { heading: string; body: string; mono: string; }
export const typography: Typography = { heading: 'Inter', body: 'Inter', mono: 'JetBrains Mono' };

export const card = { aspectRatio: 1.586, cornerRadius: 16 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
