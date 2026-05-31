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

你现在这个仓库的 docs 不是“没用”，而是**经历了几次架构转向以后，旧文档、新文档、未来规划文档混在一起了**。最核心的问题不是文件太多，而是：**没有一个明确的 current source of truth**，导致 agent 很容易今天按 Supabase 写，明天又按 FastAPI/mailcow 写，或者 RPC、路由、状态流互相打架。

你贴的开发记录里能看出来，项目已经从 FastAPI skeleton 逐步 pivot 到 GitHub Pages + Supabase：做过 HashRouter、静态模块、Supabase schema、admin auth、mailbox inventory、orders、handover page、Pages workflow 等步骤。 GitHub 上 README 也已经明确写了 Phase 1 是 **GitHub Pages + Supabase**，没有自定义后端。 所以整理 docs 的第一原则就是：**现在所有文档都要围绕 Phase 1，而不是围绕未来 FastAPI/mailcow。**

---

## 一句话判断

现在 docs 应该分成四类：

```text
1. 现在必须用：Phase 1 开发、部署、UX、SOP 的真实依据
2. 需要更新后继续用：内容有价值，但和当前代码/架构有冲突
3. 未来才用：FastAPI、mailcow、模块系统、服务器部署
4. 归档不用：启动包、旧 issue、旧数据模型草稿
```

你下一步不是继续加功能，而是先把 docs 整理成：

```text
docs/CURRENT.md          当前唯一真相
docs/README.md           文档地图
docs/product/            产品与用户流程
docs/ux/                 客户体验和设计
docs/supabase/           Supabase 设置、RLS、RPC、测试
docs/ops/                人工购票 SOP、交付 SOP、上线清单
docs/future/             FastAPI / mailcow / module system
docs/archive/            旧草稿和过期规划
```

---

## 这些 docs 分别是干什么的

### 1. `README.md`

**作用：仓库首页，不是详细开发说明。**

README 当前已经说明了项目是 mobile-first mailbox portal + admin panel，并且 Phase 1 是 GitHub Pages + Supabase。 它还说明客户不注册、不登录，只通过 handover link/code 看一条交付记录。

**现在用得上。**

但 README 不应该塞太多细节。它只需要告诉人：

```text
这个项目是什么
当前架构是什么
怎么本地跑
怎么部署 GitHub Pages
哪些 docs 必读
哪些东西 Phase 1 不做
```

**整理建议：保留，精简，作为入口页。**

---

### 2. `AGENTS.md`

**作用：给 AI coding agent 的最高规则。**

这个文件非常重要。它现在已经写清楚 Phase 1 是 GitHub Pages + Supabase，未来才是 FastAPI、mailcow API、Roundcube。 它也明确禁止自动化 TicketPlus+ 注册、验证码绕过、自动付款、冒充官方等。

**现在用得上，而且必须保留。**

但是它里面有些规则需要和当前实现统一，比如它说 customer handover lookup 调 `lookup_handover`，而现在代码实际调用的是 `get_handover_by_code`。AGENTS 这类文件一旦错，agent 会跟着错。

**整理建议：保留在根目录，但更新为“只读 docs/CURRENT.md 作为当前真相”。**

---

### 3. `docs/product-brief.md`

**作用：产品定义，回答“我们到底在做什么”。**

这个文档很有用。它写清楚了项目使命：为 Deutschlandticket purchase-assistance workflow 做专用邮箱、OTP 登录协助和运营后台。 它还写了客户流程和 operator 流程：客户付款、operator 创建订单/邮箱、人工购票、生成 handover、客户用 webmail 收 OTP 登录 TicketPlus+。

**现在用得上。**

但它不应该包含太多技术细节，技术细节放 `architecture.md` 或 `supabase-mvp.md`。

**整理建议：移动到 `docs/product/product-brief.md`，保留。**

---

### 4. `docs/architecture.md`

**作用：技术架构说明。**

当前 architecture 已经写成 Phase 1 静态前端 + Supabase：客户浏览器访问 GitHub Pages，调用 Supabase RPC；operator 用 Supabase Auth 登录，操作 orders/mailboxes/handover records。 它还把 FastAPI、mailcow API 放到了未来阶段。

**现在用得上。**

但它目前有几个需要修的地方：

```text
1. RPC 名字要统一。
2. handover route 要统一。
3. password 是否返回给客户要统一。
4. status flow 要统一。
```

