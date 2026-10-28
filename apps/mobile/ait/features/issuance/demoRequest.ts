import {API} from '../../../shared/api';
import {hashData} from '../../../shared/commonUtil';
import {argon2iConfig} from '../../../shared/constants';
import type {issuerType} from '../../../machines/Issuers/IssuersMachine';

/** Presentation data from the fictional issuer, not a credential schema. */
export interface DemoRequest {
  fixture: true;
  id: string;
  expiresAt: number;
  issuer: string;
  issuerName: string;
  credentialName: string;
  fields: Array<{label: string; value: string}>;
  offerUri: string;
}

export async function loadDemoRequest(): Promise<DemoRequest> {
  if (!__DEV__)
    throw new Error(
      'This fictional QR flow is available in development builds only.',
    );
  const issuers: issuerType[] = await API.fetchIssuers();
  const issuer = issuers.find(
    item =>
      item.issuer_id === 'AITRegistrar' &&
      item.display?.some(display => display.title === 'AIT Local Demo'),
  );
  if (!issuer) throw new Error('The AIT local demo issuer is not available.');
  const origin = new URL(issuer.credential_issuer_host).origin;
  if (!origin.startsWith('https://'))
    throw new Error('The demo issuer must use HTTPS.');
  const response = await fetch(origin + '/demo/credential-request', {
    method: 'POST',
  });
  if (!response.ok)
    throw new Error(
      'Could not retrieve the credential request. Please scan again.',
    );
  const request: DemoRequest = await response.json();
  const offer = JSON.parse(
    new URL(request.offerUri).searchParams.get('credential_offer') || '{}',
  );
  if (
    request.fixture !== true ||
    request.issuer !== origin ||
    offer.credential_issuer !== origin ||
    !Number.isFinite(request.expiresAt) ||
    request.expiresAt <= Date.now() ||
    !Array.isArray(request.fields) ||
    !request.fields.length ||
    request.fields.some(
      field =>
        typeof field.label !== 'string' || typeof field.value !== 'string',
    )
  ) {
    throw new Error(
      'The demo credential request is invalid or expired. Please scan again.',
    );
  }
  return request;
}

export async function verifyApprovalPin(
  pin: string,
  storedHash: string,
  salt: string,
): Promise<boolean> {
  if (!/^\d{6}$/.test(pin) || !storedHash || !salt) return false;
  return (await hashData(pin, salt, argon2iConfig)) === storedHash;
}

export function assertReviewedCredential(
  credential: {credentialSubject?: {name?: string; identifier?: string}},
  request: DemoRequest,
) {
  const name = request.fields.find(field => field.label === 'Full name')?.value;
  const identifier = request.fields.find(
    field => field.label === 'Student ID',
  )?.value;
  if (
    !name ||
    !identifier ||
    credential.credentialSubject?.name !== name ||
    credential.credentialSubject?.identifier !== identifier
  ) {
    throw new Error(
      'The issued credential does not match the request you approved.',
    );
  }
}
