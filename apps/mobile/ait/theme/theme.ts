/**
 * ait/theme — the SEMANTIC theme the UI consumes.
 * Components read roles (theme.colors.navBar), never raw palette values.
 * Supports Inji's APPLICATION_THEME switch (gradient | purple) as a variant,
 * so we extend Inji's config rather than replace it.
 */
import { palette, typography, card, spacing, radius, type Hex } from './tokens';

export type ThemeVariant = 'gradient' | 'purple';

export interface Theme {
  variant: ThemeVariant;
  colors: {
    primary: Hex; primaryDark: Hex; accent: Hex;
    navBar: Hex; navBarText: Hex;
    background: Hex; surface: Hex;
    textPrimary: Hex; textMuted: Hex;
    success: Hex; danger: Hex;
  };
  typography: typeof typography;
  card: typeof card;
  spacing: typeof spacing;
  radius: typeof radius;
}

export function buildTheme(variant: ThemeVariant = 'gradient'): Theme {
  const navBar: Hex = variant === 'purple' ? '#4B2E83' : palette.primary;
  return {
    variant,
    colors: {
      primary: palette.primary,
      primaryDark: palette.primaryDark,
      accent: palette.accent,
      navBar,
      navBarText: palette.surfaceWhite,
      background: palette.surfaceLight,
      surface: palette.surfaceWhite,
      textPrimary: palette.textPrimary,
      textMuted: palette.textMuted,
      success: palette.statusSuccess,
      danger: palette.statusDanger,
    },
    typography, card, spacing, radius,
  };
}

export const defaultTheme: Theme = buildTheme('gradient');
