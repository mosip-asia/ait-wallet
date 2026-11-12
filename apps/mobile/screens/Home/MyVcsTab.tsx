import {AitDocumentDashboard} from '../../ait/components/AitDocumentDashboard';
import {SvgImage} from '../../components/ui/svg';
import React, {useEffect, useState} from 'react';
import {Button, Column, Row} from '../../components/ui';
import {RefreshControl, ScrollView} from 'react-native';
import {useMyVcsTab} from './MyVcsTabController';
import {HomeScreenTabProps} from './HomeScreen';
import {AddVcModal} from './MyVcs/AddVcModal';
import {GetVcModal} from './MyVcs/GetVcModal';
import {useTranslation} from 'react-i18next';
import {GET_INDIVIDUAL_ID} from '../../shared/constants';
import {MessageOverlay} from '../../components/MessageOverlay';
import {AitCredentialCard} from '../../ait/components/AitCredentialCard';
import {
  BannerNotification,
  BannerStatusType,
} from '../../components/BannerNotification';
import {
  getErrorEventData,
  sendErrorEvent,
} from '../../shared/telemetry/TelemetryUtils';
import {TelemetryConstants} from '../../shared/telemetry/TelemetryConstants';
import {ErrorView} from '../../components/ui/Error';
import {useIsFocused} from '@react-navigation/native';
import {getVCsOrderedByPinStatus} from '../../shared/Utils';
import {isTranslationKeyFound} from '../../shared/commonUtil';

