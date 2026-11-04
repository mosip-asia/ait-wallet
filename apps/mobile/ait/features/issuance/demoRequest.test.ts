import {API} from '../../../shared/api';
import {hashData} from '../../../shared/commonUtil';
import {argon2iConfig} from '../../../shared/constants';
import {
  assertReviewedCredential,
  DemoRequest,
  loadDemoRequest,
  verifyApprovalPin,
} from './demoRequest';

jest.mock('../../../shared/api', () => ({API: {fetchIssuers: jest.fn()}}));
jest.mock('../../../shared/commonUtil', () => ({hashData: jest.fn()}));

const origin = 'https://localhost:8443';
const request = (): DemoRequest => ({
  fixture: true,
  id: 'request-1',
  issuer: origin,
  issuerName: 'AIT SIS — Local Demo',
  expiresAt: Date.now() + 300000,
  credentialName: 'Demo Student ID',
  fields: [
    {label: 'Full name', value: 'Nisha Gurung'},
    {label: 'Student ID', value: 'DEMO-2026-0002'},
  ],
  offerUri:
    'openid-credential-offer://?credential_offer=' +
    encodeURIComponent(JSON.stringify({credential_issuer: origin})),
});

beforeEach(() => {
  jest.clearAllMocks();
  (API.fetchIssuers as jest.Mock).mockResolvedValue([
    {
      issuer_id: 'AITRegistrar',
      credential_issuer_host: origin,
      display: [{title: 'AIT Local Demo'}],
    },
  ]);
  global.fetch = jest
    .fn()
    .mockResolvedValue({ok: true, json: async () => request()});
});

it('loads a request only from the configured fictional issuer', async () => {
  expect((await loadDemoRequest()).issuer).toBe(origin);
  expect(fetch).toHaveBeenCalledWith(origin + '/demo/credential-request', {
    method: 'POST',
  });
});

it.each(['expired', 'not-fixture', 'different-issuer'])(
  'rejects a %s request',
  async problem => {
    const payload = {
      ...request(),
      ...(problem === 'expired'
        ? {expiresAt: 1}
        : problem === 'not-fixture'
        ? {fixture: false}
        : {issuer: 'https://other.example'}),
    };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    await expect(loadDemoRequest()).rejects.toThrow('invalid or expired');
  },
);

it('does not substitute a hosted issuer when the demo is unavailable', async () => {
  (API.fetchIssuers as jest.Mock).mockResolvedValue([
    {issuer_id: 'OtherIssuer'},
  ]);
  await expect(loadDemoRequest()).rejects.toThrow('not available');
  expect(fetch).not.toHaveBeenCalled();
});

it('verifies approval using the stored hash and salt', async () => {
  (hashData as jest.Mock).mockResolvedValue('stored-hash');
  expect(await verifyApprovalPin('123456', 'stored-hash', 'wallet-salt')).toBe(
    true,
  );
  expect(hashData).toHaveBeenCalledWith('123456', 'wallet-salt', argon2iConfig);
  (hashData as jest.Mock).mockResolvedValue('different-hash');
  expect(await verifyApprovalPin('000000', 'stored-hash', 'wallet-salt')).toBe(
    false,
  );
});

it('rejects malformed PINs or missing wallet security state', async () => {
  expect(await verifyApprovalPin('123', 'hash', 'salt')).toBe(false);
  expect(await verifyApprovalPin('123456', '', 'salt')).toBe(false);
  expect(await verifyApprovalPin('123456', 'hash', '')).toBe(false);
  expect(hashData).not.toHaveBeenCalled();
});

it('requires the signed student identity to match the reviewed request', () => {
  expect(() =>
    assertReviewedCredential(
      {credentialSubject: {name: 'Nisha Gurung', identifier: 'DEMO-2026-0002'}},
      request(),
    ),
  ).not.toThrow();
  expect(() =>
    assertReviewedCredential(
      {
        credentialSubject: {
          name: 'Different person',
          identifier: 'DEMO-2026-0002',
        },
      },
      request(),
    ),
  ).toThrow('does not match');
});
