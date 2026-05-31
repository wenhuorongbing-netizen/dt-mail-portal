# GitHub Setup

Target repository:

```text
https://github.com/wenhuorongbing-netizen/dt-mail-portal
```

Local setup:

```powershell
git init
git branch -M main
git remote add origin https://github.com/wenhuorongbing-netizen/dt-mail-portal.git
git add .
git commit -m "Initialize DT Mail Portal workspace"
git push -u origin main
```

If GitHub returns `Repository not found`, create the empty repo first, then rerun the push.

Issue creation can be seeded from `docs/issue-plan.md` after the repo exists.
