'use client';

import { ExpenseFilters } from '@/types/expense';
import { CATEGORIES } from '@/types/expense';

interface Props {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  onReset: () => void;
}

export default function FilterBar({ filters, onChange, onReset }: Props) {
  const inputClass =
    'px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white transition-colors';

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search expenses…"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className={`${inputClass} pl-8 w-full`}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as ExpenseFilters['category'] })}
            className={inputClass}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* End date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sort by</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as ExpenseFilters['sortBy'] })}
            className={inputClass}
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
