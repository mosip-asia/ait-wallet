import {palette} from './tokens';

/** Map AIT branding to Inji's existing theme roles, including baked-in styles. */
export const aitLegacyColors = {
  Black: palette.textPrimary,
  White: palette.surfaceWhite,
  Primary: palette.primary,
  Secondary: palette.primary,
  Magenta: palette.primary,
  Violet: palette.primaryDark,
  GrayText: palette.textMuted,
  ShadeOfGrey: palette.textMuted,
  LightGrey: palette.surfaceLight,
  Gray97: palette.surfaceLight,
  Green: palette.statusSuccess,
  Red: palette.statusDanger,
  LightRed: palette.statusDanger,
  LightOrange: palette.primary + '14',
  GradientColors: [palette.primary, palette.primaryDark],
  GradientColorsLight: [palette.primary + '14', palette.primaryDark + '14'],
  startColor: palette.primary,
  endColor: palette.primaryDark,
  stroke: palette.accent,
  iconBg: palette.primary + '14',
  warningLogoBg: palette.accent + '1A',
};
