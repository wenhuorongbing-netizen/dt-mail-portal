结论先放前面：**GitHub 上的 `dt-mail-portal` 还没有“全部准备好”。**
它现在已经从“启动包”推进到一个可构建的 **GitHub Pages + Supabase 静态 MVP 雏形**，但离你说的“用户体验最好、专业、高级、高效、可以给客户用”还有明显差距。最严重的问题不是前端页面，而是：**Supabase SQL 文件在 GitHub 上缺失、文档与代码命名不一致、交付链接路径不一致、密码返回逻辑与文档冲突、移动端后台布局可能溢出。**

我也参考了你贴的本地开发记录：本地已经完成了 HashRouter、静态路由、Supabase client、admin login、mailbox inventory、orders、handover page、GitHub Pages workflow，并且本地 `npm run build` 通过。 但是我这次审的是**GitHub 上真实仓库状态**，所以结论更严格。

---

## 1. 当前 GitHub 上已经准备好的部分

### A. 架构方向已经基本正确

README 已经明确写成 **GitHub Pages + Supabase**：前端是 React/Vite 静态构建，部署到 GitHub Pages；Supabase 负责 Auth、Postgres、RLS 和 RPC，Phase 1 不使用自定义后端。

产品 brief 也已经改成了正确方向：客户不注册、不登录，只拿 handover code/link；operator 通过 Supabase Auth 登录，手动导入邮箱凭证并生成交付码；FastAPI、mailcow API、自动邮箱创建都被放到未来阶段。

AGENTS.md 也已经同步了这个边界：Phase 1 是 GitHub Pages + Supabase，未来才做 FastAPI、mailcow API、Roundcube；并且明确禁止自动化 TicketPlus+ 注册、验证码绕过、自动付款和冒充官方。 

这一点是好的，说明项目方向没有继续走歪。

---

### B. GitHub Pages 路由基础已经有了

`main.tsx` 已经从 `BrowserRouter` 改成了 `HashRouter`，这对 GitHub Pages 是合适的，因为静态站刷新 `/admin` 或 `/handover/xxx` 容易 404，而 `/#/admin`、`/#/handover/xxx` 更稳定。

`App.tsx` 现在有客户侧页面和 admin 侧页面：`/`、`/handover/:code`、`/guide`、`/rules`、`/admin/login`、`/admin/*`。Admin 侧还有 `AdminGuard`，未登录会跳转到 `/admin/login`。 

这说明前端路由已经具备 MVP 的基本结构。

---

### C. Supabase 前端集成已经有了

`frontend/package.json` 已经加入 `@supabase/supabase-js`，并保留了 `build`、`typecheck`、`dev` 脚本。

`supabase.ts` 使用 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 初始化 Supabase client，没有在代码里写 service role key。

`.env.example` 也写了这两个变量，并提醒不能使用 service role key。

这和 Vite 官方机制一致：`VITE_` 前缀变量会被暴露到客户端 bundle，所以只能放公开可用的 publishable/anon key，不能放 secret/service_role。([vitejs][1]) Supabase 官方也说明 publishable key 可以暴露在网页、移动 app 等公共环境里，而 secret/service role 这类高权限 key 会绕过 RLS，只能用于后端环境。([Supabase][2])

---

### D. GitHub Pages workflow 基本可用

`.github/workflows/pages.yml` 已经存在，会在 push main 或手动触发时运行，构建 `frontend`，读取 GitHub repository variables 里的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，然后上传 `frontend/dist` 并用 `actions/deploy-pages@v4` 部署。  

GitHub 官方文档要求 Pages 部署 job 至少有 `pages: write` 和 `id-token: write` 权限，并且 deploy job 需要依赖 build job；你现在的 workflow 已经满足这个核心要求。([GitHub Docs][3])

---

## 2. 严重阻塞项：现在还不能说“准备好了”

### P0-1：Supabase SQL 文件在 GitHub 上缺失

这是最大问题。README 和 docs 都说要运行 `supabase/schema.sql` 和 `supabase/policies.sql`，但我在 GitHub 上直接访问 `supabase/schema.sql` 得到 404，访问 `supabase/migrations/001_update_status_workflow.sql` 也得到 404。与此同时，`.gitignore` 里明确忽略了 `*.sql`。

