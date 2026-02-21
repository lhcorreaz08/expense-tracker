export type Category =
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Other';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: Category;
  description: string;
  createdAt: string;
}

export interface ExpenseFilters {
  search: string;
  category: Category | 'All';
  startDate: string;
  endDate: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#F97316',
  Transportation: '#3B82F6',
  Entertainment: '#8B5CF6',
  Shopping: '#EC4899',
  Bills: '#EF4444',
  Other: '#6B7280',
};

export const CATEGORY_BADGE: Record<Category, string> = {
  Food: 'bg-orange-100 text-orange-700 border-orange-200',
  Transportation: 'bg-blue-100 text-blue-700 border-blue-200',
  Entertainment: 'bg-violet-100 text-violet-700 border-violet-200',
  Shopping: 'bg-pink-100 text-pink-700 border-pink-200',
  Bills: 'bg-red-100 text-red-700 border-red-200',
  Other: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍽️',
  Transportation: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📋',
  Other: '📦',
};
