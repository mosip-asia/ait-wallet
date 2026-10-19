/**
 * ait-api — integration boundary to AIT's backend / issuer (repository pattern).
 * The rest of the app depends on THIS interface, not on fetch calls, so the
 * backend can change without touching features. Endpoints come from runtimeConfig.
 *
 * Credential issuance/verification/storage themselves are reused from Inji
 * (Directive #7 thin client); this client only brokers AIT-specific requests.
 */
import type { TranscriptRequest } from '../../features/transcript/transcript.types';

export interface IssuerMetadata {
  issuerHost: string;
  supportsTranscript: boolean;
}

export interface AitIssuerClient {
  /** Fetch AIT issuer metadata (what can be issued, endpoints). */
  getMetadata(): Promise<IssuerMetadata>;
  /**
   * Begin a transcript request. Returns an OIDC4VCI credential-offer URI that
   * Inji's existing download flow consumes — we do NOT re-implement issuance.
   */
  requestTranscript(req: TranscriptRequest): Promise<{ credentialOfferUri: string }>;
}
