import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import Share from 'react-native-share';
import {AitCredentialCard} from './AitCredentialCard';
import type {VCMetadata} from '../../shared/VCMetadata';

jest.mock('react', () => jest.requireActual('react'));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {open: jest.fn().mockResolvedValue({success: true})},
}));
const mockPayload = {
  credentialSubject: {name: 'Demo Student', identifier: 'S123'},
  issuer: {name: 'AIT'},
  issuanceDate: '2026-01-01',
  id: 'urn:credential:123',
};
const mockController = {credential: {credential: mockPayload}};
jest.mock('../../components/VC/VCItemController', () => ({
  useVcItemController: () => mockController,
}));
jest.mock('../../components/VC/common/VCProcessor', () => ({
  VCProcessor: {processForRendering: jest.fn(async () => mockPayload)},
}));

describe('AIT credential card', () => {
  beforeAll(() => {
    React.useState = jest.requireActual('react').useState;
    React.useEffect = jest.requireActual('react').useEffect;
  });
  const metadata = {
    credentialType: 'Student ID',
    format: 'ldp_vc',
    issuer: 'AIT',
  } as VCMetadata;
  it('shows a full summary and opens and closes more details', async () => {
    const screen = render(
      <AitCredentialCard vcMetadata={metadata} onPress={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Demo Student')).toBeTruthy());
    fireEvent.press(screen.getByTestId('viewDashboardCredential'));
    expect(screen.getByText('moreDetails')).toBeTruthy();
    expect(screen.getByText('urn:credential:123')).toBeTruthy();
    fireEvent.press(screen.getByText('‹ backToDashboard'));
    expect(screen.queryByText('moreDetails')).toBeNull();
  });
  it('exports the original signed payload through the native save sheet', async () => {
    const screen = render(
      <AitCredentialCard vcMetadata={metadata} onPress={jest.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Demo Student')).toBeTruthy());
    fireEvent.press(screen.getByTestId('downloadDashboardCredential'));
    await waitFor(() => expect(Share.open).toHaveBeenCalled());
    const options = (Share.open as jest.Mock).mock.calls[0][0];
    expect(
      JSON.parse(
        Buffer.from(options.url.split(',')[1], 'base64').toString('utf8'),
      ),
    ).toEqual(mockPayload);
  });
});
