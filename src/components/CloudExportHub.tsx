'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency, getCurrentDateString, getCurrentMonthKey } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'templates' | 'integrations' | 'schedule' | 'history';

interface HistoryEntry {
  id: string;
  template: string;
  format: string;
  records: number;
  destination: string;
  timestamp: string;
  fileSizeKb: number;
  shareId?: string;
}

interface IntegrationStatus {
  connected: boolean;
  account?: string;
  lastSync?: string;
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'json';
  destination: string;
  email: string;
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
}

interface Props {
  expenses: Expense[];
  onClose: () => void;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const INTEGRATION_DEFS = [
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    tagline: 'Live spreadsheet that auto-refreshes on each export',
    icon: '📗',
    dot: 'bg-green-500',
    ring: 'ring-green-200',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-200',
    fakeAccount: 'workspace@gsuite.com',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    tagline: 'Save every export automatically to /Apps/ExpenseTracker',
    icon: '📦',
    dot: 'bg-blue-600',
    ring: 'ring-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    fakeAccount: 'user@dropbox.com',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    tagline: 'Sync exports to your Microsoft 365 cloud storage',
    icon: '☁️',
    dot: 'bg-sky-500',
    ring: 'ring-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    border: 'border-sky-200',
    fakeAccount: 'user@outlook.com',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    tagline: 'Email expense reports to yourself or your accountant',
    icon: '✉️',
    dot: 'bg-red-500',
    ring: 'ring-red-200',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-200',
    fakeAccount: 'user@gmail.com',
  },
  {
    id: 'slack',
    name: 'Slack',
    tagline: 'Post monthly spending summaries to any channel',
    icon: '💬',
    dot: 'bg-purple-600',
    ring: 'ring-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200',
    fakeAccount: '#finance-reports',
  },
];

const TEMPLATE_DEFS = [
  {
    id: 'tax-report',
    name: 'Tax Report',
    description: 'Current year expenses grouped by category — ready for your accountant.',
    icon: '🏛️',
    gradient: 'from-amber-400 to-orange-500',
    format: 'csv' as const,
    badge: 'Accounting',
    filter: (expenses: Expense[]) => {
      const year = getCurrentDateString().slice(0, 4);
      return expenses.filter((e) => e.date.startsWith(year));
    },
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: "This month's spending across all categories with subtotals.",
    icon: '📅',
    gradient: 'from-blue-400 to-indigo-600',
    format: 'csv' as const,
    badge: 'Finance review',
    filter: (expenses: Expense[]) => {
      const month = getCurrentMonthKey();
      return expenses.filter((e) => e.date.startsWith(month));
    },
  },
  {
    id: 'category-analysis',
    name: 'Category Analysis',
    description: 'All expenses sorted by category with percentage breakdown.',
    icon: '📊',
    gradient: 'from-violet-400 to-purple-600',
    format: 'json' as const,
    badge: 'Data analysis',
    filter: (expenses: Expense[]) =>
      [...expenses].sort((a, b) => a.category.localeCompare(b.category)),
  },
  {
    id: 'full-backup',
    name: 'Full Backup',
    description: 'Complete export of all records with timestamps and metadata.',
    icon: '🗄️',
    gradient: 'from-slate-500 to-slate-700',
    format: 'json' as const,
    badge: 'Full data',
    filter: (expenses: Expense[]) =>
      [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
  },
];

const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: false,
  frequency: 'monthly',
  format: 'csv',
  destination: 'gmail',
  email: '',
  time: '09:00',
  dayOfWeek: 1,
  dayOfMonth: 1,
};

const STORAGE = {
  history: 'expense-tracker-export-history-v1',
  integrations: 'expense-tracker-integrations-v1',
  schedule: 'expense-tracker-schedule-v1',
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(expenses: Expense[], filename: string) {
  const header = ['Date', 'Category', 'Amount', 'Description'].join(',');
  const rows = expenses.map((e) =>
    [e.date, e.category, e.amount.toFixed(2), `"${e.description.replace(/"/g, '""')}"`].join(',')
  );
  download(new Blob([[header, ...rows].join('\n')], { type: 'text/csv' }), filename);
}

function exportJSON(expenses: Expense[], filename: string, templateName: string) {
  const payload = {
    template: templateName,
    exportedAt: new Date().toISOString(),
    records: expenses.length,
    totalAmount: parseFloat(expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)),
    expenses: expenses.map(({ date, category, amount, description }) => ({
      date, category, amount, description,
    })),
  };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
}

