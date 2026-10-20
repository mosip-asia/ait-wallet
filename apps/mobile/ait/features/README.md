# `ait/features/`

Feature-first: each AIT feature gets its own folder holding everything it needs —
screen, state machine (XState, matching Inji), and types — together.

Placeholder for now. When a feature is built, it follows this shape:

```
features/<feature>/
  <Feature>Screen.tsx     # UI (reads theme, triggers the machine)
  <feature>.machine.ts    # flow as a state machine
  <feature>.types.ts      # feature types
```

Dependency direction: **screen → machine → integration → Inji core.**
Screens never verify credentials or manage keys directly.
