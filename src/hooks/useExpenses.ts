'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense, Category } from '@/types/expense';

const STORAGE_KEY = 'expense-tracker-v1';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const SAMPLE_EXPENSES: Expense[] = [
  { id: 's1',  date: '2026-02-18', amount: 8.50,   category: 'Food',           description: 'Coffee shop', createdAt: '2026-02-18T09:00:00Z' },
  { id: 's2',  date: '2026-02-15', amount: 15.99,  category: 'Entertainment',  description: 'Netflix subscription', createdAt: '2026-02-15T10:00:00Z' },
  { id: 's3',  date: '2026-02-14', amount: 87.30,  category: 'Food',           description: 'Weekly grocery run', createdAt: '2026-02-14T11:00:00Z' },
  { id: 's4',  date: '2026-02-12', amount: 45.00,  category: 'Transportation', description: 'Gas station fill-up', createdAt: '2026-02-12T08:30:00Z' },
  { id: 's5',  date: '2026-02-10', amount: 65.99,  category: 'Shopping',       description: 'Amazon order – cables & accessories', createdAt: '2026-02-10T14:00:00Z' },
  { id: 's6',  date: '2026-02-08', amount: 120.00, category: 'Bills',          description: 'Electric bill', createdAt: '2026-02-08T09:00:00Z' },
  { id: 's7',  date: '2026-02-05', amount: 78.50,  category: 'Food',           description: 'Dinner out with friends', createdAt: '2026-02-05T20:00:00Z' },
  { id: 's8',  date: '2026-02-01', amount: 40.00,  category: 'Bills',          description: 'Gym membership', createdAt: '2026-02-01T07:00:00Z' },
  { id: 's9',  date: '2026-01-28', amount: 23.50,  category: 'Transportation', description: 'Uber ride downtown', createdAt: '2026-01-28T18:00:00Z' },
  { id: 's10', date: '2026-01-25', amount: 35.00,  category: 'Entertainment',  description: 'Movie tickets x2', createdAt: '2026-01-25T19:00:00Z' },
  { id: 's11', date: '2026-01-22', amount: 95.20,  category: 'Food',           description: 'Supermarket run', createdAt: '2026-01-22T11:00:00Z' },
  { id: 's12', date: '2026-01-18', amount: 60.00,  category: 'Bills',          description: 'Internet bill', createdAt: '2026-01-18T09:00:00Z' },
  { id: 's13', date: '2026-01-15', amount: 145.00, category: 'Shopping',       description: 'Winter jacket', createdAt: '2026-01-15T14:00:00Z' },
  { id: 's14', date: '2026-01-10', amount: 52.00,  category: 'Transportation', description: 'Gas – highway trip', createdAt: '2026-01-10T10:00:00Z' },
  { id: 's15', date: '2026-01-05', amount: 28.75,  category: 'Other',          description: 'Pharmacy – vitamins', createdAt: '2026-01-05T12:00:00Z' },
  { id: 's16', date: '2025-12-28', amount: 112.00, category: 'Food',           description: 'Holiday dinner supplies', createdAt: '2025-12-28T16:00:00Z' },
  { id: 's17', date: '2025-12-24', amount: 230.00, category: 'Shopping',       description: 'Christmas gifts', createdAt: '2025-12-24T13:00:00Z' },
  { id: 's18', date: '2025-12-20', amount: 385.00, category: 'Transportation', description: 'Flight tickets – holiday travel', createdAt: '2025-12-20T08:00:00Z' },
  { id: 's19', date: '2025-12-15', amount: 75.00,  category: 'Bills',          description: 'Phone bill', createdAt: '2025-12-15T09:00:00Z' },
  { id: 's20', date: '2025-12-10', amount: 95.00,  category: 'Entertainment',  description: 'Concert tickets', createdAt: '2025-12-10T20:00:00Z' },
  { id: 's21', date: '2025-11-30', amount: 125.00, category: 'Food',           description: 'Thanksgiving groceries', createdAt: '2025-11-30T10:00:00Z' },
  { id: 's22', date: '2025-11-25', amount: 189.00, category: 'Shopping',       description: 'Black Friday online shopping', createdAt: '2025-11-25T12:00:00Z' },
  { id: 's23', date: '2025-11-20', amount: 145.00, category: 'Bills',          description: 'Car insurance payment', createdAt: '2025-11-20T09:00:00Z' },
  { id: 's24', date: '2025-11-15', amount: 32.00,  category: 'Transportation', description: 'Monthly bus pass', createdAt: '2025-11-15T08:00:00Z' },
  { id: 's25', date: '2025-11-10', amount: 55.00,  category: 'Entertainment',  description: 'Streaming services bundle', createdAt: '2025-11-10T10:00:00Z' },
];

export interface ExpenseInput {
  date: string;
  amount: number;
  category: Category;
  description: string;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setExpenses(JSON.parse(raw));
      } else {
        setExpenses(SAMPLE_EXPENSES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EXPENSES));
      }
    } catch {
      setExpenses(SAMPLE_EXPENSES);
    }
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage quota exceeded – silently continue
    }
  }, []);

  const addExpense = useCallback(
    (data: ExpenseInput): Expense => {
      const expense: Expense = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      persist([expense, ...expenses]);
      return expense;
    },
    [expenses, persist]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseInput) => {
      persist(expenses.map((e) => (e.id === id ? { ...e, ...data } : e)));
    },
    [expenses, persist]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist]
  );

  const getExpense = useCallback(
    (id: string): Expense | undefined => expenses.find((e) => e.id === id),
    [expenses]
  );

  return { expenses, isLoaded, addExpense, updateExpense, deleteExpense, getExpense };
}