function makeShareUrl(shareId: string) {
  return `https://expensetracker.app/s/${shareId}`;
}

function makeShareId() {
  return Math.random().toString(36).slice(2, 10);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getNextRunLabel(s: ScheduleConfig): string {
  if (!s.enabled) return 'Not scheduled';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const t = s.time;
  if (s.frequency === 'daily') return `Tomorrow at ${t}`;
  if (s.frequency === 'weekly') return `Next ${days[s.dayOfWeek]} at ${t}`;
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(s.dayOfMonth);
  return `${nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${t}`;
}

function seedHistory(today: string): HistoryEntry[] {
  const base = new Date(today).getTime();
  const ago = (days: number) => new Date(base - days * 86400000).toISOString();
  return [
    { id: 'h1', template: 'Monthly Summary',   format: 'CSV',  records: 18, destination: 'Google Sheets', timestamp: ago(2),  fileSizeKb: 1.2 },
    { id: 'h2', template: 'Tax Report',         format: 'CSV',  records: 25, destination: 'Gmail',         timestamp: ago(9),  fileSizeKb: 2.1 },
    { id: 'h3', template: 'Full Backup',        format: 'JSON', records: 25, destination: 'Dropbox',       timestamp: ago(16), fileSizeKb: 5.8 },
    { id: 'h4', template: 'Category Analysis',  format: 'JSON', records: 25, destination: 'Gmail',         timestamp: ago(31), fileSizeKb: 3.4 },
  ];
}

// ─── Decorative QR component ─────────────────────────────────────────────────

function DecoQR({ seed }: { seed: string }) {
  const N = 15;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  }

  const isFinder = (r: number, c: number) =>
    r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);

  const inCorner = (r: number, c: number): boolean | null => {
    if (r < 7 && c < 7) return isFinder(r, c);
    if (r < 7 && c >= N - 7) return isFinder(r, c - (N - 7));
    if (r >= N - 7 && c < 7) return isFinder(r - (N - 7), c);
    return null;
  };

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const corner = inCorner(r, c);
      const dark = corner !== null ? corner : Boolean((h ^ (r * 97 + c * 149)) & 1);
      if (dark) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1e293b" />);
    }
  }

  return (
    <svg viewBox={`0 0 ${N} ${N}`} width="64" height="64" className="rounded">
      <rect width={N} height={N} fill="white" />
      {cells}
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CloudExportHub({ expenses, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('templates');
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);
  const [shareEntry, setShareEntry] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE.history);
      setHistory(raw ? JSON.parse(raw) : seedHistory(getCurrentDateString()));
      const ri = localStorage.getItem(STORAGE.integrations);
      setIntegrations(ri ? JSON.parse(ri) : {});
      const rs = localStorage.getItem(STORAGE.schedule);
      setSchedule(rs ? JSON.parse(rs) : DEFAULT_SCHEDULE);
    } catch { /* ignore */ }
  }, []);

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const connectedCount = Object.values(integrations).filter((i) => i.connected).length;

  const persist = useCallback((key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, []);

  // ── Integration handlers ──────────────────────────────────────────────────

  async function handleConnect(integrationId: string) {
    setConnecting(integrationId);
    await new Promise((r) => setTimeout(r, 1800));
    const def = INTEGRATION_DEFS.find((d) => d.id === integrationId)!;
    const next = {
      ...integrations,
      [integrationId]: { connected: true, account: def.fakeAccount, lastSync: new Date().toISOString() },
    };
    setIntegrations(next);
    persist(STORAGE.integrations, next);
    setConnecting(null);
  }

  function handleDisconnect(integrationId: string) {
    const next = { ...integrations, [integrationId]: { connected: false } };
    setIntegrations(next);
    persist(STORAGE.integrations, next);
  }

  // ── Template export handler ───────────────────────────────────────────────

  async function handleTemplateExport(templateId: string) {
    const def = TEMPLATE_DEFS.find((t) => t.id === templateId)!;
    const filtered = def.filter(expenses);
    if (filtered.length === 0) return;

    setExporting(templateId);
    await new Promise((r) => setTimeout(r, 800));

    const today = getCurrentDateString();
    const filename = `${templateId}-${today}.${def.format}`;
    if (def.format === 'csv') exportCSV(filtered, filename);
    else exportJSON(filtered, filename, def.name);

    const entry: HistoryEntry = {
      id: makeShareId(),
      template: def.name,
      format: def.format.toUpperCase(),
      records: filtered.length,
      destination: 'Local download',
      timestamp: new Date().toISOString(),
      fileSizeKb: parseFloat((filtered.length * 0.2 + 0.4).toFixed(1)),
    };
    const nextHistory = [entry, ...history];
    setHistory(nextHistory);
    persist(STORAGE.history, nextHistory);

    setExporting(null);
    setExported(templateId);
    setTimeout(() => setExported(null), 2500);
  }

  // ── Schedule handler ──────────────────────────────────────────────────────

  function handleSaveSchedule() {
    persist(STORAGE.schedule, schedule);
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 2000);
  }

  // ── Share handler ─────────────────────────────────────────────────────────

  function handleShare(entryId: string) {
    const entry = history.find((h) => h.id === entryId)!;
    if (!entry.shareId) {
      const shareId = makeShareId();
      const next = history.map((h) => h.id === entryId ? { ...h, shareId } : h);
      setHistory(next);
      persist(STORAGE.history, next);
    }
    setShareEntry(entryId);
  }

  async function copyShareLink(shareId: string) {
    try {
      await navigator.clipboard.writeText(makeShareUrl(shareId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  // ── Insights (computed from expenses) ─────────────────────────────────────

  const insights = useMemo(() => {
    if (expenses.length === 0) return [];
    const currentMonth = getCurrentMonthKey();
    const lastMonthKey = (() => {
      const [y, m] = currentMonth.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const catTotals: Record<string, number> = {};
    expenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const topPct = grandTotal > 0 ? Math.round((topCat[1] / grandTotal) * 100) : 0;

    const thisMonth = expenses.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);
    const lastMonth = expenses.filter((e) => e.date.startsWith(lastMonthKey)).reduce((s, e) => s + e.amount, 0);
    const momChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

    const largest = [...expenses].sort((a, b) => b.amount - a.amount)[0];

    return [
      { icon: '🏆', text: `${topCat[0]} is your top category at ${topPct}% of total spending` },
      momChange !== null
        ? { icon: momChange > 0 ? '📈' : '📉', text: `You're spending ${Math.abs(momChange)}% ${momChange > 0 ? 'more' : 'less'} this month vs last month` }
        : null,
      { icon: '💸', text: `Your largest single expense is ${formatCurrency(largest.amount)} — ${largest.description}` },
    ].filter(Boolean) as { icon: string; text: string }[];
  }, [expenses]);

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderTemplates() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">Export Templates</h2>
          <p className="text-sm text-slate-500 mt-0.5">Pre-configured exports tailored for different purposes</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {TEMPLATE_DEFS.map((tpl) => {
            const filtered = tpl.filter(expenses);
            const isExportingThis = exporting === tpl.id;
            const isExportedThis = exported === tpl.id;

            return (
              <div key={tpl.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${tpl.gradient} p-4 flex items-center justify-between`}>
                  <span className="text-3xl">{tpl.icon}</span>
                  <span className="text-xs font-semibold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                    {tpl.badge}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{tpl.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium uppercase">{tpl.format}</span>
                    <span>{filtered.length} records</span>
                    {filtered.length === 0 && <span className="text-amber-500">— no data</span>}
                  </div>

                  <button
                    onClick={() => handleTemplateExport(tpl.id)}
                    disabled={filtered.length === 0 || isExportingThis}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isExportedThis
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white'
                    }`}
                  >
                    {isExportingThis ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Exporting…</>
                    ) : isExportedThis ? (
                      '✓ Downloaded!'
                    ) : (
                      'Export Now ↓'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">✨</span>
              <h3 className="text-sm font-semibold text-indigo-800">Smart Insights</h3>
            </div>
            <ul className="space-y-2">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-indigo-700">
                  <span className="mt-0.5 shrink-0">{ins.icon}</span>
                  <span>{ins.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  function renderIntegrations() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">Cloud Integrations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Connect your favourite services — {connectedCount} of {INTEGRATION_DEFS.length} active
          </p>
        </div>

        <div className="space-y-3">
          {INTEGRATION_DEFS.map((def) => {
            const status = integrations[def.id] || { connected: false };
            const isConnecting = connecting === def.id;

            return (
              <div key={def.id} className={`flex items-center gap-4 p-4 bg-white rounded-xl border ${status.connected ? def.border : 'border-slate-200'} shadow-sm transition-colors`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl shadow-sm shrink-0 ${status.connected ? `ring-2 ${def.ring}` : ''}`}>
                  {def.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">{def.name}</span>
                    {status.connected && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${def.badge}`}>
                        Connected
                      </span>
                    )}
                  </div>
                  {status.connected ? (
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${def.dot} inline-block`} />
                      <span>{status.account}</span>
                      {status.lastSync && (
                        <span className="text-slate-400">· synced {relativeTime(status.lastSync)}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">{def.tagline}</p>
                  )}
                </div>

                <button
                  onClick={() => status.connected ? handleDisconnect(def.id) : handleConnect(def.id)}
                  disabled={isConnecting}
                  className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all min-w-24 flex items-center justify-center gap-1.5 ${
                    status.connected
                      ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      : `${def.dot.replace('bg-', 'bg-')} text-white hover:opacity-90`
                  } ${status.connected ? '' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {isConnecting ? (
                    <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting</>
                  ) : status.connected ? (
                    'Disconnect'
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSchedule() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">Automatic Exports</h2>
          <p className="text-sm text-slate-500 mt-0.5">Set up recurring exports and never think about it again</p>
        </div>

        {/* Enable toggle */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${schedule.enabled ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Automatic Backups</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {schedule.enabled ? `Next export: ${getNextRunLabel(schedule)}` : 'Enable to set up recurring exports'}
            </p>
          </div>
          <button
            onClick={() => setSchedule((s) => ({ ...s, enabled: !s.enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${schedule.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule.enabled ? 'translate-x-6' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        <div className={`space-y-5 transition-opacity ${schedule.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {/* Frequency */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSchedule((s) => ({ ...s, frequency: f }))}
                  className={`py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${schedule.frequency === f ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Time + day options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Time</label>
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            {schedule.frequency === 'weekly' && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Day</label>
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) => setSchedule((s) => ({ ...s, dayOfWeek: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            {schedule.frequency === 'monthly' && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Day of month</label>
                <select
                  value={schedule.dayOfMonth}
                  onChange={(e) => setSchedule((s) => ({ ...s, dayOfMonth: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Format + Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Format</label>
              <select
                value={schedule.format}
                onChange={(e) => setSchedule((s) => ({ ...s, format: e.target.value as 'csv' | 'json' }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="csv">CSV — Spreadsheet</option>
                <option value="json">JSON — Developer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Send to</label>
              <select
                value={schedule.destination}
                onChange={(e) => setSchedule((s) => ({ ...s, destination: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="gmail">Gmail</option>
                <option value="google-sheets">Google Sheets</option>
                <option value="dropbox">Dropbox</option>
                <option value="onedrive">OneDrive</option>
                <option value="local">Local download</option>
              </select>
            </div>
          </div>

          {/* Email field if needed */}
          {schedule.destination === 'gmail' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Recipient email</label>
              <input
                type="email"
                value={schedule.email}
                onChange={(e) => setSchedule((s) => ({ ...s, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          )}

          {/* Next run preview */}
          {schedule.enabled && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-xl">⏰</span>
              <div>
                <p className="text-xs text-slate-500">Next scheduled run</p>
                <p className="text-sm font-semibold text-slate-800">{getNextRunLabel(schedule)}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSaveSchedule}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${scheduleSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          {scheduleSaved ? '✓ Schedule Saved!' : 'Save Schedule'}
        </button>
      </div>
    );
  }

  function renderHistory() {
    const activeEntry = shareEntry ? history.find((h) => h.id === shareEntry) : null;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Export History</h2>
            <p className="text-sm text-slate-500 mt-0.5">{history.length} exports on record</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => { setHistory([]); persist(STORAGE.history, []); setShareEntry(null); }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-slate-400">No exports yet. Use a template to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{entry.template}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {entry.format}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{entry.records} records</span>
                      <span>·</span>
                      <span>{entry.fileSizeKb} KB</span>
                      <span>·</span>
                      <span>{entry.destination}</span>
                      <span>·</span>
                      <span>{relativeTime(entry.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShare(entry.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${shareEntry === entry.id ? 'bg-indigo-100 text-indigo-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {entry.shareId ? '🔗 Shared' : 'Share'}
                    </button>
                  </div>
                </div>

                {/* Share panel */}
                {shareEntry === entry.id && activeEntry && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
                    <div className="flex items-start gap-4">
                      {/* QR */}
                      <div className="shrink-0 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <DecoQR seed={activeEntry.shareId || activeEntry.id} />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Share Link</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 truncate">
                              {makeShareUrl(activeEntry.shareId || activeEntry.id)}
                            </code>
                            <button
                              onClick={() => copyShareLink(activeEntry.shareId || activeEntry.id)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                            >
                              {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <label className="flex items-center gap-1.5">
                            <input type="radio" name="expiry" defaultChecked className="accent-indigo-600" />
                            <span>7 days</span>
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input type="radio" name="expiry" className="accent-indigo-600" />
                            <span>30 days</span>
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input type="radio" name="expiry" className="accent-indigo-600" />
                            <span>Never</span>
                          </label>
                        </div>

                        <p className="text-xs text-slate-400">
                          🔒 Anyone with this link can view a read-only snapshot of this export.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShareEntry(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Close ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  const NAV: { id: Tab; label: string; icon: string; sub: string }[] = [
    { id: 'templates',    label: 'Templates',    icon: '📋', sub: `${TEMPLATE_DEFS.length} ready` },
    { id: 'integrations', label: 'Integrations', icon: '🔗', sub: `${connectedCount}/${INTEGRATION_DEFS.length} live` },
    { id: 'schedule',     label: 'Schedule',     icon: '⏰', sub: schedule.enabled ? 'Active' : 'Off' },
    { id: 'history',      label: 'History',      icon: '📜', sub: `${history.length} exports` },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg">
              ☁️
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Cloud Export Hub</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {INTEGRATION_DEFS.map((def) => (
                  <div
                    key={def.id}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${(integrations[def.id]?.connected) ? 'bg-emerald-400' : 'bg-white/30'}`}
                    title={def.name}
                  />
                ))}
                <span className="text-xs text-white/60 ml-1">
                  {connectedCount} service{connectedCount !== 1 ? 's' : ''} connected
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-52 shrink-0 border-r border-slate-100 bg-slate-50/60 p-3 flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  tab === item.id
                    ? 'bg-white shadow-sm border border-slate-200 text-indigo-700'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${tab === item.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 leading-tight mt-0.5">{item.sub}</p>
                </div>
              </button>
            ))}

            {/* Status footer */}
            <div className="mt-auto pt-4 border-t border-slate-200">
              <div className="flex items-center gap-1.5 px-2">
                <span className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-xs text-slate-400">
                  {connectedCount > 0 ? `${connectedCount} service${connectedCount > 1 ? 's' : ''} live` : 'No integrations'}
                </span>
              </div>
              <p className="text-xs text-slate-400 px-2 mt-1">{expenses.length} total records</p>
            </div>
          </aside>

          {/* Main panel */}
          <main className="flex-1 overflow-y-auto p-6">
            {tab === 'templates'    && renderTemplates()}
            {tab === 'integrations' && renderIntegrations()}
            {tab === 'schedule'     && renderSchedule()}
            {tab === 'history'      && renderHistory()}
          </main>
        </div>
      </div>
    </div>
  );
}
