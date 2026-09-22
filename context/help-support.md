# Help & Support — Admin context

> **Purpose:** Tag when changing Admin Help & Support configuration UI. Pair with [`SERVER/context/help-support.md`](../../SERVER/context/help-support.md) and [`CLIENT/context/help-support.md`](../../CLIENT/context/help-support.md).

---

## Mental model

```
Settings → Help & Support
        ↓
Tab: Contact details  → GET/PUT /help-support/config
Tab: FAQs             → CRUD /help-support/faqs
        ↓
Shown on CLIENT /help-support
```

| File | Role |
|------|------|
| `src/pages/HelpSupportConfig.jsx` | Contact form + FAQ table/modal |
| `src/pages/Settings.jsx` | Card link to `/settings/help-support` |
| `src/components/layout/Sidebar.jsx` | Nav under Settings |
| `src/App.js` | Route `settings/help-support` |

API via `apiCall` → admin base + `/help-support/...`.

---

## Contact tab

Editable: `page_title`, **`intro_text`** (shown above CLIENT contact cards), email, phone, WhatsApp, hours, address, website, status (`active`/`inactive`).

---

## FAQs tab

- List with sort order, status badge, edit/delete.
- Modal create/edit: question, answer, sort_order, status.
- Only **active** FAQs appear on CLIENT.

---

## Do not

- Edit CLIENT help copy only in the React app — config is DB-backed
