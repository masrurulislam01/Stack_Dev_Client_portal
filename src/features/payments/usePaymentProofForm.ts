import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import type {PaymentSubmissionMethod} from '@/config/constants';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  PaymentSubmissionFormParsed,
  PaymentSubmissionFormValues,
  PaymentSubmissionRecord,
} from '@/types/portal';
import {paymentSubmissionFormSchema} from '@/types/schemas';

interface UsePaymentProofFormArgs {
  invoiceId: string;
  invoiceAmount: number;
  existingSubmissions: PaymentSubmissionRecord[];
  onMethodChange: (method: PaymentSubmissionMethod) => void;
  onSubmitProof: (values: PaymentSubmissionFormParsed) => Promise<void>;
  onSuccessReset: () => void;
}

export function usePaymentProofForm({
  invoiceId,
  invoiceAmount,
  existingSubmissions,
  onMethodChange,
  onSubmitProof,
  onSuccessReset,
}: UsePaymentProofFormArgs) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PaymentSubmissionFormValues, unknown, PaymentSubmissionFormParsed>({
    resolver: zodResolver(paymentSubmissionFormSchema),
    defaultValues: {
      method: 'bKash',
      senderNumber: '',
      transactionId: '',
      amountBdt: invoiceAmount,
    },
  });

  const {reset, setError} = form;

  useEffect(() => {
    reset({
      method: 'bKash',
      senderNumber: '',
      transactionId: '',
      amountBdt: invoiceAmount,
    });
    onMethodChange('bKash');
    setSubmitError(null);
  }, [invoiceId, invoiceAmount, reset, onMethodChange]);

  const onSubmit = async (values: PaymentSubmissionFormParsed) => {
    setSubmitError(null);
    const normalizedTrx = values.transactionId.trim().toLowerCase();
    const alreadySubmitted = (existingSubmissions ?? []).some(
      (sub) => (sub.transactionId ?? '').trim().toLowerCase() === normalizedTrx,
    );
    if (alreadySubmitted) {
      setError('transactionId', {
        type: 'manual',
        message: 'This Transaction ID has already been submitted for this invoice.',
      });
      return;
    }

    try {
      await onSubmitProof(values);
      reset({
        method: values.method,
        senderNumber: '',
        transactionId: '',
        amountBdt: invoiceAmount,
      });
      onSuccessReset();
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to submit payment details.');
      if (msg.toLowerCase().includes('transaction id')) {
        setError('transactionId', {type: 'manual', message: msg});
      } else {
        setSubmitError(msg);
      }
    }
  };

  return {
    register: form.register,
    setValue: form.setValue,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    submitError,
    handleFormSubmit: form.handleSubmit(onSubmit),
  };
}