**整理建议：保留为 `docs/architecture.md`，但它必须和 `docs/CURRENT.md` 保持一致。**

---

### 5. `docs/supabase-mvp.md`

**作用：Supabase 设置说明、表结构、RLS、RPC 的核心文档。**

这个是 Phase 1 最关键的技术文档。它解释了 Supabase Postgres、Auth、RLS、RPC 各自用途。 它还说明要运行 `supabase/schema.sql` 和 `supabase/policies.sql`。

**现在必须用。**

但它也是目前最需要修的文档，因为它和代码/业务有冲突：

```text
它说 get_handover_by_code 不返回 mailbox password；
但客户页面需要显示邮箱密码。
```

文档里明确写了 “Does NOT return the mailbox password”。 但你的业务流程和 handover 页面都需要把邮箱密码交给客户，否则客户没法登录 webmail 收 OTP。

另外，你贴的本地记录显示曾经创建了 `supabase/schema.sql`、`supabase/policies.sql`、migration 等文件。 但 GitHub 上我之前审查时发现 `.gitignore` 里有 `*.sql`，会忽略 SQL 文件。 这会导致文档说“运行 schema.sql”，但仓库里可能没有 SQL 文件。

**整理建议：保留，但移动到 `docs/supabase/setup.md`，并立即修正。**

---

### 6. `docs/roadmap.md`

**作用：阶段规划。**

这个文档有用，因为它把 Phase 1 到 Phase 6 列清楚了。现在 Phase 1 是 GitHub Pages + Supabase，Phase 3 才是 FastAPI + mailcow automation，Phase 4 才是真服务器部署。 

**现在用得上，但需要更新状态。**

它的问题是：里面有些状态流还是旧的，例如写了 `draft → pending_payment → paid → ticketed → handed_over → closed`。 但现在代码里已经用另一套状态：`requested / paid / mailbox_assigned / ticket_purchased / delivered / closed / exception`。

**整理建议：保留，但改成“当前完成度 + 下一步”。不要再只是概念路线图。**

---

### 7. `docs/design-system.md`

**作用：UI 设计方向。**

这个文件很有价值。它定义了“professional transit operations desk”的视觉方向，并规定客户页面要看起来 professional、trustworthy、mobile-first。 它也定义了配色、字体、组件和客户文案风格。

**现在用得上。**

问题是它还比较抽象。下一步做 UX polish 时，它应该变成更具体的：

```text
按钮尺寸
移动端首屏结构
handover 页卡片规范
中文/英文文案规范
状态颜色
复制按钮规范
```

**整理建议：移动到 `docs/ux/design-system.md`，继续保留。**

---

### 8. `docs/mobile-wechat-ux.md`

**作用：微信/手机端体验规则。**

这个文件非常适合你的项目，因为客户很可能在微信里打开页面。它要求假设客户在手机/微信浏览器里操作，按钮要大、说明要短、文本要可复制。 它还特别强调要区分：

```text
Mailbox login username: dt202606001
TicketPlus+ login email: dt202606001@tickets.buffjo.top
```

这个是最容易搞错的地方。

**现在非常用得上。**

**整理建议：移动到 `docs/ux/mobile-wechat-ux.md`，并和 handover 页面改版绑定。**

---

### 9. `docs/ticketplus-sop.md`

**作用：人工购票 SOP。**

这个文件是运营手册，不是技术文档。它写了付款前客户必须确认什么、operator 如何人工购买、10号规则如何收款、handover message 要包含哪些内容。 

它还明确说不要只发 QR 截图、不要承诺退款、不要承诺一定能删除付款方式、不要承诺官方合作。

**现在非常用得上。**

这是你后面真正减少纠纷的文档。

**整理建议：移动到 `docs/ops/ticketplus-sop.md`，保留并扩展成检查单。**

---

### 10. `docs/security-privacy.md`

**作用：安全、隐私、风控基本原则。**

这个文件列了关键风险：客户数据泄漏、邮箱密码泄漏、admin 未授权访问、客户滥用邮箱、平台账号混淆、续费纠纷。 它也列了 MVP 最低控制：private repo、无 secrets、强 admin 密码、HTTPS、admin auth、邮箱额度、audit logs、客户条款和隐私页。

**现在用得上。**

但它还没有和 Supabase/RLS/handover code 具体绑定。

**整理建议：移动到 `docs/ops/security-privacy.md`，补充：handover code 过期、viewed_at、密码展示、RLS 测试。**

---