也就是说，你本地可能生成过 SQL，但**它没有进 GitHub 仓库**。这会导致任何人按 README 操作时无法创建 Supabase 表、RLS、RPC，也就无法真正跑起来。README 现在还在指示用户设置 schema、RLS 和 RPC。

必须先修：

```gitignore
# DB / secrets
*.sqlite
*.db
*.dump
*.pem
*.key
*.crt

# Allow versioned Supabase SQL migrations
!supabase/**/*.sql
!supabase/*.sql
```

然后把这些文件真正 commit 到 GitHub：

```text
supabase/schema.sql
supabase/policies.sql
supabase/migrations/001_update_status_workflow.sql
supabase/migrations/002_handover_rpc_include_password.sql
```

没有这些，**Supabase 后端等于不存在**。

---

### P0-2：RPC 名字混乱，代码和文档对不上 ✅ 已修复

~~这是第二个会直接导致功能不能跑的问题。~~

~~AGENTS.md 写的是客户 handover lookup 调用 `lookup_handover` RPC。~~
~~Roadmap 也写的是 `lookup_handover`。~~
~~但 `docs/supabase-mvp.md` 写的是 `get_handover_by_code()`，并且说明这是唯一匿名数据访问路径。~~
~~而 Handover 页面代码实际调用的是 `supabase.rpc('get_handover_by_code', { p_code: code })`。~~

已统一为 `get_handover_by_code(p_code text)`。所有 docs（README、AGENTS、architecture、roadmap、vibe-coding-workflow）均已更新，不再出现 `lookup_handover`。

---

### P0-3：密码是否返回给客户，文档和代码冲突 ✅ 已修复

~~这是第三个严重问题。~~

~~`docs/supabase-mvp.md` 明确写：`get_handover_by_code()` 不返回 mailbox password。 后面又再次写 "Does NOT return the mailbox password"。~~

已修复：`supabase/policies.sql` 中的 RPC 返回 `mailbox_password`，`docs/supabase-mvp.md` 已更新为说明密码是故意返回的（客户需要登录 webmail 收 OTP）。`supabase/migrations/002_handover_rpc_include_password.sql` 包含迁移。

---

### P0-4：交付链接路径不一致

README 里写客户收到类似：

```text
portal.buffjo.top/h/abc123
```



Roadmap 也写 handover page 是 `/h/:code`。

但 App 真实路由是：

```text
/#/handover/:code
```



因为你现在用 HashRouter，真实客户链接应该是：

```text
https://portal.buffjo.top/#/handover/ABC123
```

或者你可以改路由成：

```text
/#/h/ABC123
```

但是不要文档写 `/h/abc123`、代码写 `/handover/:code`。这会直接影响你发给客户的链接。

建议统一成短链接：

```text
/#/h/:code
```

原因：微信里短一点、截图更清楚、客户不容易复制错。

---

### P0-5：webmail URL 计算逻辑可能错

Guide 页面写死的是：

```text
https://webmail.buffjo.top
```



但 Handover 页面代码里根据 `mailbox_domain` 拼：

```text
https://webmail.${mailbox_domain}
```

如果 `mailbox_domain = tickets.buffjo.top`，就会变成：

```text
https://webmail.tickets.buffjo.top
```

这和你前面规划的 `webmail.buffjo.top` 不一致。Handover 页面应当使用独立配置：

```text
VITE_WEBMAIL_URL=https://webmail.buffjo.top
```

不要从邮箱域名推导 webmail 域名。邮箱域名是：

```text
tickets.buffjo.top
```

webmail 登录站是：

```text
webmail.buffjo.top
```

这是两个不同概念。

---

## 3. 用户体验审查：现在只是“能用雏形”，不是“最好体验”

### A. 客户首页太像文档入口，不像高端交付页

`CustomerLanding.tsx` 已经有独立服务声明、Guide、Rules、Handover Lookup 三个入口。 但它还不是一个“让客户觉得专业”的交付首页。

