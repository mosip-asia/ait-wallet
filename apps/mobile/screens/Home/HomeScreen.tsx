import {CommonActions} from '@react-navigation/native';
import React, {useContext, useEffect} from 'react';
import {Column} from '../../components/ui';
import {Theme} from '../../components/ui/styleUtils';
import {HomeRouteProps} from '../../routes/routeTypes';
import {MyVcsTab} from './MyVcsTab';
import {ReceivedVcsTab} from './ReceivedVcsTab';
import {ViewVcModal} from './ViewVcModal';
import {useHomeScreen} from './HomeScreenController';
import {
  selectIsIssuerMachineBusyForDeepLink,
  TabRef,
} from './HomeScreenMachine';
import {ActorRefFrom} from 'xstate';
import {ErrorMessageOverlay} from '../../components/MessageOverlay';
import {BannerNotificationContainer} from '../../components/BannerNotificationContainer';
import {VCItemMachine} from '../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';
import {VerifiableCredential} from '../../machines/VerifiableCredential/VCMetaMachine/vc';
import {useSelector} from '@xstate/react';
import {GlobalContext} from '../../shared/GlobalContext';
import {APP_EVENTS, selectCredentialOfferUri} from '../../machines/app';
import {
  IssuerScreenTabEvents,
  IssuersMachine,
} from '../../machines/Issuers/IssuersMachine';

export const HomeScreen: React.FC<HomeRouteProps> = props => {
  const controller = useHomeScreen(props);
  const {appService} = useContext(GlobalContext);
  const credentialOfferUri = useSelector(appService, selectCredentialOfferUri);

  useEffect(() => {
    if (controller.IssuersService && credentialOfferUri === '') {
      navigateToIssuers();
    }
  }, [controller.IssuersService]);

  useEffect(() => {
    if (credentialOfferUri === '') return;
    if (!controller.IssuersService) {
      controller.GOTO_ISSUERS();
      return;
    }
    const isIssuerBusy = selectIsIssuerMachineBusyForDeepLink(
      controller.service.getSnapshot(),
    );
    controller.IssuersService.send(
      IssuerScreenTabEvents.CREDENTIAL_OFFER_VIA_DEEP_LINK(credentialOfferUri),
    );
    if (!isIssuerBusy) {
      navigateToIssuers();
    }
    appService.send(APP_EVENTS.RESET_CREDENTIAL_OFFER_URI());
  }, [credentialOfferUri, controller.IssuersService]);

  const navigateToIssuers = () => {
    props.navigation.navigate('IssuersScreen', {
      service: controller.IssuersService,
    });
  };

  return (
    <React.Fragment>
      <BannerNotificationContainer />
      <Column fill backgroundColor={Theme.Colors.lightGreyBackgroundColor}>
        {controller.haveTabsLoaded && (
          <Column fill>
            <MyVcsTab
              onBrowseIssuers={controller.GOTO_ISSUERS}
              onAddCredential={() =>
                props.navigation.dispatch(
                  CommonActions.navigate({name: 'AitCredentialRequest'}),
                )
              }
              isVisible={controller.activeTab === 0}
              service={controller.tabRefs.myVcs}
              vcItemActor={controller.selectedVc}
              isViewingVc={controller.isViewingVc}
            />
            <ReceivedVcsTab
              isVisible={controller.activeTab === 1}
              service={controller.tabRefs.receivedVcs}
              vcItemActor={controller.selectedVc}
            />
          </Column>
        )}
      </Column>

      <ErrorMessageOverlay
        translationPath={'MyVcsTab'}
        isVisible={controller.isMinimumStorageLimitReached}
        error={'errors.storageLimitReached'}
        onDismiss={controller.DISMISS}
      />
      {controller.selectedVc && (
        <ViewVcModal
          isVisible={controller.isViewingVc}
          onDismiss={controller.DISMISS_MODAL}
          vcItemActor={controller.selectedVc}
          activeTab={controller.activeTab}
          flow="downloadedVc"
        />
      )}
    </React.Fragment>
  );
};

export interface HomeScreenTabProps {
  onAddCredential?: () => void;
  onBrowseIssuers?: () => void;
  isViewingVc: any;
  isVisible: boolean;
  service: TabRef;
  vcItemActor: ActorRefFrom<typeof VCItemMachine>;
  vc: VerifiableCredential | Credential;
}