### 11. `docs/vibe-coding-workflow.md`

**作用：告诉你怎么让 AI agent 分阶段写代码。**

这个文件很重要，因为这个项目本身就是靠 vibe coding 逐步搭起来的。它的核心规则是：不要让 AI “build everything”，而是一次一个 slice、一个 acceptance test、一个 boundary。

**现在用得上。**

但它要更新成当前真实顺序：

```text
1. docs 整理
2. Supabase SQL 修复
3. 路由/RPC/状态统一
4. 客户 handover UX
5. admin 响应式
6. 真实 Supabase 测试
7. GitHub Pages 发布
```

**整理建议：保留为 `docs/vibe-coding-workflow.md`，但改成当前 Phase 1 的 workflow。**

---

### 12. `docs/module-contract.md`

**作用：未来 FastAPI 模块系统约定。**

这个文件现在主要是未来用的。它还在说每个 module 要有 backend config、`backend_router`、`/api/modules`、FastAPI APIRouter。 它还说新增模块时要创建 `backend/app/modules/<module_id>/module.config.json`，重启 backend，并确认 `/api/modules` 包含该模块。

这和当前 Phase 1 的 GitHub Pages + Supabase 不一致。现在前端已经是静态模块 registry，不应该让 agent 继续按 `/api/modules` 写。

**现在暂时用不上。**

但不要删除。以后 FastAPI/mailcow 自动化阶段会用。

**整理建议：移动到 `docs/future/module-contract.md`，顶部加：`Future Phase 3 only — not used in Phase 1`。**

---

### 13. `docs/data-model.md`

**作用：旧的数据模型草稿。**

这个文件现在基本过时了。它写的是 `orders / mailboxes / ticket_tasks / audit_logs`，字段也偏 FastAPI/未来设计，比如 `passenger_name_encrypted`、`password_encrypted`、`ticket_tasks`。 但当前 Supabase 文档里实际是 `mailbox_accounts / orders / handover_codes / audit_events`。

**现在不应该作为开发依据。**

否则 agent 可能又去创建 `ticket_tasks` 或 `mailboxes`，和现有 `mailbox_accounts` 冲突。

**整理建议：归档到 `docs/archive/data-model-draft-old.md`，或者把有用内容合并进 `docs/supabase/schema-reference.md` 后删除原文件。**

---

### 14. `docs/repo-setup.md`

**作用：初始化 GitHub 仓库时用。**

这个文件写的是怎么 `git init`、怎么创建 repo、branch strategy、labels、milestones。

现在 repo 已经建好了，Phase 1 已经推进过了，所以它的主要价值已经过去。

**现在基本用不上。**

**整理建议：移动到 `docs/archive/repo-setup-old.md`。**

---

### 15. `docs/github-issues.md`

**作用：最初 issue 计划。**

这个文件列了 #1–#25 的初始 issues。 但 GitHub 当前真实 issue 仍然是 #1–#15，而且很多已经部分完成但还是 open。

**现在不应该继续作为计划依据。**

真实计划应该从 GitHub issue board 更新，不应该靠这个旧 markdown。

**整理建议：移动到 `docs/archive/github-issues-old.md`，新建 `docs/ops/current-issues.md` 或直接用 GitHub Issues。**

---

## 哪些现在最有用

现在真正要读的应该只有这些：

```text
README.md
AGENTS.md
docs/CURRENT.md            ← 需要新建
docs/product/product-brief.md
docs/architecture.md
docs/supabase/setup.md
docs/ux/design-system.md
docs/ux/mobile-wechat-ux.md
docs/ops/ticketplus-sop.md
docs/ops/security-privacy.md
docs/vibe-coding-workflow.md
```

其中 **`docs/CURRENT.md` 最重要**。它应该用一页写清楚：

```text
当前架构：GitHub Pages + Supabase
当前路由：/#/h/:code 或 /#/handover/:code
当前 RPC：get_handover_by_code
当前状态流：requested → paid → mailbox_assigned → ticket_purchased → handover_created → delivered → closed
当前 webmail URL：VITE_WEBMAIL_URL，不从邮箱域名推导
当前 handover 是否返回密码：返回，因为客户需要登录邮箱
当前不做：FastAPI、mailcow API、自动 TicketPlus+ 注册/支付
```

---

## 哪些现在不要再让 agent 读

为了避免 agent 混乱，这些先不要进入 context pack：

