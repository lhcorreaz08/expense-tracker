Generate complete documentation for a new feature in this expense tracker project.

Feature name: $ARGUMENTS

## Instructions

### Step 0 — Classify the feature type

Search for all files related to the feature name above across:
- `src/components/` — React components
- `src/hooks/` — custom hooks
- `src/lib/` — utilities
- `src/types/` — TypeScript types
- `src/app/` (excluding `src/app/api/`) — pages and layouts
- `src/app/api/` — API route handlers
- `src/server/` — server-only logic (if present)
- `prisma/` — database schema (if present)

Then classify the feature using this decision table:

| Files found in | Classification |
|----------------|----------------|
| Only `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`, `src/app/` (no api/) | **frontend** |
| Only `src/app/api/`, `src/server/`, `prisma/` | **backend** |
| Both groups | **full-stack** |

Keep this classification in mind — it determines which sections to include in Step 1.

---

### Step 1 — Generate Developer Documentation

Create `docs/dev/<feature-name-kebab-case>.md`.

Start with this header, replacing the classification label:

```
# <Feature Name> — Technical Reference
> Feature type: [frontend | backend | full-stack]
```

Then include the sections from the table below. Only include a section if its
"Include when" condition matches the classification from Step 0.

| Section | Include when | Content |
|---------|-------------|---------|
| **Overview** | always | Brief technical description of what this feature does and why it exists |
| **Architecture** | always | How the feature fits into the project. Use an ASCII component tree or data flow diagram |
| **Files & Responsibilities** | always | Table: File \| Role |
| **TypeScript Interfaces & Types** | always | List and explain every type, interface, or enum introduced or modified |
| **Component Tree & Props** | frontend, full-stack | For each component: props table (name, type, required, description) |
| **State Management** | frontend, full-stack | All useState / useReducer / useCallback. What triggers re-renders |
| **Data Flow** | always | How data moves through the feature end-to-end |
| **Side Effects** | frontend, full-stack | All useEffect calls, what they do, and their dependency arrays |
| **API Endpoints** | backend, full-stack | Table: Method \| Path \| Auth required \| Description |
| **Request & Response Schemas** | backend, full-stack | TypeScript-style shapes for request body and response JSON |
| **Database Schema** | backend, full-stack | Tables / models affected, key fields, relations |
| **Authentication & Middleware** | backend, full-stack | Any auth checks, middleware, or permission guards |
| **localStorage / External Storage** | frontend, full-stack | Keys written or read, their schema, versioning strategy |
| **Error Handling** | always | Handled and unhandled failure modes |
| **Security Considerations** | always | Input validation, XSS, SQL injection, auth bypass risks |
| **Performance Implications** | always | Bundle impact, render cost, query complexity |
| **Known Limitations** | always | Anything intentionally left out or not yet implemented |
| **Related** | always | Link to user guide + related source files |

---

### Step 2 — Generate User Documentation

Create `docs/user/<feature-name-kebab-case>.md`.

The user doc adapts based on feature type:

- **frontend**: focus on UI interactions, visual steps, what the user sees and clicks
- **backend**: focus on developer/API consumer experience (curl examples, response shapes, error codes) — skip visual steps
- **full-stack**: include both UI steps and API usage in separate subsections

Use this structure:

```
# How to Use: <Feature Name>

## What Is This?
[frontend/full-stack] One paragraph in plain language describing what the user can do.
[backend] One paragraph explaining what this API/service provides and who it's for.

## When Should I Use This?
2–4 bullet points of concrete use cases.

## Getting Started
[frontend / full-stack UI section]
### Step N — <action>
Plain-language instruction.
![Screenshot placeholder: <describe exactly what should appear in this screenshot>]

[backend / full-stack API section]
### Using the API
Curl example + explanation of each parameter.

## Tips & Best Practices
2–4 bullet points.

## Troubleshooting
| Problem | Solution |
|---------|----------|

## Related
- Developer reference: docs/dev/<feature-name-kebab-case>.md
- Related features: (link any related user docs that already exist in docs/user/)
```

---

### Step 3 — Print a summary

After creating both files, output:

```
## Documentation generated

Feature type detected: [frontend | backend | full-stack]

Files created:
- docs/dev/<feature-name-kebab-case>.md
- docs/user/<feature-name-kebab-case>.md

Source files analyzed:
- (list each file read)

Sections included / skipped:
- ✅ <Section name>
- ⬜ <Section name> — skipped (not applicable for [type])

Gaps detected:
- (e.g., no tests found, unhandled error in X, security issue in Y)
```
