/**
 * ait/config — runtime configuration (non-visual half of "configurable").
 * Merges fallback ← .env ← BFF remote config, so nothing is hardcoded in
 * screens/services. Visual identity lives in packages/branding, not here.
 */
import type { ThemeVariant } from '../theme/theme';

/** Active presentation context (AGENTS.md Pillar 3 — re-orders cards only). */
export type ContextDomain = 'ait' | 'thailand' | 'india' | 'global';

export interface RuntimeConfig {
  servers: { mimotoHost: string; esignetHost: string; issuerHost: string };
  themeVariant: ThemeVariant;
  language: string;
  defaultContext: ContextDomain;
  features: { guestMode: boolean; transcriptRequest: boolean; nfcPresentation: boolean };
}

/** Build-time env (mirrors Inji's .env keys). */
export interface Env {
  MIMOTO_HOST?: string; ESIGNET_HOST?: string; ISSUER_HOST?: string;
  APPLICATION_THEME?: string; APPLICATION_LANGUAGE?: string;
}

/** Remote overrides the BFF may push (feature flags, trust config). */
export interface RemoteConfig {
  features?: Partial<RuntimeConfig['features']>;
  defaultContext?: ContextDomain;
}

const FALLBACK: RuntimeConfig = {
  servers: {
    mimotoHost: 'https://api.qainji.mosip.net',
    esignetHost: 'https://esignet-mosipid.released.mosip.net',
    issuerHost: 'https://issuer.ait.ac.th',
  },
  themeVariant: 'gradient',
  language: 'en',
  defaultContext: 'ait',
  features: { guestMode: true, transcriptRequest: true, nfcPresentation: false },
};

/** Effective config: fallback ← env ← remote. */
export function resolveConfig(env: Env = {}, remote: RemoteConfig = {}): RuntimeConfig {
  return {
    servers: {
      mimotoHost: env.MIMOTO_HOST ?? FALLBACK.servers.mimotoHost,
      esignetHost: env.ESIGNET_HOST ?? FALLBACK.servers.esignetHost,
      issuerHost: env.ISSUER_HOST ?? FALLBACK.servers.issuerHost,
    },
    themeVariant: (env.APPLICATION_THEME as ThemeVariant) ?? FALLBACK.themeVariant,
    language: env.APPLICATION_LANGUAGE ?? FALLBACK.language,
    defaultContext: remote.defaultContext ?? FALLBACK.defaultContext,
    features: { ...FALLBACK.features, ...remote.features },
  };
}
