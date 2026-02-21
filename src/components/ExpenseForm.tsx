'use client';

import { useState, FormEvent } from 'react';
import { CATEGORIES, Category, CATEGORY_ICONS } from '@/types/expense';
import { ExpenseInput } from '@/hooks/useExpenses';
import { getCurrentDateString } from '@/lib/utils';

interface Props {
  initialValues?: ExpenseInput;
  onSubmit: (data: ExpenseInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

interface FormErrors {
  date?: string;
  amount?: string;
  category?: string;
  description?: string;
}

export default function ExpenseForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Add Expense',
}: Props) {
  const today = getCurrentDateString();

  const [form, setForm] = useState<{
    date: string;
    amount: string;
    category: string;
    description: string;
  }>({
    date: initialValues?.date ?? today,
    amount: initialValues?.amount?.toString() ?? '',
    category: initialValues?.category ?? '',
    description: initialValues?.description ?? '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.date) errs.date = 'Date is required.';
    else if (form.date > today) errs.date = 'Date cannot be in the future.';

    const amt = parseFloat(form.amount);
    if (!form.amount) errs.amount = 'Amount is required.';
    else if (isNaN(amt) || amt <= 0) errs.amount = 'Amount must be a positive number.';
    else if (amt > 1_000_000) errs.amount = 'Amount seems too large.';

    if (!form.category) errs.category = 'Please select a category.';

    const desc = form.description.trim();
    if (!desc) errs.description = 'Description is required.';
    else if (desc.length < 3) errs.description = 'At least 3 characters needed.';
    else if (desc.length > 120) errs.description = 'Max 120 characters.';

    return errs;
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(validate());
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const allTouched = { date: true, amount: true, category: true, description: true };
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      date: form.date,
      amount: parseFloat(parseFloat(form.amount).toFixed(2)),
      category: form.category as Category,
      description: form.description.trim(),
    });
  }

  const inputBase =
    'w-full px-3 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition-colors';
  const inputNormal = `${inputBase} border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 bg-white`;
  const inputError = `${inputBase} border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
        <input
          type="date"
          max={today}
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
          onBlur={() => handleBlur('date')}
          className={touched.date && errors.date ? inputError : inputNormal}
        />
        {touched.date && errors.date && (
          <p className="mt-1 text-xs text-red-600">{errors.date}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
            $
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            onBlur={() => handleBlur('amount')}
            className={`pl-7 ${touched.amount && errors.amount ? inputError : inputNormal}`}
          />
        </div>
        {touched.amount && errors.amount && (
          <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange('category', cat)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                form.category === cat
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
        {touched.category && errors.category && (
          <p className="mt-1 text-xs text-red-600">{errors.category}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <input
          type="text"
          placeholder="What was this expense for?"
          maxLength={120}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          className={touched.description && errors.description ? inputError : inputNormal}
        />
        <div className="flex justify-between mt-1">
          {touched.description && errors.description ? (
            <p className="text-xs text-red-600">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-400">{form.description.length}/120</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
