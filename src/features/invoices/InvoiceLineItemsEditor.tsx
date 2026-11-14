import {Plus, Trash2} from 'lucide-react';
import type {FieldArrayWithId, FieldErrors, UseFormRegister} from 'react-hook-form';
import type {InvoiceFormValues} from '@/types/portal';
import {formatBDT} from '@/utils/format';

interface InvoiceLineItemsEditorProps {
  fields: FieldArrayWithId<InvoiceFormValues, 'lineItems', 'id'>[];
  watchedItems: InvoiceFormValues['lineItems'];
  errors: FieldErrors<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function InvoiceLineItemsEditor({
  fields,
  watchedItems,
  errors,
  register,
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
        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Line Items (BDT)
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add Item</span>
        </button>
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
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-3 space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    aria-label={`Line item ${index + 1} description`}
                    placeholder="e.g. Flutter App Milestone 1 - Auth & UI"
                    {...register(`lineItems.${index}.description`)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                  />
                  {itemErrors?.description && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {itemErrors.description.message}
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-indigo-600"
                  />
                  {itemErrors?.quantity && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {itemErrors.quantity.message}
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-indigo-600"
                  />
                  {itemErrors?.unitPrice && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {itemErrors.unitPrice.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-1.5">
                  <span className="sm:hidden text-xs font-medium text-slate-500">
                    {formatBDT(rowTotal)}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      aria-label={`Remove line item ${index + 1}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex justify-end text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Line total:{' '}
                <span className="ml-1 font-semibold text-slate-900 dark:text-slate-100">
                  {formatBDT(rowTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {errors.lineItems?.message && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.lineItems.message}</p>
      )}

      <div className="flex items-center justify-end gap-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 px-4 py-3">
        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
          Invoice Total:
        </span>
        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
          {formatBDT(computedTotal)}
        </span>
      </div>
    </div>
  );
}
