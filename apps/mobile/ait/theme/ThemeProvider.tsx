/**
 * ThemeProvider — exposes the active Theme to the tree. Wrap the app root once.
 * (Illustrative: binds to React Native once the Inji base is merged.)
 */
import React, { createContext, type ReactNode } from 'react';
import { buildTheme, defaultTheme, type Theme, type ThemeVariant } from './theme';

export const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider(
  { variant = 'gradient', children }: { variant?: ThemeVariant; children: ReactNode },
) {
  return <ThemeContext.Provider value={buildTheme(variant)}>{children}</ThemeContext.Provider>;
}
