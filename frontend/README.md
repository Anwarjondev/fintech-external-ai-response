# SQB Legal Portal — Role-Based Frontend

A React + TypeScript app that detects user role via `/api/v1/auth/me` and renders completely different UIs for bank admins vs. government users. All six endpoints connected and tested.

## Quick start

```bash
npm install
cp .env.example .env     # set VITE_API_BASE_URL
npm run dev              # http://localhost:5173
```

## How role detection works

1. **Login** → `/api/v1/auth/login` with phone + password
2. **Auto-fetch user** → `/api/v1/auth/me` (called immediately after login)
3. **Detect role** from response:
   - If `organization === "bank"` **OR** `role === "admin"` → **Bank Admin UI**
   - Otherwise → **Government User UI**
4. **Auto-redirect** to the correct dashboard

## API Endpoints Connected

| Endpoint | Where it's used | Role |
|----------|---|---|
| `POST /api/v1/auth/login` | Login page | Both |
| `GET /api/v1/auth/me` | Auto-called after login | Both |
| `POST /api/v1/documents/upload` | Bank Upload, Gov Submit | Both |
| `POST /api/v1/documents/text` | Bank Text, Gov Submit | Both |
| `POST /api/v1/documents/{id}/approve` | ResultPanel (both roles) | Both |
| `GET /api/v1/statistics/history` | Bank History/Approvals, Gov History/Results | Both |

## Bank Admin UI

**Sidebar navigation:**
- Dashboard (stats from history)
- Upload (drag-drop PDF/DOCX)
- Text request (paste text)
- Approvals (pending items from history)
- History (all documents)

**Pages:**
- `/bank/dashboard` — Overview with file counts
- `/bank/upload` — Upload form → ResultPanel
- `/bank/text` — Text form → ResultPanel
- `/bank/approvals` — List pending approvals
- `/bank/history` — Full document history

## Government User UI

**Sidebar navigation:**
- Submit request (upload or text)
- History (all submitted requests)
- Results (completed/approved only)

**Pages:**
- `/government/submit` — Tabbed: upload or text input → ResultPanel
- `/government/history` — All submitted requests
- `/government/results` — Only approved/completed requests

## Shared components

**ResultPanel** (`src/components/ResultPanel.tsx`):
- Shows analysis result (topic, risk, decision, legal ref, reason, etc.)
- Editable: topic, response_text, retrieved_data (JSON)
- Approve & send / Reject buttons
- Both roles use this same component

**Layouts**:
- **BankLayout** — 5 nav items + sidebar
- **GovernmentLayout** — 3 nav items + sidebar
- Both have user display + sign-out button

## Route guards

```tsx
<PublicRoute>        {/* Logged-in users skip login */}
<BankOnlyRoute>      {/* Bank admins only */}
<GovernmentOnlyRoute>{/* Gov users only */}
```

Wrong role tries to access → blocked & redirected to correct UI.
No token → redirected to login.

## Key files

```
src/
├── App.tsx                          # All routes with guards
├── api/
│   ├── auth.ts                      # login, me, logout
│   ├── documents.ts                 # upload, processText, approve
│   └── history.ts                   # getHistory
├── components/
│   ├── ResultPanel.tsx              # Analysis + approval form
│   ├── ProtectedRoute.tsx           # Auth guards
│   └── layout/
│       ├── BankLayout.tsx           # Admin sidebar
│       └── GovernmentLayout.tsx     # Gov sidebar
├── context/
│   └── AuthContext.tsx              # User state, role detection
├── pages/
│   ├── Login.tsx
│   ├── bank/
│   │   ├── Dashboard.tsx
│   │   ├── Upload.tsx
│   │   ├── Text.tsx
│   │   └── Approvals.tsx
│   └── government/
│       ├── Submit.tsx
│       ├── History.tsx
│       └── Results.tsx
└── lib/
    ├── api.ts                       # Fetch wrapper
    └── utils.ts
```

## Testing the flow

1. Sign in with a test phone (bank or gov user)
2. `/auth/me` response determines UI
3. Bank admin → uploads/text → sees approval form
4. Gov user → submits → sees result
5. Both can approve/reject → calls `/documents/{id}/approve`
6. History shows all (bank) or completed (gov)

## Notes

- **Token storage**: localStorage (demo-friendly, not production-secure)
- **Role field**: checks `organization` first, then `role`. Adjust logic in `isBankAdmin()` / `isGovernmentUser()` if your API uses different field names
- **History response**: assumes `{organization, file_count, files: [...]}`. Adjust in `src/api/history.ts` if shape differs
- **FileCard component**: Displays `request_id`, `topic`, `risk_level`, `status`, `created_at` from each history item

## Deployment

```bash
npm run build
npm run preview  # test production build locally
```

Output: `dist/` ready for any static host.
