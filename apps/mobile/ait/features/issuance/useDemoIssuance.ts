import {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useMachine, useSelector} from '@xstate/react';
import {AppServices, GlobalContext} from '../../../shared/GlobalContext';
import {
  selectAuthorized,
  selectPasscode,
  selectPasscodeSalt,
} from '../../../machines/auth';
import {
  IssuersMachine,
  IssuerScreenTabEvents,
} from '../../../machines/Issuers/IssuersMachine';
import {IssuersService} from '../../../machines/Issuers/IssuersService';
import {VCMetadata} from '../../../shared/VCMetadata';
import {
  assertReviewedCredential,
  DemoRequest,
  loadDemoRequest,
  verifyApprovalPin,
} from './demoRequest';

export type DemoStage =
  | 'scan'
  | 'loading'
  | 'review'
  | 'pin'
  | 'issuing'
  | 'success'
  | 'error'
  | 'rejected';

export function useDemoIssuance() {
  const {appService} = useContext(GlobalContext);
  const serviceRefs = useMemo(
    () => Object.fromEntries(appService.children) as unknown as AppServices,
    [appService],
  );
  const authorized = useSelector(serviceRefs.auth, selectAuthorized);
  const storedHash = useSelector(serviceRefs.auth, selectPasscode);
  const salt = useSelector(serviceRefs.auth, selectPasscodeSalt);
  const reviewed = useRef<DemoRequest | null>(null);
  const submitting = useRef(false);
  const [request, setRequest] = useState<DemoRequest | null>(null);
  const [stage, setStage] = useState<DemoStage>('scan');
  const [pin, setPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const machine = useMemo(
    () =>
      IssuersMachine.withContext({
        ...IssuersMachine.context,
        serviceRefs,
      }).withConfig({
        services: {
          verifyCredential: async (context: typeof IssuersMachine.context) => {
            const result = await IssuersService().verifyCredential(context);
            if (!reviewed.current) throw new Error('No approved request');
            assertReviewedCredential(
              context.verifiableCredential?.credential,
              reviewed.current,
            );
            return result;
          },
        },
        // This demo must never show an unverified card as a successful issuance.
        guards: {isVerificationPendingBecauseOfNetworkIssue: () => false},
      }),
    [serviceRefs],
  );
  const [state, send] = useMachine(machine);

  useEffect(() => {
    const subscription = serviceRefs.store.subscribe(snapshot => {
      const event = snapshot.event;
      if (
        event.type !== 'STORE_RESPONSE' ||
        !event.response ||
        typeof event.response !== 'object' ||
        !('vcMetadata' in event.response)
      )
        return;
      const metadata = VCMetadata.fromVC(event.response.vcMetadata);
      if (metadata.isVerified) {
        const key = metadata.getVcKey();
        setSavedKeys(keys => (keys.includes(key) ? keys : [...keys, key]));
      }
    });
    return () => subscription.unsubscribe();
  }, [serviceRefs]);

  const scan = async () => {
    setStage('loading');
    setError('');
    setPin('');
    reviewed.current = null;
    try {
      const next = await loadDemoRequest();
      reviewed.current = next;
      setRequest(next);
      setStage('review');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not retrieve the credential request.',
      );
      setStage('error');
    }
  };

  const approve = async () => {
    if (submitting.current || stage !== 'pin' || !request || !authorized)
      return;
    submitting.current = true;
    setPinBusy(true);
    setError('');
    try {
      if (request.expiresAt <= Date.now())
        throw new Error('This request expired. Please scan again.');
      if (!(await verifyApprovalPin(pin, storedHash, salt))) {
        setError('PIN did not match. Please try again.');
        setPin('');
        return;
      }
      setPin('');
      setStage('issuing');
      send(
        IssuerScreenTabEvents.CREDENTIAL_OFFER_VIA_DEEP_LINK(request.offerUri),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not approve this request.',
      );
      setStage('error');
    } finally {
      submitting.current = false;
      setPinBusy(false);
    }
  };

  useEffect(() => {
    if (stage !== 'issuing') return;
    if (
      state.matches(
        'credentialDownloadFromOffer.credentialOfferDownloadConsent',
      )
    ) {
      if (
        state.context.credentialOfferCredentialIssuer !==
        reviewed.current?.issuer
      ) {
        setError('The credential issuer does not match your approved request.');
        setStage('error');
        return;
      }
      // The review and local PIN already supplied explicit consent for this issuer.
      send(IssuerScreenTabEvents.ON_CONSENT_GIVEN());
    }
    if (
      state.matches('error') ||
      state.matches('handleVCVerificationFailure')
    ) {
      setError(
        'Could not retrieve or verify the credential. Please scan again.',
      );
      setStage('error');
    }
    if (
      state.context.authEndpointToOpen ||
      state.context.isTransactionCodeRequested
    ) {
      setError(
        'This demo offer requires an unexpected extra sign-in. Please scan again.',
      );
      setStage('error');
    }
  }, [state, send, stage]);

  useEffect(() => {
    if (!state.done || stage !== 'issuing') return;
    const key = state.context.vcMetadata.getVcKey();
    // SET acknowledges only after both encrypted data and its HMAC are saved.
    // Reading during concurrent storage writes can falsely flag tampering.
    if (savedKeys.includes(key) && state.context.vcMetadata.isVerified) {
      setStage('success');
      return;
    }
    const timeout = setTimeout(() => {
      setError('The credential could not be saved. Please try again.');
      setStage('error');
    }, 15000);
    return () => clearTimeout(timeout);
  }, [state, stage, savedKeys]);

  return {
    stage,
    request,
    pin,
    setPin,
    pinBusy,
    error,
    scan,
    approve,
    review: () => {
      setPin('');
      setError('');
      setStage('review');
    },
    enterPin: () => {
      setPin('');
      setError('');
      setStage('pin');
    },
    reject: () => {
      reviewed.current = null;
      setRequest(null);
      setPin('');
      setStage('rejected');
    },
  };
}
