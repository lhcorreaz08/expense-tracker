# How to Use: Expense Filters

## What Is This?

The Expense Filters bar lets you instantly search, filter, and sort your expenses without leaving the page. As you type or change any filter, the list updates in real time — no need to click a "Search" button. You can combine multiple filters at once (for example: only Food expenses from last month, sorted by highest amount).

## When Should I Use This?

- You want to find a specific expense you vaguely remember ("that Uber ride in January")
- You need to see how much you spent in a particular category over a date range
- You're preparing to export a specific subset of expenses to CSV
- You want to review expenses from highest to lowest to spot big purchases

## Getting Started

### Step 1 — Open the Expenses page

Click **All Expenses** in the navigation menu. You'll see the full list of your expenses with the filter bar at the top.

![Screenshot placeholder: Full expenses page showing the filter bar at the top and the complete expense list below it]

---

### Step 2 — Search by keyword

Type any word into the **Search** field. The list filters instantly to show only expenses whose description or category contains that word. The search is not case-sensitive.

**Example:** typing `uber` will match "Uber ride downtown" and any other description containing "uber".

![Screenshot placeholder: Search field with "uber" typed, list showing only transportation expenses matching that text]

---

### Step 3 — Filter by category

Click the **Category** dropdown and choose one category (Food, Transportation, Entertainment, Shopping, Bills, or Other). Select **All Categories** to remove the category filter.

![Screenshot placeholder: Category dropdown open showing all category options, with "Food" highlighted]

---

### Step 4 — Filter by date range

Use the **From** and **To** date pickers to set a date range. You can set just one of them:
- Only **From** → shows expenses from that date forward
- Only **To** → shows all expenses up to that date
- Both → shows only expenses within that range

![Screenshot placeholder: From and To date fields filled with a date range, list showing only expenses within that period]

---

### Step 5 — Change the sort order

Use the **Sort by** dropdown to reorder the list:

| Option | Description |
|--------|-------------|
| Newest first | Most recent expenses at the top (default) |
| Oldest first | Earliest expenses at the top |
| Highest amount | Most expensive items at the top |
| Lowest amount | Cheapest items at the top |

![Screenshot placeholder: Sort dropdown open showing the four sort options]

---

### Step 6 — Reset all filters

Click the **Reset** button to clear all filters and return to the default view (all expenses, newest first).

![Screenshot placeholder: Reset button highlighted in the filter bar]

---

### Step 7 — Export your filtered results

Once you've filtered the list to exactly what you need, click **↓ Export CSV** to download only those expenses as a spreadsheet. The button is disabled if no expenses match your current filters.

![Screenshot placeholder: Export CSV button in the toolbar below the filter bar, showing the count of filtered expenses]

---

## Tips & Best Practices

- **Combine filters freely** — search + category + date range all work together at the same time.
- **Use date ranges before exporting** — filter by month or quarter first, then export for a clean spreadsheet with just the data you need.
- **Filters reset when you navigate away** — if you need to come back to the same view, set the filters again. (Bookmarking filtered views is not yet supported.)
- **Search matches both description and category** — searching "shop" will find expenses in the Shopping category as well as any description containing "shop".

## Troubleshooting

| Problem | Solution |
|---------|----------|
| List shows "No expenses found" | One or more filters are too restrictive. Click **Reset** to start over. |
| Export CSV button is greyed out | No expenses match the current filters. Broaden your filters until at least one result appears. |
| Date filter not working as expected | Make sure the **From** date is earlier than the **To** date. The filter is inclusive on both ends. |
| Search doesn't find an expense I know exists | Try a shorter keyword. Search only checks the description and category, not the amount or date. |

## Related

- Developer reference: [docs/dev/expense-filters.md](../dev/expense-filters.md)
- Related features: [How to Export Expenses](expense-export.md) *(coming soon)*
