import {getErrorMessage} from '@/services/serviceUtils';

export function getFriendlyPaymentError(err: unknown): string {
  return getErrorMessage(
    err,
    'Unable to process your payment submission. Please try again shortly.',
  );
}
