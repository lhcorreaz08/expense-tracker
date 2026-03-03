# Expense Filters — Technical Reference

## Overview

The Expense Filters feature allows users to narrow down the expense list by search text, category, date range, and sort order. All filtering and sorting happens client-side in real time — no network requests are involved. The filtered result also drives the inline CSV export, so only visible expenses are exported.

## Architecture

The feature spans two components with a clear separation of concerns: `FilterBar` owns the filter UI and emits changes upward, while `ExpenseList` owns the filter state and applies the filter/sort logic to the expenses array before rendering.

```
src/app/expenses/page.tsx
  └── <ExpenseList expenses onUpdate onDelete>
        ├── useState<ExpenseFilters>          ← filter state lives here
        ├── <FilterBar filters onChange onReset>   ← controlled filter UI
        └── filtered[]                        ← derived array passed to the table/cards
```

## Files & Responsibilities

| File | Role |
|------|------|
| `src/types/expense.ts` | Defines `ExpenseFilters` interface, `Category` union, and `CATEGORIES` constant |
| `src/components/FilterBar.tsx` | Renders all filter inputs; fully controlled (no internal state) |
| `src/components/ExpenseList.tsx` | Owns filter state; applies filter + sort logic; renders table, mobile cards, export button |
| `src/app/expenses/page.tsx` | Mounts `ExpenseList` and provides the raw `expenses` array from `useExpenses` |

## TypeScript Interfaces & Types

### `ExpenseFilters` — `src/types/expense.ts:18`

```ts
interface ExpenseFilters {
  search: string;         // free-text search against description and category
  category: Category | 'All'; // 'All' means no category filter applied
  startDate: string;      // YYYY-MM-DD; empty string means no lower bound
  endDate: string;        // YYYY-MM-DD; empty string means no upper bound
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}
```

### `Category` — `src/types/expense.ts:1`

```ts
type Category = 'Food' | 'Transportation' | 'Entertainment' | 'Shopping' | 'Bills' | 'Other';
```

Used as the value type for the category filter. `'All'` is appended only in `ExpenseFilters` — it is not part of the `Category` union itself.

## API / Props

### `FilterBar`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `ExpenseFilters` | ✅ | Current filter state (fully controlled) |
| `onChange` | `(filters: ExpenseFilters) => void` | ✅ | Called on every input change with the full updated filters object |
| `onReset` | `() => void` | ✅ | Called when the user clicks "Reset"; parent sets state back to `DEFAULT_FILTERS` |

`FilterBar` has **no internal state**. All inputs are controlled via the `filters` prop.

### `ExpenseList`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `expenses` | `Expense[]` | ✅ | Full unfiltered expense list from `useExpenses` |
| `onUpdate` | `(id: string, data: ExpenseInput) => void` | ✅ | Passed through from `useExpenses.updateExpense` |
| `onDelete` | `(id: string) => void` | ✅ | Passed through from `useExpenses.deleteExpense` |

## State Management

Defined in `ExpenseList` — `src/components/ExpenseList.tsx:25`:

```ts
const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
```

### `DEFAULT_FILTERS` — `src/components/ExpenseList.tsx:16`

```ts
const DEFAULT_FILTERS: ExpenseFilters = {
  search: '',
  category: 'All',
  startDate: '',
  endDate: '',
  sortBy: 'date-desc',
};
```

**What triggers re-renders:** any call to `setFilters` (i.e., every keystroke in search, every select change). The filtered array is recomputed inline on every render — it is **not memoised** with `useMemo`.

## Data Flow

```
User types in FilterBar input
  → onChange({ ...filters, search: value })
    → setFilters(newFilters)           [ExpenseList re-renders]
      → filtered = expenses.filter(fn).sort(fn)
        → table/mobile cards render with updated rows
        → export button uses filtered[]
```

The filter always runs against the full `expenses` prop — partial results are never accumulated.

## Filter Logic — `src/components/ExpenseList.tsx:36`

Applied sequentially (all conditions must pass for a row to be included):

1. **Category** — skip if `filters.category !== 'All'` and `e.category !== filters.category`
2. **Start date** — skip if `filters.startDate` is set and `e.date < filters.startDate` (lexicographic ISO-8601 comparison)
3. **End date** — skip if `filters.endDate` is set and `e.date > filters.endDate`
4. **Search** — case-insensitive substring match against `e.description` OR `e.category`

### Sort Logic — `src/components/ExpenseList.tsx:48`

| `sortBy` value | Comparator |
|----------------|-----------|
| `'date-desc'` | `b.date.localeCompare(a.date)` |
| `'date-asc'` | `a.date.localeCompare(b.date)` |
| `'amount-desc'` | `b.amount - a.amount` |
| `'amount-asc'` | `a.amount - b.amount` |

Date comparison uses `localeCompare` on ISO-8601 strings, which is lexicographically correct.

## Side Effects

None. The filter feature introduces no `useEffect` calls. `FilterBar` is pure UI with no side effects.

## localStorage / External Storage

None. Filter state is ephemeral — it resets to `DEFAULT_FILTERS` whenever the component unmounts (e.g., navigating away from `/expenses`).

## Error Handling

| Scenario | Handling |
|----------|----------|
| No expenses match filters | Renders an empty state UI ("No expenses found") with a hint to adjust filters |
| Export with no results | `exportToCSV` button is `disabled` when `filtered.length === 0` |
| Invalid date input | The browser's `<input type="date">` prevents invalid values; no additional validation |
| Empty search string | Filter passes all rows (falsy check: `if (filters.search)`) |

No unhandled exceptions in the filter path.

## Security Considerations

- **Search input**: User-provided `filters.search` is only used in a `String.prototype.includes()` call — never injected into HTML or executed. No XSS risk.
- **Date inputs**: Values come from `<input type="date">` — browser-constrained to YYYY-MM-DD format. Compared lexicographically, not evaluated.
- **Category filter**: Values are constrained to the `CATEGORIES` constant via a `<select>` — no free-text injection possible.

## Performance Implications

- The `filtered` array is recomputed on **every render** of `ExpenseList`. For typical personal finance data (<1,000 rows), this is negligible.
- If the list grows significantly, wrapping the filter/sort logic in `useMemo` would prevent redundant recomputation on unrelated state changes (e.g., toast appearing).

## Known Limitations

- Filter state is **not persisted** — refreshing or navigating away resets all filters.
- **No URL sync** — filters are not reflected in the URL query string, so filtered views cannot be shared or bookmarked.
- Search only matches `description` and `category` — not `amount` or `date`.
- Adding a new `sortBy` option requires modifying the `switch` in `ExpenseList` and adding an `<option>` in `FilterBar` — not open for extension without code changes.

## Related

- User guide: [docs/user/expense-filters.md](../user/expense-filters.md)
- Related components: [src/components/ExpenseList.tsx](../../src/components/ExpenseList.tsx), [src/components/FilterBar.tsx](../../src/components/FilterBar.tsx)
- Types: [src/types/expense.ts](../../src/types/expense.ts)
