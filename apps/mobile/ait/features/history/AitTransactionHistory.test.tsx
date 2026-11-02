import React from 'react';
import {Text} from 'react-native';
import {fireEvent, render, within} from '@testing-library/react-native';
import {AitTransactionHistory, Transaction} from './AitTransactionHistory';
jest.mock('react', () => jest.requireActual('react'));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));
const activities: Transaction[] = [
  {
    timestamp: Date.parse('2026-08-05T10:00:00Z'),
    type: 'SHARED_SUCCESSFULLY',
    issuer: 'AIT',
    verifierName: 'Campus library',
    requestedInformation: ['Name', 'Expiration date'],
  },
  {
    timestamp: Date.parse('2026-08-04T10:00:00Z'),
    type: 'USER_DECLINED_CONSENT',
    issuer: 'Other',
  },
];
const renderActivity = (item: Transaction) => <Text>{item.type}</Text>;
describe('AIT transaction history', () => {
  beforeAll(() => {
    React.useState = jest.requireActual('react').useState;
  });
  it('opens recorded transaction details and returns to the list', () => {
    const screen = render(
      <AitTransactionHistory
        activities={activities}
        refreshing={false}
        onRefresh={jest.fn()}
        renderActivity={renderActivity}
      />,
    );
    fireEvent.press(screen.getAllByTestId('transactionRow')[0]);
    expect(screen.getByText('Campus library')).toBeTruthy();
    expect(screen.getByText('• Name')).toBeTruthy();
    fireEvent.press(screen.getByText('‹ title'));
    expect(screen.queryByText('Campus library')).toBeNull();
  });
  it('filters by issuer and changes time ordering', () => {
    const screen = render(
      <AitTransactionHistory
        activities={activities}
        refreshing={false}
        onRefresh={jest.fn()}
        renderActivity={renderActivity}
      />,
    );
    fireEvent.press(screen.getByText('time ↓'));
    expect(within(screen.getAllByTestId('transactionRow')[0]).getByText('USER_DECLINED_CONSENT')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('issuerFilter'));
    expect(screen.getAllByTestId('transactionRow')).toHaveLength(1);
    expect(screen.queryByText('USER_DECLINED_CONSENT')).toBeNull();
  });
  it('filters declined consent separately from failures', () => {
    const screen = render(
      <AitTransactionHistory
        activities={activities}
        refreshing={false}
        onRefresh={jest.fn()}
        renderActivity={renderActivity}
      />,
    );
    fireEvent.press(screen.getByLabelText('filter'));
    fireEvent.press(screen.getByText('failed'));
    expect(screen.getByText('noMatches')).toBeTruthy();
  });
});