现在的问题：

1. 没有中文。你的客户大概率在微信里沟通，页面应该至少中英双语，默认中文。
2. 没有“我已经拿到取件码/交付码”的输入入口，只是提示 “Open your handover link”。
3. 没有“复制/扫码/联系客服”的明显操作。
4. 没有视觉上的“票务交付中心”高级感，只有基础卡片。

建议首页改成这三个主按钮：

```text
[我有交付码 / 打开我的账号]
[查看 TicketPlus+ 登录教程]
[规则与费用说明]
```

并加一个输入框：

```text
输入交付码：ABC123
按钮：查看我的邮箱账号
```

这样即使客户没有点你发的链接，也能手动输入 code。

---

### B. Handover 页面功能方向对，但还不够“傻瓜式”

Handover 页面已经会读 URL 参数、调用 Supabase RPC、展示 full email、local part、password、打开 webmail、复制按钮、错误状态和 warning。 这个方向是对的。

但从最佳用户体验看，还缺这些：

1. **缺少中文标签**
   现在是 Full Email、Username、Password、Open Webmail。客户在微信里打开时，建议显示：

   ```text
   TicketPlus+ 登录邮箱：xxx@tickets.buffjo.top
   邮箱网页登录用户名：xxx
   邮箱密码：xxxxx
   ```

2. **缺少“一键复制全部登录信息”**
   现在是分开复制 email/local/password，但客户经常会截图或转发。应有一个按钮：

   ```text
   一键复制完整登录信息
   ```

3. **缺少步骤进度条**
   建议页面顶部加：

   ```text
   ① 登录邮箱 → ② 收验证码 → ③ 登录 TicketPlus+ → ④ 查看车票
   ```

4. **缺少“先点这里”的视觉引导**
   当前字段很多，客户可能不知道第一步是打开 webmail 还是复制 email。第一屏应该只放两个主操作：

   ```text
   [打开邮箱收验证码]
   [复制 TicketPlus+ 登录邮箱]
   ```

5. **密码显示逻辑需要更明确**
   “显示密码”按钮可以保留，但复制密码要更明显。客户最怕输错密码。

6. **缺少 TicketPlus+ 官方关键提醒**
   TicketPlus+ 官方 FAQ 说明，票可能只会在对应月份 1 日凌晨约 3 点后激活显示；登录时必须使用购买时同一个邮箱和同一种登录方式；每个账号/邮箱只能有一个 active Deutschlandticket。([TicketPlus+][4]) 这些都应该体现在客户页面里，否则客户会问：“为什么我登录了看不到票？”

---

### C. Guide 页面内容太粗，需要按真实 TicketPlus+ 风险重写

Guide 页面现在写了 7 步：下载 TicketPlus+、Email Login、请求 OTP、检查邮箱、找 OTP、输入 code、查看票。 基础是对的。

但最佳体验版应该补充这些官方已知坑：

1. **票不是 PDF/纸质票**
   TicketPlus+ 官方说明 Deutschlandticket 是数字移动票，可以在 App 或 Apple/Google Wallet 显示，PDF/纸质打印不被接受。([TicketPlus+][4])

2. **票不一定立刻显示**
   官方 FAQ 写，未来月份票只会在对应月份 1 日约 3 点后激活显示。([TicketPlus+][4])

3. **登录错邮箱会看不到票**
   官方 FAQ 说明，登录错账户是看不到票的常见原因，必须使用收到订单确认的邮箱和正确登录方式。([TicketPlus+][4])

4. **TicketPlus+ 默认是无密码 OTP 登录**
   官方 FAQ 写，默认登录方式是输入邮箱后收一次性密码/OTP。([TicketPlus+][4])

5. **每个邮箱只能有一个 active Deutschlandticket**
   官方 FAQ 写，每个 active subscription 需要唯一账号和唯一邮箱。([TicketPlus+][4])

这几个点是减少售后的关键。现在 Guide 页面没有把这些坑讲清楚。

---

### D. Rules 页面方向对，但内容需要更精确

Rules 页面已经写了 10 号规则、个人票规则、退款政策、独立服务声明。