```text
docs/module-contract.md
docs/data-model.md
docs/repo-setup.md
docs/github-issues.md
```

不是因为它们完全没用，而是因为它们会把 agent 带回旧路线。

处理方式：

```text
module-contract.md → docs/future/module-contract.md
data-model.md → docs/archive/data-model-draft-old.md
repo-setup.md → docs/archive/repo-setup-old.md
github-issues.md → docs/archive/github-issues-old.md
```

---

## 我建议的整理后目录结构

不要搞太复杂。建议这样：

```text
docs/
  README.md
  CURRENT.md

  product/
    product-brief.md
    user-flows.md

  ux/
    design-system.md
    mobile-wechat-ux.md
    customer-copy.md

  supabase/
    setup.md
    schema-reference.md
    rls-test-checklist.md

  ops/
    ticketplus-sop.md
    security-privacy.md
    launch-checklist.md

  future/
    module-contract.md
    fastapi-mailcow-plan.md

  archive/
    data-model-draft-old.md
    repo-setup-old.md
    github-issues-old.md
```

其中：

```text
docs/README.md
```

只做文档地图，告诉 agent 和人类：

```text
当前开发先读什么
未来阶段读什么
哪些已经归档，不要作为依据
```

---

## 下一步应该怎么整理

### 第一步：新建 `docs/CURRENT.md`

这是最重要的一步。内容不要长，但必须明确。

建议内容：

```md
# Current Source of Truth

## Current phase

Phase 1: GitHub Pages + Supabase.

No FastAPI, no mailcow API, no automated TicketPlus+ registration/payment in Phase 1.

## Routes

Customer:
- /#/               landing
- /#/h/:code        customer handover page
- /#/guide          TicketPlus+ guide
- /#/rules          billing/rules

Admin:
- /#/admin/login
- /#/admin/orders
- /#/admin/mailboxes

## Supabase

Frontend uses:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Never use service_role in frontend.

RPC:
- get_handover_by_code(p_code text)

## Handover behavior

The RPC returns:
- full email
- local part
- mailbox password
- webmail URL or enough data to display configured webmail URL
- instructions
- order/ticket status

The mailbox password is returned intentionally because the customer needs it to log in to webmail and receive TicketPlus+ OTP.

## Status flow

requested
paid
mailbox_assigned
ticket_purchased
handover_created
delivered
closed
exception

## Current priorities

1. Track Supabase SQL files in GitHub.
2. Unify route/RPC/status naming.
3. Polish customer handover UX.
4. Polish admin mobile/responsive workflow.
5. Test real GitHub Pages + Supabase flow.
```

---

### 第二步：新建 `docs/README.md`

示例：

```md
# Docs Map

## Read first

- `CURRENT.md`
- `../AGENTS.md`
- `product/product-brief.md`
- `architecture.md`
- `supabase/setup.md`

## UX references

- `ux/design-system.md`
- `ux/mobile-wechat-ux.md`

## Operations

- `ops/ticketplus-sop.md`
- `ops/security-privacy.md`
- `ops/launch-checklist.md`

## Future only

- `future/module-contract.md`
- `future/fastapi-mailcow-plan.md`

## Archived

Files in `archive/` are historical drafts. Do not use them as implementation source of truth.
```

---

### 第三步：移动文档，不要急着删除

执行：

```text
docs/design-system.md        → docs/ux/design-system.md
docs/mobile-wechat-ux.md     → docs/ux/mobile-wechat-ux.md
docs/ticketplus-sop.md       → docs/ops/ticketplus-sop.md
docs/security-privacy.md     → docs/ops/security-privacy.md
docs/supabase-mvp.md         → docs/supabase/setup.md
docs/module-contract.md      → docs/future/module-contract.md
docs/data-model.md           → docs/archive/data-model-draft-old.md
docs/repo-setup.md           → docs/archive/repo-setup-old.md
docs/github-issues.md        → docs/archive/github-issues-old.md
```

然后更新 README 和 AGENTS 里的链接。

---

### 第四步：修掉所有命名冲突

统一这些：

#### 1. Handover 路由

现在 README 示例是 `portal.buffjo.top/h/abc123`。
代码路由是 `/handover/:code`。

建议统一成：

```text
/#/h/:code
```

并保留兼容跳转：

```text
/#/handover/:code → /#/h/:code
```

#### 2. RPC 名字

统一成：

```text
get_handover_by_code
```

不要再出现：

```text
lookup_handover
```

#### 3. 密码字段

