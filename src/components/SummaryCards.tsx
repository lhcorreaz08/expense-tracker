'use client';

import { Expense } from '@/types/expense';
import { formatCurrency, getCurrentMonthKey } from '@/lib/utils';

interface Props {
  expenses: Expense[];
}

export default function SummaryCards({ expenses }: Props) {
  const currentMonth = getCurrentMonthKey();

  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0);

  const thisMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  // Average monthly over the last 6 months
  const months = Array.from(new Set(expenses.map((e) => e.date.slice(0, 7))));
  const avgMonthly = months.length > 0 ? totalAllTime / months.length : 0;

  // Top category this month
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const cards = [
    {
      label: 'Total All Time',
      value: formatCurrency(totalAllTime),
      sub: `${expenses.length} expenses`,
      color: 'bg-indigo-600',
      icon: '💰',
    },
    {
      label: 'This Month',
      value: formatCurrency(totalThisMonth),
      sub: `${thisMonthExpenses.length} expenses`,
      color: 'bg-violet-600',
      icon: '📅',
    },
    {
      label: 'Monthly Average',
      value: formatCurrency(avgMonthly),
      sub: `across ${months.length} month${months.length !== 1 ? 's' : ''}`,
      color: 'bg-sky-600',
      icon: '📊',
    },
    {
      label: 'Top Category',
      value: topCategory,
      sub: catTotals[topCategory] ? formatCurrency(catTotals[topCategory]) : '',
      color: 'bg-emerald-600',
      icon: '🏆',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">{card.icon}</span>
            <span className={`${card.color} text-white text-xs font-medium px-2 py-0.5 rounded-full`}>
              {card.label}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 truncate">{card.value}</p>
          <p className="text-sm text-slate-500 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
