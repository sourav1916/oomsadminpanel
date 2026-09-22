# Wallet payments & Razorpay — Admin context

> **Purpose:** Tag when changing Admin Razorpay keys/fees or wallet payment-request banks/approvals. Pair with SERVER wallet/razorpay admin routes and CLIENT `WalletRecharge` / `WalletPaymentRequest`.

---

## Mental model

```
Admin Settings
  ├─ Razorpay config     → platform keys + gateway fee %
  └─ Wallet payments     → banks + approve/reject payment requests
        ↓
CLIENT wallet recharge (gateway) / payment-request (manual bank, no fee)
```

| File | Role |
|------|------|
| `src/pages/RazorpayConfig.jsx` | Environment, key id/secret, fee fields |
| `src/pages/WalletPayments.jsx` | Tabs: payment requests + bank accounts |
| `src/App.js` / Sidebar / Settings | Routes under `/settings/...` |

---

## Notes

- Gateway fee is platform-configured; **payment requests do not charge gateway fee**.
- Banks: account name, bank, number, IFSC, branch, UPI, status, sort_order.
- Requests: filter by status; approve/reject with optional admin remark.

---

## Do not

- Commit live Razorpay secrets into git or `important.txt` as the source of truth — DB/admin config is authoritative after migration
