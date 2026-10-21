/**
 * useTheme — the ONE way components read tokens. No hardcoded colours in UI
 * (AGENTS.md Directive #7 / verification protocol).
 *     const theme = useTheme();
 *     <View style={{ backgroundColor: theme.colors.navBar }} />
 */
import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { Theme } from './theme';

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
