/**
 * transcript.machine — the request flow as an explicit state machine.
 *
 * Inji uses XState for its workflows; this feature follows that pattern.
 * Declared here as a framework-light machine DESCRIPTION (states + events +
 * transitions) so it compiles standalone for review; during Inji integration it
 * is wrapped with `createMachine(...)` from xstate and its actions call the
 * AIT issuer client + Inji's storage.
 *
 * Flow: idle → authenticating (AIT IdA) → requesting → issuing → stored
 *                         └──────────────── error ◄────────────┘
 */
import type { TranscriptRequestStatus } from './transcript.types';

export type TranscriptEvent =
  | { type: 'REQUEST' }
  | { type: 'AUTH_OK' }
  | { type: 'ISSUED' }
  | { type: 'ERROR' }
  | { type: 'RESET' };

interface TransitionMap {
  on: Partial<Record<TranscriptEvent['type'], TranscriptRequestStatus>>;
}

/** States and their allowed transitions (consumed by XState on integration). */
export const transcriptMachine: Record<TranscriptRequestStatus, TransitionMap> = {
  idle: { on: { REQUEST: 'authenticating' } },
  authenticating: { on: { AUTH_OK: 'requesting', ERROR: 'error' } },
  requesting: { on: { ISSUED: 'issuing', ERROR: 'error' } },
  issuing: { on: { ISSUED: 'stored', ERROR: 'error' } },
  stored: { on: { RESET: 'idle' } },
  error: { on: { RESET: 'idle' } },
};

/** Pure transition function — trivially unit-testable. */
export function next(
  state: TranscriptRequestStatus,
  event: TranscriptEvent['type'],
): TranscriptRequestStatus {
  return transcriptMachine[state].on[event] ?? state;
}
