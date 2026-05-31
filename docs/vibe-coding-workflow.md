# Vibe Coding Workflow

This project is designed to be built in short AI-assisted passes, but with strong architectural contracts.

## The rule

Never ask an AI agent to “build everything”. Give it one slice, one acceptance test, and one boundary.

## Session pattern

### 1. Context pack

Paste these files or mention them to the coding agent:

- `AGENTS.md`
- `docs/architecture.md`
- `docs/module-contract.md`
- relevant prompt from `prompts/`

### 2. One-slice prompt

Example:

```text
Read AGENTS.md and docs/module-contract.md. Implement the Orders module only. Do not modify core layout except if type support is required. Do not automate third-party account registration or payment. At the end, list files changed and how to test.
```

### 3. Review pass

Use `prompts/07_review_agent_prompt.md` to review the output.

### 4. Human checkpoint

Before accepting:

- Does the UI work on mobile?
- Did it preserve the module system?
- Did it store sensitive data casually?
- Did it imply official affiliation?
- Did it cross the third-party automation boundary?

## Suggested build order

1. Customer portal static pages.
2. Admin shell polish.
3. Orders module MVP.
4. Handover text generator.
5. Mailbox generation mock.
6. mailcow API integration.
7. Roundcube theme/config.
8. Tencent Cloud deployment docs.
9. Real email test.
10. Launch hardening.

## Prompt chaining

Use this order:

```text
00_master_app_skeleton_prompt.md
01_frontend_design_agent.md
04_ops_admin_module_prompt.md
07_review_agent_prompt.md
05_roundcube_theme_prompt.md
06_tencent_mailcow_deploy_prompt.md
```

## Definition of done for every slice

- Works locally.
- Typed.
- Mobile usable.
- No secrets.
- No core architecture violation.
- README/docs updated if behavior changed.
