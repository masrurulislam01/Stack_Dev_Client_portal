import {AlertCircle, Plus, Trash2} from 'lucide-react';
import type {FieldArrayWithId, FieldErrors, UseFormRegister} from 'react-hook-form';
import {Button} from '@/components/ui';
import type {InvoiceFormValues} from '@/types/portal';
import {formatBDT} from '@/utils/format';

interface InvoiceLineItemsEditorProps {
  fields: FieldArrayWithId<InvoiceFormValues, 'lineItems', 'id'>[];
  watchedItems: InvoiceFormValues['lineItems'];
  errors: FieldErrors<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function InvoiceLineItemsEditor({
  fields,
  watchedItems,
  errors,
  register,
  disabled = false,
  onAdd,
  onRemove,
}: InvoiceLineItemsEditorProps) {
  const computedTotal = (watchedItems ?? []).reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 0);
    const price = Number(item?.unitPrice ?? 0);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
    return sum + Math.max(0, qty) * Math.max(0, price);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[13px] font-semibold text-foreground">Line Items (BDT)</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onAdd}
          icon={<Plus className="w-3.5 h-3.5 text-primary-600" aria-hidden="true" />}
          className="border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
        >
          Add Item
        </Button>
      </div>

      <div className="space-y-2.5">
        {fields.map((field, index) => {
          const qty = Number(watchedItems?.[index]?.quantity ?? 0);
          const price = Number(watchedItems?.[index]?.unitPrice ?? 0);
          const rowTotal =
            Number.isFinite(qty) && Number.isFinite(price)
              ? Math.max(0, qty) * Math.max(0, price)
              : 0;
          const itemErrors = errors.lineItems?.[index];

          return (
            <div
              key={field.id}
              className="rounded-xl border border-border bg-surface-muted/60 p-3 space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    aria-label={`Line item ${index + 1} description`}
                    placeholder="e.g. Flutter App Milestone 1 - Auth & UI"
                    {...register(`lineItems.${index}.description`)}
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
                      itemErrors?.description
                        ? 'border-danger focus:border-danger'
                        : 'border-border hover:border-border-strong focus:border-primary-600'
                    }`}
                  />
                  {itemErrors?.description && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger-text">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{itemErrors.description.message}</span>
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    step="1"
                    aria-label={`Line item ${index + 1} quantity`}
                    placeholder="Qty"
                    {...register(`lineItems.${index}.quantity`)}
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle num transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
                      itemErrors?.quantity
                        ? 'border-danger focus:border-danger'
                        : 'border-border hover:border-border-strong focus:border-primary-600'
                    }`}
                  />
                  {itemErrors?.quantity && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger-text">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{itemErrors.quantity.message}</span>
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    aria-label={`Line item ${index + 1} unit price in BDT`}
                    placeholder="Unit Price (৳)"
                    {...register(`lineItems.${index}.unitPrice`)}
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle num transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
                      itemErrors?.unitPrice
                        ? 'border-danger focus:border-danger'
                        : 'border-border hover:border-border-strong focus:border-primary-600'
                    }`}
                  />
                  {itemErrors?.unitPrice && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger-text">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{itemErrors.unitPrice.message}</span>
                    </p>
                  )}
                </div>

                <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-0.5">
                  <span className="sm:hidden text-xs font-semibold text-muted num">
                    {formatBDT(rowTotal)}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemove(index)}
                      aria-label={`Remove line item ${index + 1}`}
                      className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] p-2 rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex justify-end text-xs text-muted num">
                Line total:{' '}
                <span className="ml-1 font-semibold text-foreground">{formatBDT(rowTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {errors.lineItems?.message && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-danger-text">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{errors.lineItems.message}</span>
        </p>
      )}

      <div className="flex items-center justify-end gap-3 rounded-xl bg-primary-50 border border-primary-200 px-4 py-3">
        <span className="text-sm font-medium text-primary-700">Invoice Total:</span>
        <span className="font-heading text-lg font-bold text-primary-600 num">
          {formatBDT(computedTotal)}
        </span>
      </div>
    </div>
  );
}
