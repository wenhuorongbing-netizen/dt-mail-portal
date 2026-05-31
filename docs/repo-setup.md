# GitHub Repository Setup

## Recommended repo name

```text
dt-mail-portal
```

Set it to private.

## First commands

```bash
git init
git add .
git commit -m "chore: initialize dt mail portal startup kit"
git branch -M main
git remote add origin git@github.com:<your-user>/dt-mail-portal.git
git push -u origin main
```

## Branch strategy

```text
main                  stable
feat/customer-portal  portal UI
feat/admin-mvp        order workflow
feat/email-infra      mailcow/Roundcube integration
feat/deployment       Tencent Cloud deployment
```

## Suggested labels

```text
frontend
backend
infra
email
admin
mobile
docs
security
legal
mvp
```

## Suggested milestones

```text
MVP-1 Portal Prototype
MVP-2 Admin Workflow
MVP-3 Webmail Integration
MVP-4 Real Server Test
MVP-5 Launch Checklist
```