现在不要叫：

```text
password_enc
```

除非真的加密。否则叫：

```text
mailbox_password
```

或：

```text
password_for_handover
```

更诚实。

#### 4. 状态流

统一成：

```text
requested
paid
mailbox_assigned
ticket_purchased
handover_created
delivered
closed
exception
```

#### 5. Webmail URL

不要从邮箱 domain 推导。要用：

```text
VITE_WEBMAIL_URL=https://webmail.buffjo.top
```

---

### 第五步：处理 SQL 文件问题

这个是技术整理里最急的。因为文档说要运行 SQL，但 `.gitignore` 现在忽略了 `*.sql`。

修改 `.gitignore`：

```gitignore
# DB / secrets
*.sqlite
*.db
*.dump
*.pem
*.key
*.crt

# Keep versioned Supabase SQL files
!supabase/**/*.sql
!supabase/*.sql
```

然后确认 GitHub 上能看到：

```text
supabase/schema.sql
supabase/policies.sql
supabase/migrations/001_update_status_workflow.sql
supabase/migrations/002_handover_rpc_include_password.sql
```

---

## 给 agent 的整理 prompt

你可以直接把这个丢给 Cursor/Codex：

```text
Read AGENTS.md, README.md, docs/architecture.md, docs/roadmap.md, docs/supabase-mvp.md, docs/design-system.md, docs/mobile-wechat-ux.md, docs/ticketplus-sop.md, docs/security-privacy.md, docs/module-contract.md, docs/data-model.md, docs/repo-setup.md, and docs/github-issues.md.

We need to reorganize documentation so Phase 1 has one clear source of truth.

Do not change application code except links in docs if needed.

Tasks:

1. Create docs/CURRENT.md.
   It must define:
   - current phase: GitHub Pages + Supabase
   - customer routes
   - admin routes
   - canonical RPC name: get_handover_by_code
   - whether mailbox password is returned to customer: yes, intentionally for webmail login
   - canonical status flow
   - current no-go boundaries: no FastAPI, no mailcow API, no automated TicketPlus+ registration/payment

2. Create docs/README.md as a documentation map.

3. Move docs:
   - docs/design-system.md → docs/ux/design-system.md
   - docs/mobile-wechat-ux.md → docs/ux/mobile-wechat-ux.md
   - docs/ticketplus-sop.md → docs/ops/ticketplus-sop.md
   - docs/security-privacy.md → docs/ops/security-privacy.md
   - docs/supabase-mvp.md → docs/supabase/setup.md
   - docs/module-contract.md → docs/future/module-contract.md
   - docs/data-model.md → docs/archive/data-model-draft-old.md
   - docs/repo-setup.md → docs/archive/repo-setup-old.md
   - docs/github-issues.md → docs/archive/github-issues-old.md

4. Update README.md and AGENTS.md links to the new docs locations.

5. Update moved docs so they do not contradict CURRENT.md:
   - no lookup_handover; use get_handover_by_code
   - no /h/:code without hash unless explicitly saying GitHub Pages uses /#/h/:code
   - no “password is not returned” if the customer handover page needs password
   - no old status flow names

6. Add a note at the top of docs/future/module-contract.md:
   “Future Phase 3 only. Not used in Phase 1.”

7. Add a note at the top of every archive file:
   “Archived historical draft. Do not use as implementation source of truth.”

Acceptance:
- docs/README.md clearly tells agents what to read first.
- docs/CURRENT.md is the single source of truth.
- README and AGENTS link to the new docs paths.
- No active docs mention lookup_handover.
- No active docs contradict the current GitHub Pages + Supabase Phase 1 architecture.
- Do not delete old docs; archive them.
```

---

## 整理后的下一步开发顺序

文档整理完后，不要马上加新模块。按这个顺序：

```text
1. 修 .gitignore，确保 Supabase SQL 文件进入 GitHub
2. 统一 route：/#/h/:code
3. 统一 RPC：get_handover_by_code
4. 统一 password 字段和文档
5. 统一 status flow
6. 修 webmail URL：VITE_WEBMAIL_URL
7. 做客户 handover 页面中文移动端升级
8. 做 admin orders/mailboxes 响应式升级
9. 在 Supabase 真实项目跑 schema/policies
10. GitHub Pages 部署真实测试
```

你现在最需要的是**先建立文档秩序**。否则继续 vibe coding，agent 会被旧文档误导，反复生成互相冲突的代码。