但存在两个问题：

1. 文案写 “Before the 10th / After the 10th”，而 TicketPlus+ FAQ 的关键表述是 **before the 10th** 和 **on or after the 10th**。官方说明：如果首次购买在 10 号或之后，通常至少承诺当前月 + 下个月，最早只能为再下个月暂停/取消。([TicketPlus+][4])
   所以页面上不要写模糊的 “after 10th”，应该写：

   ```text
   1–9号购买：通常可只处理当前月
   10号及之后购买：通常至少当前月 + 下个月
   ```

   或者如果你业务内部按“10号前/10号后”收费，需要解释清楚你采用的口径，避免客户 10 号当天纠纷。

2. 价格应动态显示当前规则
   页面应该有一个小计算器：

   ```text
   选择下单日期：2026-06-11
   系统提示：需要 2 个月，票价 126 欧 + 服务费
   ```

   这会大幅减少争议。

---

## 4. Admin 后台审查：功能有了，但还不够稳定/高效

### A. Admin 登录基本有了

`AdminLogin.tsx` 使用 Supabase Auth 的 email/password 登录，成功后跳转 `/admin/orders`。

`AuthProvider` 会读取 Supabase session，并监听 auth state change。

这部分可作为 MVP 基础。

但要上线前还应加：

```text
登录失败次数提示
忘记密码入口
当前登录用户显示
会话过期提示
MFA/二次验证，至少作为未来任务
```

---

### B. Mailbox inventory 有一个严重体验问题：notes 输入了但没保存

Mailbox 页面有 `notes` state，也有 Notes 输入框。 但插入 Supabase 时只写了：

```text
email_address
password_enc
domain
status
```

没有把 `notes` 插入数据库。

这会导致你以为备注保存了，实际刷新后没了。要么删除 notes 输入框，要么给 `mailbox_accounts` 加 `notes` 字段并保存。

---

### C. Orders 模块功能已经很多，但状态和文档仍不一致

Orders 模块前端定义的状态是：

```text
requested
paid
mailbox_assigned
ticket_purchased
delivered
closed
exception
```



但 roadmap 仍然写：

```text
draft → pending_payment → paid → ticketed → handed_over → closed
```



这会导致后续 AI agent 继续开发时又写出一套新状态。必须统一。

我建议最终状态流定成：

```text
requested            客户咨询/待付款
paid                 已付款
mailbox_assigned     已分配邮箱
ticket_purchased     已出票
handover_created     已生成交付码
delivered            已交付给客户
closed               已完成
exception            异常
```

现在少了 `handover_created`，而这一步对你业务很关键，因为“已出票”和“客户已拿到账号”不是一回事。

---

### D. Admin 页面不够移动端友好

你客户页面是 540px mobile-first，但 admin 的 orders/mailboxes 页面用了固定双栏 grid，比如 `minmax(320px, 400px) 1fr` 或 `minmax(300px, 380px) 1fr`。从你贴的开发记录看本地 build 通过，但 build 通过不等于 390px 手机宽度体验通过。

AGENTS.md 明确要求 390px mobile viewport 可用。 现在这类固定双栏后台在手机上大概率横向溢出，尤其微信浏览器里更难用。

解决方式：

```css
.admin-grid {
  display: grid;
  grid-template-columns: minmax(320px, 400px) 1fr;
}

@media (max-width: 860px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}
```

并把内联 style 改成 className，不要继续堆大量 inline style。

---

## 5. 部署审查：workflow 有了，但还不是最优

### 已经 OK 的部分

Pages workflow 触发条件、权限、build、artifact、deploy 都有。  GitHub 官方也要求 Pages deploy job 有 `pages: write` 和 `id-token: write`，这点满足。([GitHub Docs][3])

### 需要优化的部分

1. **workflow 用 `npm install`，建议改 `npm ci`**
   `package-lock.json` 已经存在。 生产构建应使用 `npm ci`，保证依赖完全可复现。

2. **Pages workflow 没单独跑 typecheck**
   `npm run build` 已经包含 `tsc -b && vite build`。 所以不是阻塞，但为了日志清晰，建议分成：

   ```yaml
   - run: npm ci
   - run: npm run typecheck
   - run: npm run build
   ```

