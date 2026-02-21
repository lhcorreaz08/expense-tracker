'use client';

import { useExpenses } from '@/hooks/useExpenses';
import ExpenseList from '@/components/ExpenseList';
import Link from 'next/link';

export default function ExpensesPage() {
  const { expenses, isLoaded, updateExpense, deleteExpense } = useExpenses();

  if (!isLoaded) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white rounded-xl h-16 border border-slate-100" />
        <div className="bg-white rounded-xl h-96 border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Link
          href="/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Expense
        </Link>
      </div>

      <ExpenseList
        expenses={expenses}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />
    </div>
  );
}
