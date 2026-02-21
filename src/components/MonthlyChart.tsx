'use client';

import { Expense } from '@/types/expense';
import { formatCurrency, getLast6Months, getMonthLabel } from '@/lib/utils';

interface Props {
  expenses: Expense[];
}

export default function MonthlyChart({ expenses }: Props) {
  const months = getLast6Months();

  const data = months.map((monthKey) => {
    const total = expenses
      .filter((e) => e.date.startsWith(monthKey))
      .reduce((s, e) => s + e.amount, 0);
    return { monthKey, label: getMonthLabel(monthKey), total };
  });

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-6">Monthly Spending</h2>

      <div className="flex items-end gap-3 h-40">
        {data.map((month) => {
          const pct = (month.total / maxTotal) * 100;
          const isEmpty = month.total === 0;
          return (
            <div key={month.monthKey} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip amount */}
              <span
                className={`text-xs font-medium transition-opacity ${
                  isEmpty ? 'text-slate-300' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                }`}
              >
                {isEmpty ? '—' : formatCurrency(month.total)}
              </span>
              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: '120px' }}>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    isEmpty ? 'bg-slate-100' : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
                  style={{ height: isEmpty ? '4px' : `${Math.max(pct, 4)}%` }}
                />
              </div>
              {/* Label */}
              <span className="text-xs text-slate-500">{month.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
