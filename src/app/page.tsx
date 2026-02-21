'use client';

import Link from 'next/link';
import { useExpenses } from '@/hooks/useExpenses';
import SummaryCards from '@/components/SummaryCards';
import MonthlyChart from '@/components/MonthlyChart';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import { formatCurrency, formatDate, getCurrentMonthKey, exportToCSV } from '@/lib/utils';
import { CATEGORY_BADGE, CATEGORY_ICONS } from '@/types/expense';

export default function DashboardPage() {
  const { expenses, isLoaded } = useExpenses();

  if (!isLoaded) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-28 border border-slate-100" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl h-64 border border-slate-100" />
          <div className="bg-white rounded-xl h-64 border border-slate-100" />
        </div>
      </div>
    );
  }

  const currentMonth = getCurrentMonthKey();
  const recentExpenses = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const thisMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track and manage your spending</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(expenses)}
            disabled={expenses.length === 0}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            ↓ Export Data
          </button>
          <Link
            href="/add"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards expenses={expenses} />

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <MonthlyChart expenses={expenses} />
        <CategoryBreakdown expenses={expenses} />
      </div>

      {/* Recent expenses */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Recent Expenses</h2>
          <Link
            href="/expenses"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-slate-600 font-medium">No expenses yet</p>
            <p className="text-sm text-slate-400 mt-1">
              <Link href="/add" className="text-indigo-600 hover:underline">
                Add your first expense
              </Link>{' '}
              to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center px-6 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_BADGE[expense.category]}`}
                    >
                      {CATEGORY_ICONS[expense.category]} {expense.category}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(expense.date)}</span>
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold text-slate-800 whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* This month banner */}
      {thisMonthExpenses.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium">This month you&apos;ve spent</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(thisMonthExpenses.reduce((s, e) => s + e.amount, 0))}
              </p>
              <p className="text-indigo-200 text-sm mt-1">
                across {thisMonthExpenses.length} expense
                {thisMonthExpenses.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/expenses"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              See details →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