export const MyVcsTab: React.FC<HomeScreenTabProps> = props => {
  const {t} = useTranslation('MyVcsTab');
  const controller = useMyVcsTab(props);
  const vcMetadataOrderedByPinStatus = getVCsOrderedByPinStatus(
    controller.vcMetadatas,
  );
  const [highlightCardLayout, setHighlightCardLayout] = useState<null | {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'success' | 'failure';
  }>(null);

  const getId = () => {
    controller.DISMISS();
    controller.GET_VC();
  };

  const clearIndividualId = () => {
    GET_INDIVIDUAL_ID({id: '', idType: 'UIN'});
  };

  useEffect(() => {
    if (controller.isInitialDownloading) {
      controller.SET_TOUR_GUIDE(true);
    }
  }, []);

  useEffect(() => {
    if (!props.isViewingVc) {
      controller.RESET_HIGHLIGHT?.();
      setHighlightCardLayout(null);
    }
  }, [props.isViewingVc]);

  useEffect(() => {
    if (controller.areAllVcsLoaded) {
      controller.RESET_STORE_VC_ITEM_STATUS();
      controller.RESET_IN_PROGRESS_VCS_DOWNLOADED();
    }
    if (controller.inProgressVcDownloads?.size > 0) {
      controller.SET_STORE_VC_ITEM_STATUS();
    }

    if (controller.showHardwareKeystoreNotExistsAlert) {
      sendErrorEvent(
        getErrorEventData(
          TelemetryConstants.FlowType.appOnboarding,
          TelemetryConstants.ErrorId.doesNotExist,
          TelemetryConstants.ErrorMessage.hardwareKeyStore,
        ),
      );
    }

    if (controller.isTampered) {
      sendErrorEvent(
        getErrorEventData(
          TelemetryConstants.FlowType.appLogin,
          TelemetryConstants.ErrorId.vcsAreTampered,
          TelemetryConstants.ErrorMessage.vcsAreTampered,
        ),
      );
    }
  }, [
    controller.areAllVcsLoaded,
    controller.inProgressVcDownloads,
    controller.isTampered,
  ]);

  const failedVCsList = [];
  controller.downloadFailedVcs.forEach(vc => {
    failedVCsList.push(`\n${vc.idType}:${vc.displayId}`);
  });

  const isVerificationFailed = controller.verificationErrorMessage !== '';

  const translationKey = `errors.verificationFailed.${controller.verificationErrorMessage}`;

  const verificationErrorMessage = isTranslationKeyFound(translationKey, t)
    ? t(translationKey)
    : t(`errors.verificationFailed.ERR_GENERIC`);

  const downloadFailedVcsErrorMessage = `${t(
    'errors.downloadLimitExpires.message',
  )}${failedVCsList}`;

  const isDownloadFailedVcs =
    useIsFocused() &&
    controller.downloadFailedVcs.length >= 1 &&
    !controller.AddVcModalService &&
    !controller.GetVcModalService;

  return (
    <React.Fragment>
      <Column fill style={{display: props.isVisible ? 'flex' : 'none'}}>
        {controller.isRequestSuccessful && (
          <BannerNotification
            type={BannerStatusType.SUCCESS}
            message={t('downloadingYourCard')}
            onClosePress={() => {
              controller.RESET_STORE_VC_ITEM_STATUS();
              clearIndividualId();
            }}
            key={'downloadingVcPopup'}
            testId={'downloadingVcPopup'}
          />
        )}
        <ScrollView
          testID="walletDashboardScroll"
          style={{flex: 1}}
          contentContainerStyle={{flexGrow: 1}}
          directionalLockEnabled
          refreshControl={
            <RefreshControl
              refreshing={controller.isRefreshingVcs}
              onRefresh={controller.REFRESH}
            />
          }>
          <AitDocumentDashboard
            credentials={vcMetadataOrderedByPinStatus}
            onBrowseIssuers={props.onBrowseIssuers}
            onAdd={props.onAddCredential ?? controller.DOWNLOAD_ID}
            renderCredential={vcMetadata => {
              const vcKey = vcMetadata.getVcKey();
              return (
                <AitCredentialCard
                  key={vcKey}
                  vcMetadata={vcMetadata}
                  margin="8 2 8 2"
                  onPress={controller.VIEW_VC}
                  isDownloading={controller.inProgressVcDownloads?.has(vcKey)}
                  isPinned={vcMetadata.isPinned}
                  onMeasured={rect => {
                    const success =
                      controller.reverificationSuccess.status &&
                      controller.reverificationSuccess.vcKey === vcKey;
                    const failure =
                      controller.reverificationfailure.status &&
                      controller.reverificationfailure.vcKey === vcKey;
                    if ((success || failure) && !highlightCardLayout) {
                      setHighlightCardLayout({
                        ...rect,
                        type: success ? 'success' : 'failure',
                      });
                    }
                  }}
                />
              );
            }}
          />
        </ScrollView>
      </Column>

      {controller.AddVcModalService && (
        <AddVcModal service={controller.AddVcModalService} onPress={getId} />
      )}

      {controller.GetVcModalService && (
        <GetVcModal service={controller.GetVcModalService} />
      )}

      <MessageOverlay
        testID="keyStoreNotExists"
        isVisible={controller.showHardwareKeystoreNotExistsAlert}
        title={t('errors.keystoreNotExists.title')}
        message={t('errors.keystoreNotExists.message')}
        onButtonPress={controller.ACCEPT_HARDWARE_SUPPORT_NOT_EXISTS}
        buttonText={t('errors.keystoreNotExists.riskOkayText')}
        minHeight={'auto'}>
        <Row>
          <Button
            testID="ok"
            type="gradient"
            title={t('errors.keystoreNotExists.riskOkayText')}
            onPress={controller.ACCEPT_HARDWARE_SUPPORT_NOT_EXISTS}
            margin={[0, 8, 0, 0]}
          />
        </Row>
      </MessageOverlay>

      <MessageOverlay
        isVisible={controller.isBindingError}
        title={controller.walletBindingError}
        onButtonPress={controller.DISMISS}
      />
      <MessageOverlay
        isVisible={controller.isTampered}
        title={t('errors.vcIsTampered.title')}
        message={t('errors.vcIsTampered.message')}
        onButtonPress={controller.REMOVE_TAMPERED_VCS}
        buttonText={t('common:ok')}
        minHeight={'auto'}
      />

      <MessageOverlay
        isVisible={isDownloadFailedVcs}
        title={t('errors.downloadLimitExpires.title')}
        message={downloadFailedVcsErrorMessage}
        onButtonPress={controller.DELETE_VC}
        buttonText={t('common:ok')}
        minHeight={'auto'}
      />

      {isVerificationFailed && (
        <ErrorView
          testID="verificationError"
          isVisible={isVerificationFailed}
          isModal={true}
          alignActionsOnEnd
          title={t('errors.verificationFailed.title')}
          message={verificationErrorMessage}
          image={SvgImage.PermissionDenied()}
          showClose={false}
          primaryButtonText="goBack"
          primaryButtonEvent={controller.RESET_VERIFY_ERROR}
          primaryButtonTestID="goBack"
          customStyles={{marginTop: '30%'}}
        />
      )}

      {controller.isNetworkOff && (
        <ErrorView
          testID="networkOffError"
          isVisible={controller.isNetworkOff}
          isModal
          title={t('errors.noInternetConnection.title')}
          message={t('errors.noInternetConnection.message')}
          onDismiss={controller.DISMISS}
          image={SvgImage.NoInternetConnection()}
          showClose
          primaryButtonText="tryAgain"
          primaryButtonEvent={controller.TRY_AGAIN}
          primaryButtonTestID="tryAgain"
        />
      )}
      <MessageOverlay
        overlayMode="highlight"
        isVisible={!!highlightCardLayout && !props.isViewingVc}
        cardLayout={highlightCardLayout ?? undefined}
        onBackdropPress={() => {
          controller.RESET_HIGHLIGHT();
          setHighlightCardLayout(null);
        }}
      />
    </React.Fragment>
  );
};
