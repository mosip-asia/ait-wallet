import React from 'react';
import {Text} from 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import {AitDocumentDashboard} from './AitDocumentDashboard';
import type {VCMetadata} from '../../shared/VCMetadata';

jest.mock('react', () => jest.requireActual('react'));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

const credential = (credentialType: string) => ({credentialType} as VCMetadata);
const renderCredential = (vc: VCMetadata) => (
  <Text key={vc.credentialType}>{vc.credentialType}</Text>
);

describe('AIT document dashboard', () => {
  beforeAll(() => {
    React.useState = jest.requireActual('react').useState;
  });
  it('switches document sections when swiping and returns through the AIT indicator', () => {
    const onAdd = jest.fn();
    const onBrowseIssuers = jest.fn();
    const screen = render(
      <AitDocumentDashboard
        credentials={[]}
        onAdd={onAdd}
        onBrowseIssuers={onBrowseIssuers}
        renderCredential={renderCredential}
      />,
    );
    fireEvent(screen.getByTestId('dashboardCarousel').parent!, 'layout', {
      nativeEvent: {layout: {width: 390}},
    });
    fireEvent(screen.getByTestId('dashboardCarousel'), 'momentumScrollEnd', {
      nativeEvent: {contentOffset: {x: 390}},
    });
    expect(screen.queryByTestId('addStudentId')).toBeNull();
    fireEvent.press(screen.getByTestId('browseSandboxIssuers'));
    expect(onBrowseIssuers).toHaveBeenCalledTimes(1);
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.press(screen.getAllByLabelText('aitContext').slice(-1)[0]);
    expect(screen.getByTestId('addStudentId')).toBeTruthy();
    expect(screen.queryByTestId('browseSandboxIssuers')).toBeNull();
  });

  it('opens the add flow from the empty student card', () => {
    const onAdd = jest.fn();
    const screen = render(
      <AitDocumentDashboard
        credentials={[]}
        onAdd={onAdd}
        renderCredential={renderCredential}
      />,
    );
    fireEvent.press(screen.getByTestId('addStudentId'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('replaces the empty card with the existing student credential', () => {
    const screen = render(
      <AitDocumentDashboard
        credentials={[credential('Student ID')]}
        onAdd={jest.fn()}
        renderCredential={renderCredential}
      />,
    );
    expect(screen.getByText('Student ID')).toBeTruthy();
    expect(screen.queryByTestId('addStudentId')).toBeNull();
  });

  it('shows only one student card when multiple student credentials are stored', () => {
    const screen = render(
      <AitDocumentDashboard
        credentials={[credential('Student ID'), credential('Student ID copy')]}
        onAdd={jest.fn()}
        renderCredential={renderCredential}
      />,
    );
    expect(screen.getByText('Student ID')).toBeTruthy();
    expect(screen.queryByText('Student ID copy')).toBeNull();
    expect(screen.queryByTestId('addStudentId')).toBeNull();
  });

  it('expands transcripts without displaying other credential categories', () => {
    const screen = render(
      <AitDocumentDashboard
        credentials={[
          credential('Academic Transcript'),
          credential('Staff ID'),
        ]}
        onAdd={jest.fn()}
        renderCredential={renderCredential}
      />,
    );
    expect(screen.queryByText('Academic Transcript')).toBeNull();
    expect(screen.queryByText('Staff ID')).toBeNull();
    expect(screen.queryByText('otherCredentials')).toBeNull();
    expect(screen.getByTestId('addStudentId')).toBeTruthy();
    fireEvent.press(screen.getByText('transcript'));
    expect(screen.getByText('Academic Transcript')).toBeTruthy();
  });
});
