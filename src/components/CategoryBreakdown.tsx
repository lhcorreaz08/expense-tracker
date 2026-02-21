'use client';

import { Expense, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';

interface Props {
  expenses: Expense[];
}

export default function CategoryBreakdown({ expenses }: Props) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const data = CATEGORIES.map((cat) => {
    const catTotal = expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
    return {
      category: cat,
      total: catTotal,
      pct: total > 0 ? (catTotal / total) * 100 : 0,
      color: CATEGORY_COLORS[cat],
      icon: CATEGORY_ICONS[cat],
    };
  })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Spending by Category</h2>
        <p className="text-sm text-slate-400 text-center py-8">No expense data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-5">Spending by Category</h2>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <span>{item.icon}</span>
                <span className="font-medium">{item.category}</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{item.pct.toFixed(1)}%</span>
                <span className="text-sm font-semibold text-slate-800 w-20 text-right">
                  {formatCurrency(item.total)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
