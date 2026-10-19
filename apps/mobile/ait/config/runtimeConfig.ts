/**
 * ait/config — runtime configuration (the non-visual half of "configurable").
 * Merges fallback ← .env ← BFF remote config, so no screen/service hardcodes a
 * host, flag or language. Visual identity lives in packages/branding, not here.
 */
import type { ThemeVariant } from '../theme/theme';

export interface RuntimeConfig {
  servers: { mimotoHost: string; esignetHost: string; issuerHost: string };
  themeVariant: ThemeVariant;        // from APPLICATION_THEME
  language: string;                  // from APPLICATION_LANGUAGE
  features: Record<string, boolean>; // feature flags (BFF can toggle remotely)
}

/** Build-time env (mirrors Inji's .env keys). */
export interface Env {
  MIMOTO_HOST?: string; ESIGNET_HOST?: string; ISSUER_HOST?: string;
  APPLICATION_THEME?: string; APPLICATION_LANGUAGE?: string;
}

/** Optional overrides the BFF may push at runtime (zero app-store update). */
export interface RemoteConfig {
  features?: Record<string, boolean>;
}

const FALLBACK: RuntimeConfig = {
  servers: {
    mimotoHost: 'https://api.qainji.mosip.net',
    esignetHost: 'https://esignet-mosipid.released.mosip.net',
    issuerHost: 'https://issuer.ait.ac.th',
  },
  themeVariant: 'gradient',
  language: 'en',
  features: { guestMode: true },
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
    features: { ...FALLBACK.features, ...remote.features },
  };
}
