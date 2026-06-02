严格结论：**现在不能按“完美 100%”标准开始正式部署给客户用。当前 GitHub `main` 是 NO-GO。**

原因不是项目方向错，而是：**你刚才说已经完成的 managed_otp 主线，GitHub `main` 上没有体现出来。** 你上传的本地记录里说已经完成 `managed_otp`、migration 004、`customer_can_login`、`otp_managed_by_operator`、HandoverPage 不显示邮箱密码等变更。 但我严格审查 GitHub 上的真实文件后，发现 `main` 仍然是旧的“客户拿邮箱密码 + 打开 webmail”模式。

---

## 总体 Go / No-Go 判定

| 模块                                |           判定 | 说明                                                                                       |
| --------------------------------- | -----------: | ---------------------------------------------------------------------------------------- |
| GitHub Pages workflow             |    **基本 GO** | workflow 已经用 `npm ci`、typecheck、build、`upload-pages-artifact@v4`、`deploy-pages@v4`，结构正确。 |
| Supabase 旧 schema/RLS             |    **部分 GO** | RLS 有启用，RPC 路径存在，但仍是旧密码交付模式。                                                             |
| managed_otp 主线                    |    **NO-GO** | GitHub `main` 没有 `managed_otp / delivery_mode / customer_can_login` 相关文件或字段。             |
| Handover 客户页                      |    **NO-GO** | 当前仍显示 webmail、用户名、邮箱密码、一键复制全部登录信息。                                                       |
| README / CURRENT 文档               |    **NO-GO** | 当前文档仍说 RPC 返回 `mailbox_password`，且客户需要登录 webmail 收 OTP。                                  |
| Supabase migration 004            |    **NO-GO** | GitHub 上未看到你说的 migration 004；当前 schema 仍要求 `password_enc not null`。                      |
| Cloudflare Email Routing / OTP 测试 |    **NO-GO** | GitHub 里没有测试结果；真实 `dt-test-001@tickets.buffjo.top` OTP 未验收。                              |
| 可以部署 staging 吗                    |       **暂缓** | 只有在你先把本地 managed_otp 变更 push 到 GitHub 后，才建议部署 staging。                                   |
| 可以正式上线给客户吗                        | **绝对 NO-GO** | 现在上线会把邮箱密码/webmail 模式暴露给客户，和你最新商业逻辑相反。                                                   |

---

# 1. 最大阻塞：GitHub `main` 和你本地描述不一致

你说已经完成：

```text
managed_otp 默认模式
password_enc 可空
customer_can_login
otp_managed_by_operator
get_handover_by_code 只在 customer_can_login=true 时返回密码
HandoverPage managed_otp 不显示 webmail 和密码
docs/ops/managed-otp-workflow.md
```

但 GitHub `main` 当前没有这些痕迹。我直接看 GitHub 上的 `docs/CURRENT.md`，它仍然写：

```text
mailbox_password — mailbox password returned intentionally
customer needs it to log in to webmail and receive OTP
VITE_WEBMAIL_URL defaults to https://webmail.buffjo.top
```



这说明：**本地完成 ≠ GitHub 已准备好部署。**
如果现在 GitHub Pages 自动部署，它会部署 GitHub `main` 上的旧逻辑，而不是你说的新逻辑。

---

# 2. README 仍然是旧模式，需要改

README 当前写的是：

```text
Operator creates an order and manually imports/types mailbox credentials into Supabase.
Customer opens the link — sees mailbox login and TicketPlus+ guide.
```



这已经不符合你最新决定。现在应该写：

```text
Customer receives a handover link.
Customer sees TicketPlus+ login email.
Customer does not receive mailbox password by default.
Operator receives OTP through Cloudflare Email Routing / manual inbox.
Operator forwards OTP to customer.
```

另外 README 示例仍写：

```text
portal.buffjo.top/h/abc123
```



但代码实际是 HashRouter：

```text
/#/h/:code
```

App 里确实是 `/h/:code`，并保留了 `/handover/:code` → `/h/:code` 的 redirect。 

README 应统一成：

```text
https://portal.buffjo.top/#/h/abc123
```

---

# 3. Supabase schema 还不是 managed_otp 版

当前 GitHub 上的 `supabase/schema.sql` 仍然是旧结构：

```sql
email_address text not null unique
password_enc text not null
domain text not null default 'tickets.buffjo.top'
status text not null default 'active'
notes text not null default ''
```



这有三个严重问题：

第一，`password_enc` 还是 `not null`，不适合 `managed_otp`。在 managed_otp 模式下，客户不拿邮箱密码，系统也不一定需要记录 mailbox password。

第二，字段名仍叫 `password_enc`，但项目文档和实际 UI 之前一直把它当明文密码显示。这个名字会误导后续开发。

第三，缺少你说已经完成的字段：

```text
provider
delivery_mode
login_url
username
customer_can_login
otp_managed_by_operator
```

所以**真实 Supabase 项目现在不能直接按 managed_otp 部署**。

---

# 4. RPC 仍然会把邮箱密码返回给匿名客户

