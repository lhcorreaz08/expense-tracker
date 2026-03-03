'use client';

import { useState, useMemo } from 'react';
import { Expense, ExpenseFilters, CATEGORY_BADGE, CATEGORY_ICONS } from '@/types/expense';
import { formatCurrency, formatDate, exportToCSV } from '@/lib/utils';
import { ExpenseInput } from '@/hooks/useExpenses';
import FilterBar from './FilterBar';
import ExpenseForm from './ExpenseForm';

interface Props {
  expenses: Expense[];
  onUpdate: (id: string, data: ExpenseInput) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_FILTERS: ExpenseFilters = {
  search: '',
  category: 'All',
  startDate: '',
  endDate: '',
  sortBy: 'date-desc',
};

export default function ExpenseList({ expenses, onUpdate, onDelete }: Props) {
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // Memoised: only recomputes when expenses or filters change,
  // preventing unnecessary O(n log n) work on unrelated re-renders
  // (e.g. toast appearing, modal opening/closing).
  const filtered = useMemo(
    () =>
      expenses
        .filter((e) => {
          if (filters.category !== 'All' && e.category !== filters.category) return false;
          if (filters.startDate && e.date < filters.startDate) return false;
          if (filters.endDate && e.date > filters.endDate) return false;
          if (filters.search) {
            const q = filters.search.toLowerCase();
            if (!e.description.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q))
              return false;
          }
          return true;
        })
        .sort((a, b) => {
          switch (filters.sortBy) {
            case 'date-asc': return a.date.localeCompare(b.date);
            case 'date-desc': return b.date.localeCompare(a.date);
            case 'amount-asc': return a.amount - b.amount;
            case 'amount-desc': return b.amount - a.amount;
            default: return 0;
          }
        }),
    [expenses, filters],
  );

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  function handleUpdate(id: string, data: ExpenseInput) {
    onUpdate(id, data);
    setEditingId(null);
    showToast('Expense updated.');
  }

  function handleDelete(id: string) {
    onDelete(id);
    setDeletingId(null);
    showToast('Expense deleted.');
  }

  const editingExpense = editingId ? expenses.find((e) => e.id === editingId) : null;

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{filtered.length}</span> expense
          {filtered.length !== 1 ? 's' : ''} &middot; total:{' '}
          <span className="font-semibold text-slate-800">{formatCurrency(filteredTotal)}</span>
        </p>
        <button
          onClick={() => exportToCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-600 font-medium">No expenses found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Description
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Category
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Amount
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 max-w-xs">
                      <span className="line-clamp-1">{expense.description}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_BADGE[expense.category]}`}
                      >
                        {CATEGORY_ICONS[expense.category]} {expense.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingId(expense.id)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(expense.id)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-slate-100">
            {filtered.map((expense) => (
              <div key={expense.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {expense.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_BADGE[expense.category]}`}
                      >
                        {CATEGORY_ICONS[expense.category]} {expense.category}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(expense.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingId(expense.id)}
                        className="px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingId(expense.id)}
                        className="px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Edit Expense</h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <ExpenseForm
              initialValues={{
                date: editingExpense.date,
                amount: editingExpense.amount,
                category: editingExpense.category,
                description: editingExpense.description,
              }}
              onSubmit={(data) => handleUpdate(editingExpense.id, data)}
              onCancel={() => setEditingId(null)}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Delete expense?</h2>
            <p className="text-sm text-slate-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
