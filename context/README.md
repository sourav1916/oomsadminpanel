# ADMIN context docs

Modular agent playbooks for the OOMS Admin panel. Tag the relevant file(s) instead of re-explaining.

## Files

| File | When to tag |
|------|-------------|
| [`help-support.md`](./help-support.md) | Help & Support contact + FAQ config UI |
| [`wallet-payments.md`](./wallet-payments.md) | Razorpay platform keys/fees, wallet banks, payment requests |

## Pair with

| Admin | Server | Client |
|-------|--------|--------|
| `help-support.md` | `SERVER/context/help-support.md` | `CLIENT/context/help-support.md` |
| `wallet-payments.md` | `SERVER` wallet / razorpay helpers + `routes_admin` | `CLIENT` WalletRecharge / WalletPaymentRequest |
