# `ait/components/`

Reusable AIT UI components live here. The rule: they read styling from
`ait/theme/useTheme()` — **no hardcoded colours** (AGENTS.md Directive #7).

Placeholder for now — components are added as features need them. Example shape:

```tsx
import { useTheme } from '../theme/useTheme';
export function Example() {
  const theme = useTheme();
  return <View style={{ backgroundColor: theme.colors.surface }} />;
}
```
