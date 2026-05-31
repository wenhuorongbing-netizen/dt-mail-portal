# Prompt — Code Review / Product Review Agent

```text
You are reviewing D-Ticket Mail Portal before merge.

Review against:
- AGENTS.md.
- Modular architecture contract.
- Mobile-first UX.
- Data minimization.
- No third-party automation boundary.
- Independent-service notice.
- TypeScript strictness.
- FastAPI schema quality.
- Shared UI component usage.

Return:
1. Critical issues.
2. Product/UX issues.
3. Security/privacy issues.
4. Architecture violations.
5. Suggested patch list.
6. Whether this is safe to merge.

Be strict. Do not accept code that hardcodes business logic into the core shell or stores sensitive customer data casually.
```
