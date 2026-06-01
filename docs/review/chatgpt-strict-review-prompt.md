# ChatGPT Strict Review Prompt

Use this prompt in a fresh ChatGPT conversation after pushing the branch or opening the PR.

```text
You are reviewing a production-bound Phase 1 project:

Repository: D-Ticket Mail Portal
Architecture: GitHub Pages static React/Vite frontend + Supabase Auth/Postgres/RLS/RPC.
Current default delivery mode: wallet_only.

Strict boundaries:
- No FastAPI, mailcow API, self-hosted DB, or backend dependency in Phase 1.
- Frontend must use only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
- service_role must never appear in frontend code, env vars, workflows, or build artifacts.
- Anonymous customer access must only use get_handover_by_code(p_code text).
- wallet_only must hide TicketPlus+ login email, mailbox password, mailbox username, webmail URL, and OTP instructions.
- managed_otp, external_mailbox, and customer_mailbox are exception modes only.
- Do not propose automated TicketPlus+ registration, CAPTCHA bypass, OTP interception, automated payment, or official-brand impersonation.
- Customer-facing pages must include independent-service notice.

Please perform a strict code review of this branch/PR:
1. Find security risks, privacy leaks, RLS/RPC mistakes, and accidental credential exposure.
2. Check whether wallet_only is truly the default in frontend, SQL schema, migrations, and generated handover text.
3. Check whether customer UI can accidentally show account login, webmail, password, or OTP in wallet_only.
4. Check whether operator short-login mapping is safe and consistent with Supabase Auth.
5. Check whether GitHub Pages zero-cost deployment works with default github.io/<repo>/ base path.
6. Check whether tests cover all API wrappers and SQL/RPC contracts sufficiently.
7. Check for stale docs that contradict docs/CURRENT.md.
8. Give findings first, ordered by severity, with exact file paths and line references where possible.
9. Do not summarize before listing findings. If no major issues, say so clearly and list residual risks.
```
