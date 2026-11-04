import React from 'react';
import {render} from '@testing-library/react-native';
import {useSelector} from '@xstate/react';
import {GlobalContext, GlobalServices} from '../../../shared/GlobalContext';
import {hashData} from '../../../shared/commonUtil';
import {argon2iConfig} from '../../../shared/constants';
import {useOnboarding} from './onboardingController';

jest.mock('react', () => jest.requireActual('react'));
jest.mock('@xstate/react', () => ({useSelector: jest.fn()}));
jest.mock('../../../shared/commonUtil', () => ({hashData: jest.fn()}));

describe('onboarding PIN setup', () => {
  const send = jest.fn();
  let salt: string;
  const service = {send};
  const Wrapper = ({children}: {children: React.ReactNode}) => (
    <GlobalContext.Provider
      value={
        {
          appService: {children: new Map([['auth', service]])},
        } as unknown as GlobalServices
      }>
      {children}
    </GlobalContext.Provider>
  );
  const renderOnboarding = () => {
    let controller: ReturnType<typeof useOnboarding> | undefined;
    const Probe = () => {
      controller = useOnboarding();
      return null;
    };
    render(
      <Wrapper>
        <Probe />
      </Wrapper>,
    );
    if (!controller) throw new Error('Onboarding hook did not render');
    return controller;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    salt = 'generated-wallet-salt';
    (useSelector as jest.Mock).mockImplementation((_service, selector) =>
      selector({context: {passcodeSalt: salt}, matches: () => false}),
    );
  });

  it('uses the same salt and Argon2 configuration as returning-user verification', async () => {
    (hashData as jest.Mock).mockResolvedValue('salted-pin-hash');
    const controller = renderOnboarding();
    await controller.commitPasscode('123456');
    expect(hashData).toHaveBeenCalledWith('123456', salt, argon2iConfig);
    expect(send).toHaveBeenCalledWith({
      type: 'SETUP_PASSCODE',
      passcode: 'salted-pin-hash',
    });
    expect(send).not.toHaveBeenCalledWith({
      type: 'SETUP_PASSCODE',
      passcode: '123456',
    });
  });

  it('does not authorize the wallet when hashing fails', async () => {
    (hashData as jest.Mock).mockRejectedValue(
      new Error('Native hashing failed'),
    );
    const controller = renderOnboarding();
    await expect(controller.commitPasscode('123456')).rejects.toThrow(
      'Native hashing failed',
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('waits for a generated salt before accepting a PIN', async () => {
    salt = '';
    const controller = renderOnboarding();
    await expect(controller.commitPasscode('123456')).rejects.toThrow(
      'still initializing',
    );
    expect(hashData).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
