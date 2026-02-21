'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useExpenses, ExpenseInput } from '@/hooks/useExpenses';
import ExpenseForm from '@/components/ExpenseForm';
import Link from 'next/link';

function AddExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const { addExpense, updateExpense, getExpense } = useExpenses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const existingExpense = editId ? getExpense(editId) : undefined;
  const isEditing = !!existingExpense;

  function handleSubmit(data: ExpenseInput) {
    setIsSubmitting(true);
    if (isEditing && editId) {
      updateExpense(editId, data);
    } else {
      addExpense(data);
    }
    setSuccess(true);
    setIsSubmitting(false);
    // Redirect after brief success state
    setTimeout(() => router.push('/expenses'), 800);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-slate-800">
          {isEditing ? 'Expense updated!' : 'Expense added!'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">Redirecting to your expenses…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/expenses" className="hover:text-slate-800 transition-colors">
            Expenses
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditing ? 'Edit Expense' : 'New Expense'}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isEditing ? 'Update the details below.' : 'Fill in the details to record your expense.'}
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <ExpenseForm
          initialValues={
            existingExpense
              ? {
                  date: existingExpense.date,
                  amount: existingExpense.amount,
                  category: existingExpense.category,
                  description: existingExpense.description,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => router.push('/expenses')}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? 'Save Changes' : 'Add Expense'}
        />
      </div>
    </div>
  );
}

export default function AddPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto bg-white rounded-xl h-96 animate-pulse border border-slate-100" />}>
      <AddExpenseContent />
    </Suspense>
  );
}