`docs/supabase/setup.md` 仍然写：

```text
get_handover_by_code(p_code) RPC returns mailbox_password
customer needs it to log in to webmail and retrieve OTP codes
```



同一文档后面还写：

```text
Returns mailbox email and mailbox password.
mailbox_password field is included intentionally.
```



这和你最新模式完全冲突。现在的正确逻辑应该是：

```text
managed_otp:
  mailbox_password = null
  customer_can_login = false
  otp_managed_by_operator = true

external_mailbox:
  mailbox_password 可返回
  customer_can_login = true
```

Supabase 官方也强调：浏览器端访问数据必须依赖 RLS，public schema 里的表必须启用 RLS，raw SQL 建表时要自己启用并只授予必要权限。([Supabase][1]) 当前 RLS 有启用，但**RPC 的返回字段策略仍然过宽**，不符合你最新业务风险控制。

---

# 5. HandoverPage 仍然不是 managed_otp 版

GitHub 上的 `HandoverPage.tsx` 仍然定义：

```ts
mailbox_password: string | null
```

并且页面逻辑仍然有：

```text
打开邮箱收验证码
邮箱网页登录用户名
邮箱密码
一键复制全部登录信息
WEBMAIL_URL
```

这些都出现在当前文件内容里。

这和你现在的主线相反。你现在的主线应该是：

```text
客户只看到 TicketPlus+ 登录邮箱
客户不看到邮箱密码
客户不看到 webmail 登录按钮
客户看到“联系客服获取验证码”
```

所以当前 GitHub 版本**不能给客户用**。

---

# 6. GitHub Pages workflow 本身基本合格

`.github/workflows/pages.yml` 现在结构是好的：

```text
push main / workflow_dispatch
contents: read
pages: write
id-token: write
npm ci
npm run typecheck
npm run build
upload-pages-artifact@v4
deploy-pages@v4
```

 

GitHub 官方对 Pages custom workflow 的要求包括：使用 Pages artifact 上传、`deploy-pages` job 至少需要 `pages: write` 和 `id-token: write` 权限，并且 deploy job 应依赖 build job。你的 workflow 满足核心要求。([GitHub Docs][2])

这里我只建议加一个非阻塞增强：

```yaml
- name: Scan frontend bundle for forbidden secrets
  run: |
    if grep -R "service_role\|sb_secret" frontend/dist; then
      echo "Forbidden secret marker found"
      exit 1
    fi
```

Supabase 官方说明 secret key / service_role 这类高权限 key 不应进入网页、源码、bundle、浏览器等公开环境；service_role 会绕过 RLS。([Supabase][3])

---

# 7. CI workflow 需要升级，但不是最大阻塞

当前 `ci.yml` 只对前端跑：

```text
npm install
npm run typecheck
```

没有跑 `npm run build`，也没有用 `npm ci`。

严格 100% 标准下，CI 应该改成：

```text
npm ci
npm run typecheck
npm run build
grep dist for service_role / sb_secret
```

虽然 Pages workflow 会 build，但 CI 也应该 build。这样 PR / push 失败会更早发现。

---

# 8. Cloudflare Email Routing 还没进入 Go 状态

你最新路线依赖：

```text
Cloudflare Email Routing / manual inbox
dt-test-001@tickets.buffjo.top
TicketPlus+ OTP 收信测试
```

但 GitHub 上没有 `managed-otp-workflow.md`，也没有测试结果文件。Cloudflare 官方说明，Email Routing 的规则是 custom address + destination address；custom address 可以转发到一个已验证的 destination address，也可以交给 Email Worker 处理。目的地址必须验证，未验证前规则不会生效。([Cloudflare Docs][4]) ([Cloudflare Docs][4])

所以这部分当前是：

```text
NO-GO：未配置 / 未验证 / 未记录
```

你必须至少完成：

```text
dt-test-001@tickets.buffjo.top → 你的邮箱
Gmail 普通邮件测试
Outlook 普通邮件测试
TicketPlus+ OTP 测试
```

并把结果写进：

```text
docs/ops/managed-otp-test-results.md
```

---

# 9. 当前真实状态评分

按你要求的“完美 100% / 一丝不苟”标准：

| 项目                    |         分数 | 原因                                        |
| --------------------- | ---------: | ----------------------------------------- |
| GitHub Pages workflow |     90/100 | 主流程正确，可加 secret scan / configure-pages 增强 |
| 前端路由                  |     90/100 | HashRouter + `/h/:code` + redirect 已有     |
| Supabase schema       |     45/100 | 还不是 managed_otp 结构                        |
| RPC 安全策略              |     40/100 | 仍无条件返回 password                           |
| 客户 handover UX        |     40/100 | 仍是 webmail/password 模式，不是托管验证码            |
| 文档一致性                 |     45/100 | README/CURRENT/setup 仍然旧逻辑                |
| Cloudflare OTP 链路     |      0/100 | GitHub 上未见配置/测试结果                         |
| 上线准备度                 | **45/100** | 不能部署给客户                                   |

---

