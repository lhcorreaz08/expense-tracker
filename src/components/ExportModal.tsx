'use client';

import { useState, useMemo, useEffect } from 'react';
import { Expense, CATEGORIES, Category, CATEGORY_ICONS } from '@/types/expense';
import { formatCurrency, formatDate, getCurrentDateString } from '@/lib/utils';

interface Props {
  expenses: Expense[];
  onClose: () => void;
}

type ExportFormat = 'csv' | 'json' | 'pdf';

// ─── Export engine ────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function runCSV(expenses: Expense[], filename: string) {
  const header = ['Date', 'Category', 'Amount', 'Description'].join(',');
  const rows = expenses.map((e) =>
    [e.date, e.category, e.amount.toFixed(2), `"${e.description.replace(/"/g, '""')}"`].join(',')
  );
  triggerDownload(
    new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }),
    filename
  );
}

function runJSON(expenses: Expense[], filename: string) {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: parseFloat(expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)),
    expenses: expenses.map(({ date, category, amount, description }) => ({
      date,
      category,
      amount,
      description,
    })),
  };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    filename
  );
}

function runPDF(expenses: Expense[]) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const rows = expenses
    .map(
      (e) => `<tr>
      <td>${formatDate(e.date)}</td>
      <td>${e.category}</td>
      <td class="amt">$${e.amount.toFixed(2)}</td>
      <td>${e.description}</td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Expense Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;padding:40px;font-size:13px}
    h1{font-size:24px;font-weight:700;margin-bottom:4px}
    .subtitle{color:#64748b;margin-bottom:28px}
    table{width:100%;border-collapse:collapse}
    th{background:#f1f5f9;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#475569;font-weight:600}
    td{padding:10px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top}
    .amt{text-align:right;font-weight:600;white-space:nowrap}
    th.amt{text-align:right}
    .footer{margin-top:20px;text-align:right;font-size:15px;font-weight:700}
    .footer span{color:#6366f1}
    @media print{body{padding:20px}}
  </style>
  </head><body>
  <h1>Expense Report</h1>
  <p class="subtitle">Generated ${generated} &nbsp;·&nbsp; ${expenses.length} record${expenses.length !== 1 ? 's' : ''}</p>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th class="amt">Amount</th><th>Description</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">Total: <span>$${total.toFixed(2)}</span></p>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { id: ExportFormat; label: string; icon: string; desc: string }[] = [
  { id: 'csv',  label: 'CSV',  icon: '📊', desc: 'Spreadsheet ready' },
  { id: 'json', label: 'JSON', icon: '{ }', desc: 'Developer friendly' },
  { id: 'pdf',  label: 'PDF',  icon: '📄', desc: 'Print ready' },
];

export default function ExportModal({ expenses, onClose }: Props) {
  const today = getCurrentDateString();

  const [format, setFormat]             = useState<ExportFormat>('csv');
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');
  const [cats, setCats]                 = useState<Set<Category>>(new Set(CATEGORIES));
  const [filename, setFilename]         = useState(`expenses-${today}`);
  const [isExporting, setIsExporting]   = useState(false);
  const [done, setDone]                 = useState(false);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (startDate && e.date < startDate) return false;
        if (endDate   && e.date > endDate)   return false;
        if (!cats.has(e.category))           return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, startDate, endDate, cats]);

  const preview  = filtered.slice(0, 5);
  const hasMore  = filtered.length > 5;
  const total    = filtered.reduce((s, e) => s + e.amount, 0);

  function toggleCat(cat: Category) {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  }

  async function handleExport() {
    if (filtered.length === 0 || isExporting) return;
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 700)); // intentional UX delay

    const fname = `${filename.trim() || `expenses-${today}`}.${format}`;
    if (format === 'csv')  runCSV(filtered, fname);
    if (format === 'json') runJSON(filtered, fname);
    if (format === 'pdf')  runPDF(filtered);

    setIsExporting(false);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const inputCls =
    'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Export Data</h2>
            <p className="text-sm text-slate-500">Configure your export, preview, then download</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto">
          <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-full">

            {/* LEFT – Options */}
            <div className="p-6 space-y-6">

              {/* Format */}
              <section>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Export Format
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormat(opt.id)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                        format === opt.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl leading-none">{opt.icon}</span>
                      <span className="font-bold text-sm mt-1">{opt.label}</span>
                      <span className={`text-xs ${format === opt.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Date range */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date Range
                  </h3>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">From</label>
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || today}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">To</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      max={today}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>

              {/* Categories */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Categories
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setCats(new Set(CATEGORIES))}
                      className="text-indigo-600 hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setCats(new Set())}
                      className="text-indigo-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                        cats.has(cat)
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={cats.has(cat)}
                        onChange={() => toggleCat(cat)}
                        className="accent-indigo-600 w-3.5 h-3.5"
                      />
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span className="text-sm text-slate-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Filename */}
              <section>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Filename
                </h3>
                <div className="flex">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder={`expenses-${today}`}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-l-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
                  />
                  <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500 font-medium">
                    .{format}
                  </span>
                </div>
              </section>
            </div>

            {/* RIGHT – Preview */}
            <div className="p-6 flex flex-col gap-5">

              {/* Summary card */}
              <div
                className={`rounded-xl p-4 border flex items-start gap-3 ${
                  filtered.length === 0
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-emerald-50 border-emerald-100'
                }`}
              >
                <span className="text-2xl leading-none mt-0.5">
                  {filtered.length === 0 ? '⚠️' : '✅'}
                </span>
                <div>
                  <p className={`font-semibold text-sm ${filtered.length === 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {filtered.length === 0
                      ? 'No records match your filters'
                      : `${filtered.length} record${filtered.length !== 1 ? 's' : ''} ready to export`}
                  </p>
                  {filtered.length > 0 && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Total amount: <span className="font-semibold">{formatCurrency(total)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Preview table */}
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Preview {preview.length > 0 ? `— first ${preview.length} rows` : ''}
                </h3>

                {preview.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-12 text-center">
                    <span className="text-3xl mb-2">🔍</span>
                    <p className="text-sm text-slate-400">No data to preview.</p>
                    <p className="text-xs text-slate-300 mt-1">Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-2.5 text-left text-slate-500 font-semibold">Date</th>
                          <th className="px-3 py-2.5 text-left text-slate-500 font-semibold">Category</th>
                          <th className="px-3 py-2.5 text-right text-slate-500 font-semibold">Amount</th>
                          <th className="px-3 py-2.5 text-left text-slate-500 font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {preview.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                              {formatDate(e.date)}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">{e.category}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                              {formatCurrency(e.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 max-w-[140px] truncate">
                              {e.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {hasMore && (
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-400">
                        + {filtered.length - 5} more records not shown in preview
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Format-specific hint */}
              <p className="text-xs text-slate-400 italic">
                {format === 'csv'  && 'Compatible with Excel, Google Sheets, and Numbers.'}
                {format === 'json' && 'Structured JSON with metadata, totals, and all expense fields.'}
                {format === 'pdf'  && 'Opens a formatted print dialog — choose "Save as PDF" in your browser.'}
              </p>
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-500 uppercase">{format}</span>
            {' · '}
            {cats.size}/{CATEGORIES.length} categories
            {(startDate || endDate) && ' · date filtered'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0 || isExporting}
              className={`min-w-40 flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                done
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white'
              }`}
            >
              {isExporting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exporting…
                </>
              ) : done ? (
                '✓ Done!'
              ) : (
                `Export ${filtered.length > 0 ? `${filtered.length} records` : ''} ↓`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