3. **`upload-pages-artifact@v3` 可更新到 v4**
   GitHub 官方当前文档示例使用 `actions/upload-pages-artifact@v4`。([GitHub Docs][3]) 你现在用 v3 不一定坏，但为了维护性建议升级。

4. **没有验证 GitHub Pages 是否已在 repo settings 设为 GitHub Actions source**
   README 写了操作步骤。 但这不是代码能保证的，需要你在 GitHub Settings 手动确认。

---

## 6. Issue 管理审查：全部还是 open，不能反映真实进度

GitHub 当前 #1–#15 全部仍是 open，包括已经做了一部分的客户首页、教程页、规则页、后台订单、邮箱账号生成、交付文案、状态流转等。

这会让项目管理很混乱。现在应该做一次 issue 重组：

### 应关闭或标记完成的旧 issue

```text
#1 初始化 monorepo 项目结构
#2 客户门户首页移动端 UI
#3 TicketPlus+ 登录教程页面
#4 规则说明页面
#5 后台订单列表
#6 后台新建订单页面
#7 邮箱账号生成逻辑
#8 客户交付文案生成
#9 订单状态流转
```

但注意：不是直接关闭，而是先 comment：

```text
Implemented first MVP slice. Needs UX polish tracked in new issues.
```

### 应新建的 P0 issues

```text
P0: Commit Supabase SQL schema/policies/migrations to GitHub
P0: Unify RPC name get_handover_by_code across docs and frontend
P0: Unify handover route to /#/h/:code or /#/handover/:code
P0: Fix webmail URL config, do not derive from mailbox domain
P0: Align password return policy and docs
P0: Add mobile responsive admin layout
P0: Fix mailbox notes field not saved
```

### 应新建的 UX issues

```text
UX: Make customer portal Chinese-first / bilingual
UX: Add handover code manual input on landing page
UX: Add one-click copy all credentials
UX: Add visual stepper on handover page
UX: Add TicketPlus+ known troubleshooting states
UX: Add pre-purchase 10th-day price calculator
UX: Add privacy/terms pages
```

---

## 7. 严格评分

按“最好用户体验 + 可以真实上线”的标准：

```text
架构方向：8/10
前端路由基础：7/10
客户页面体验：5/10
Admin 操作效率：5.5/10
Supabase 后端准备：2/10
部署准备：6.5/10
文档一致性：4/10
上线可信度：3/10
```

综合判断：

```text
当前状态：可继续开发的雏形
不是：可上线产品
不是：最佳用户体验
不是：完整 Supabase MVP
```

最大扣分点就是：**Supabase SQL 不在 GitHub 上**，并且 `.gitignore` 正在忽略 `*.sql`。

---

## 8. 下一步应该怎么推进

不要继续加新功能。先做“收口”和“统一”。

### 第一步：修 Supabase 文件缺失

让 agent 执行：

```text
Read README.md, docs/supabase-mvp.md, AGENTS.md.

Fix the Supabase SQL tracking issue.

Tasks:
1. Update .gitignore so supabase/*.sql and supabase/migrations/*.sql are tracked.
2. Ensure these files exist and are committed:
   - supabase/schema.sql
   - supabase/policies.sql
   - supabase/migrations/001_update_status_workflow.sql
   - supabase/migrations/002_handover_rpc_include_password.sql
3. If existing SQL files are missing locally, recreate them from docs and current frontend expectations.
4. Make RPC name get_handover_by_code(p_code text) canonical.
5. Update docs/supabase-mvp.md so it says mailbox_password is returned intentionally for customer handover.
6. Run npm run build.

Acceptance:
- GitHub shows the SQL files. ✅
- No docs mention lookup_handover. ✅
- docs and frontend both use get_handover_by_code. ✅
- .gitignore still protects dumps/secrets but allows versioned Supabase migrations. ✅
```

### 第二步：统一路由和交付链接

建议统一为：

```text
/#/h/:code
```

Prompt：

