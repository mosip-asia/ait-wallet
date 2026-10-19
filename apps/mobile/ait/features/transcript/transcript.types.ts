/**
 * transcript feature — types.
 * Feature-first: this folder keeps the transcript screen, its state machine,
 * and its types together (market-standard clean structure).
 *
 * Note: the wallet does NOT define credential schemas (AGENTS.md Directive #1).
 * These types describe the REQUEST FLOW, not the credential contents.
 */

export type TranscriptRequestStatus =
  | 'idle'
  | 'authenticating' // via AIT IdA (issuance auth — separate from wallet login)
  | 'requesting'
  | 'issuing'
  | 'stored'
  | 'error';

export interface TranscriptRequest {
  /** Subject proven via AIT IdA at issuance time. */
  subjectId: string;
  programme?: string;
  requestedAt: number;
}

export interface TranscriptError {
  code: 'AUTH_FAILED' | 'NOT_ELIGIBLE' | 'ISSUER_UNAVAILABLE' | 'UNKNOWN';
  message: string;
}
