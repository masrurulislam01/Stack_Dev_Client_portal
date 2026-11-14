import type {PaymentSubmissionMethod} from '../types/portal';

export interface PaymentChannelInfo {
  readonly label: string;
  readonly accountType: string;
  readonly number: string;
  readonly instructions: string;
}

/**
 * Editable payment numbers displayed to clients in the invoice "Pay Now" panel.
 * Update these numbers with your active bKash, Nagad, and Bank account details.
 */
export const PAYMENT_NUMBERS: Record<PaymentSubmissionMethod, PaymentChannelInfo> = {
  bKash: {
    label: 'bKash',
    accountType: 'Personal (Send Money)',
    number: '01963-131282',
    instructions: 'Open bKash app → Send Money → Enter the number and exact amount.',
  },
  Nagad: {
    label: 'Nagad',
    accountType: 'Personal (Send Money)',
    number: '01963-131282',
    instructions: 'Open Nagad app → Send Money → Enter the number and exact amount.',
  },
  Bank: {
    label: 'Bank Transfer',
    accountType: 'Bank Account / NPSB / BEFTN',
    number: 'Stack Dev · Contact team for bank account details',
    instructions: 'Complete a bank transfer for the exact BDT amount and enter your bank reference ID.',
  },
};