```text
Unify customer handover route to /h/:code under HashRouter.

Tasks:
1. Change App route from /handover/:code to /h/:code.
2. Update all generated handover links in Orders module.
3. Update README, docs/architecture.md, docs/roadmap.md, docs/product-brief.md.
4. Keep redirect compatibility: /handover/:code should redirect to /h/:code.
5. Build passes.

Acceptance:
- Customer links are always https://portal.buffjo.top/#/h/CODE
- Old /#/handover/CODE links still work through redirect.
```

### 第三步：修 webmail URL

Prompt：

```text
Fix webmail URL configuration.

Tasks:
1. Add VITE_WEBMAIL_URL to frontend/.env.example.
2. Update frontend/src/lib/config.ts with:
   WEBMAIL_URL = import.meta.env.VITE_WEBMAIL_URL ?? 'https://webmail.buffjo.top'
3. Use WEBMAIL_URL in HandoverPage, GuidePage, Orders handover text.
4. Do not derive webmail URL from mailbox domain.
5. Update README GitHub Pages variables section.

Acceptance:
- Mailbox domain remains tickets.buffjo.top.
- Webmail URL remains webmail.buffjo.top.
- Generated customer handover text uses the configured WEBMAIL_URL.
```

### 第四步：UX 升级客户交付页

Prompt：

```text
Upgrade customer handover UX for best mobile/WeChat experience.

Requirements:
- Chinese-first, English secondary.
- First screen must show:
  1. Open Webmail
  2. Copy TicketPlus+ Email
  3. Copy Password
- Add one-click "copy all login details".
- Add stepper:
  登录邮箱 → 收验证码 → 登录 TicketPlus+ → 查看车票
- Add troubleshooting:
  - Ticket not visible before 1st day 3:00
  - Must use the exact same email/login method
  - Each email/account supports only one active Deutschlandticket
- Add independent-service notice.
- 390px mobile viewport must not overflow.
- Build passes.
```

TicketPlus+ 官方 FAQ 明确提到这些高频问题：票可能在对应月份 1 日约 3 点才显示、登录错账号会看不到票、必须用购买时相同邮箱/登录方式、每个 active subscription 需要唯一账号和唯一邮箱。([TicketPlus+][4])

### 第五步：把 admin 做成真正高效

Prompt：

```text
Upgrade admin workflow UX.

Tasks:
1. Make Orders and Mailboxes responsive under 860px.
2. Replace inline grid styles with CSS classes.
3. Add one-click copy:
   - full handover message
   - handover link
   - TicketPlus+ purchase input block
4. Add filters:
   - status
   - month
   - assigned/unassigned mailbox
5. Add warning if order has no mailbox but user tries to generate handover.
6. Add handover_created status.
7. Save notes in mailbox_accounts or remove notes input.
8. Build passes.
```

---

## 最终判断

**现在不能上线给客户用。**
不是因为前端完全不能跑，而是因为关键后端 SQL 没进 GitHub、文档和代码不一致、交付链接不统一、客户页面还不够傻瓜式、admin 移动端可能不好用。

**下一步不要继续扩功能。** 先按这个顺序收口：

```text
1. 提交 Supabase SQL 文件，修 .gitignore
2. 统一 RPC 名字
3. 统一交付链接 /#/h/:code
4. 修 webmail URL 配置
5. 修密码返回文档
6. 升级客户 handover 页面中文移动端体验
7. 修 admin 响应式和 notes 保存
8. 再跑 GitHub Pages + Supabase 真实端到端测试
```

做到这些之后，才可以进入“准上线测试”。现在的状态是：**开发方向对了，但还没有准备好，尤其没有达到你要的最佳用户体验。**

[1]: https://vite.dev/guide/env-and-mode "Env Variables and Modes | Vite"
[2]: https://supabase.com/docs/guides/api/api-keys "Understanding API keys | Supabase Docs"
[3]: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages "Using custom workflows with GitHub Pages - GitHub Docs"
[4]: https://www.ticket-plus.app/en/deutschlandticket-germany-ticket-e58/ "FAQ - Frequently Asked Questions - TicketPlus+"