# 10. 最严格 Go 标准

你真正可以开始部署 staging 的条件是：

```text
[ ] GitHub main 包含 managed_otp 相关代码
[ ] docs/ops/managed-otp-workflow.md 存在
[ ] docs/CURRENT.md 写 managed_otp 为默认模式
[ ] README 不再说客户看到 mailbox login/password
[ ] supabase/schema.sql 含 delivery_mode/customer_can_login/otp_managed_by_operator
[ ] migration 004 存在并可执行
[ ] get_handover_by_code 只在 customer_can_login=true 返回 mailbox_password
[ ] HandoverPage managed_otp 不显示 webmail/password
[ ] Orders/Mailboxes admin 可选择 delivery_mode，默认 managed_otp
[ ] npm run typecheck passes
[ ] npm run build passes
[ ] frontend/dist 无 service_role / sb_secret
[ ] GitHub Actions Pages workflow 成功
[ ] GitHub Pages 设置 Source = GitHub Actions
[ ] Repository variables 已设置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
[ ] Supabase 真实项目 migration 已应用
[ ] RLS 真实测试通过：anon 不能 select 表，只能 RPC 查单条
[ ] Cloudflare Email Routing 已验证 destination address
[ ] dt-test-001@tickets.buffjo.top 普通信能收
[ ] dt-test-001@tickets.buffjo.top TicketPlus+ OTP 能收
```

现在 GitHub `main` 至少卡在前 9 项。

---

# 11. 下一步必须怎么做

不要直接部署。先做这个顺序。

## 第一步：确认本地变更是否未 push

在本地跑：

```bash
git status
git log --oneline -5
git diff --stat origin/main
git branch --show-current
```

如果你看到很多 changed/untracked 文件，说明你说完成的 managed_otp 改动还没 commit/push。

然后：

```bash
git add .
git commit -m "feat(otp): switch handover flow to managed OTP"
git push origin main
```

---

## 第二步：重新审 GitHub main

push 以后，GitHub 上必须能看到：

```text
docs/ops/managed-otp-workflow.md
supabase/migrations/004_*.sql
frontend/src/pages/HandoverPage.tsx 里有 delivery_mode 分支
frontend/src/modules/mailboxes/index.tsx 里有 delivery_mode
frontend/src/modules/orders/index.tsx 里生成 managed_otp 文案
docs/CURRENT.md 默认 managed_otp
```

现在这些在 GitHub main 上看不到。

---

## 第三步：再跑 GitHub Actions

等 push 后，去 Actions 里确认：

```text
CI passed
Deploy to GitHub Pages passed
```

Pages workflow 文件本身基本正确；它已经用 `npm ci`、typecheck、build、artifact v4、deploy v4。

---

## 第四步：应用 Supabase migration 004

真实 Supabase 项目必须更新：

```text
mailbox_accounts.provider
mailbox_accounts.delivery_mode
mailbox_accounts.login_url
mailbox_accounts.username
mailbox_accounts.customer_can_login
mailbox_accounts.otp_managed_by_operator
password_enc nullable
```

然后测试：

```text
managed_otp handover RPC 返回 mailbox_password = null
external_mailbox handover RPC 才返回 mailbox_password
```

---

## 第五步：配置 Cloudflare Email Routing

至少先建：

```text
dt-test-001@tickets.buffjo.top → 你的主邮箱
```

Cloudflare Email Routing 的规则需要一个 custom address 和一个已验证 destination address；未验证目的邮箱前规则不会生效。([Cloudflare Docs][4])

---

## 第六步：真实端到端测试

测试顺序：

```text
1. GitHub Pages 打开 /#/admin/login
2. Supabase Auth 登录成功
3. 创建 mailbox account：dt-test-001@tickets.buffjo.top
4. delivery_mode = managed_otp
5. 创建 order
6. 生成 handover code
7. 打开 /#/h/CODE
8. 页面只显示 TicketPlus+ 登录邮箱，不显示密码
9. TicketPlus+ 请求 OTP
10. Cloudflare 转发到你的邮箱
11. 你把 OTP 发给客户/测试机
12. 记录结果
```

---

# 最终判定

**现在不能部署。**

更准确地说：

```text
GitHub Pages workflow：可以作为基础
当前 GitHub main：不能部署给客户
managed_otp 主线：未出现在 GitHub main
Supabase schema/RPC：仍是旧密码交付逻辑
Cloudflare OTP：未验证
```

你下一步不是写新功能，而是：

> **把你本地已经完成的 managed_otp 变更真正 push 到 GitHub main，然后我再按同样标准复审一次。**

等 GitHub main 真的包含 managed_otp、migration 004、HandoverPage 不显示密码、Cloudflare OTP 测试通过后，才可以进入 staging 部署。

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Row Level Security | Supabase Docs"
[2]: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages "Using custom workflows with GitHub Pages - GitHub Docs"
[3]: https://supabase.com/docs/guides/api/api-keys "Understanding API keys | Supabase Docs"
[4]: https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/ "Configure rules and addresses · Cloudflare Email Routing docs"
