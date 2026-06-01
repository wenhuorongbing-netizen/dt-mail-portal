# 验收计划

> **默认交付模式：`wallet_only`**
> 客户只收到官方 Wallet 添加链接，不拿到 TicketPlus+ 登录邮箱、邮箱密码或 OTP。
> `managed_otp` 是例外模式，单独验证。

---

## Phase A：wallet_only 默认流程验收

这是主线。客户付款后，operator 创建订单、生成 handover link，客户打开页面只看到 Wallet 添加指引。

### A1. 应用 Supabase 迁移

把 migration 004 + 005 应用到真实 Supabase 项目。

```bash
supabase login
supabase link
supabase migration list
supabase db push
```

或者手动在 SQL Editor 依次执行：
1. `004_managed_otp_delivery_mode.sql`
2. `005_wallet_only_default.sql`

验证：

```text
- mailbox_accounts 表有 provider / delivery_mode / customer_can_login / otp_managed_by_operator 列
- delivery_mode 默认值是 'wallet_only'
- password_enc 允许为 null
- get_handover_by_code RPC 已更新（wallet_only 模式下不返回邮箱/密码）
```

### A2. 验证 RLS / RPC

用 Supabase anon key（模拟未登录客户）测试：

```text
1. 直接 select mailbox_accounts → 被拒（RLS 拦截）
2. 直接 select orders → 被拒
3. 直接 select handover_codes → 被拒
4. 调用 get_handover_by_code('有效code') → 返回一条记录
5. wallet_only 模式下返回的 mailbox_email = null
6. wallet_only 模式下返回的 mailbox_password = null
7. wallet_only 模式下返回的 mailbox_login_url = null
```

### A3. GitHub Pages 部署确认

在 GitHub repository variables 中配置：

```text
VITE_SUPABASE_URL = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJxxx
```

确认 GitHub Actions 跑完后，逐一打开：

```text
/#/              → 首页正常
/#/guide         → Wallet 指南正常
/#/rules         → 规则页正常
/#/admin/login   → 能登录/注册 operator
/#/admin/orders  → 能读写订单
/#/admin/mailboxes → 能管理邮箱记录
```

### A4. 创建 wallet_only 测试订单

在 admin 后台：

```text
mailbox account:
  email_address = test-wallet@example.com
  provider = manual
  delivery_mode = wallet_only（默认）
  customer_can_login = false
  otp_managed_by_operator = true
  password_enc = null
```

创建 order：

```text
customer_label = 自测-wallet
passenger_name = 测试乘车人
start_date = 当前日期
service_fee = 0
mailbox_account_id = 选择上面创建的记录
```

生成 handover code，打开 `/#/h/CODE`。

### A5. wallet_only 客户页面验收

期望看到：

```text
✓ 标题："您的 D-Ticket Wallet 交付"
✓ 步骤：确认实名信息 → 添加 Wallet → 乘车前打开二维码 → 验票时出示证件
✓ Wallet 添加按钮（如果 instructions 中有链接）
✓ "请优先添加到 Apple Wallet 或 Google Wallet" 提示
✓ 重要提醒：不提供登录邮箱、密码或 OTP
✓ 独立服务声明
```

期望**不看到**：

```text
✗ TicketPlus+ 登录邮箱
✗ 邮箱密码
✗ "打开邮箱收验证码" 按钮
✗ webmail 链接
```

---

## Phase B：managed_otp 例外模式验证

> **仅在 Phase A 通过后进行。**
> 适用于 operator 确认无自有支付方式风险、需要客户自行登录 TicketPlus+ 的场景。

### B1. 配置收信方案

二选一：

**方案 A：Cloudflare Email Routing**（推荐，需要 buffjo.top DNS 在 Cloudflare）

```text
1. 把 buffjo.top 接入 Cloudflare DNS
2. 开启 Email Routing
3. 验证 destination inbox
4. 创建 dt-test-001@tickets.buffjo.top → 转发到主邮箱
5. 测试普通邮件收发
6. 测试 TicketPlus+ OTP 收信
```

**方案 B：manual inbox**（快速验证）

```text
直接用你控制的 Gmail / Outlook 邮箱注册 TicketPlus+
不需要 Cloudflare 配置
```

### B2. 创建 managed_otp 测试订单

```text
mailbox account:
  email_address = dt-test-001@tickets.buffjo.top（或你的测试邮箱）
  provider = cloudflare_routing（或 manual）
  delivery_mode = managed_otp
  customer_can_login = false
  otp_managed_by_operator = true
  password_enc = null
```

### B3. managed_otp 客户页面验收

打开 `/#/h/CODE`，期望看到：

```text
✓ 标题："您的 D-Ticket 例外交付信息"
✓ 步骤：复制登录邮箱 → 联系客服取验证码 → 登录 TicketPlus+ → 查看车票
✓ TicketPlus+ 登录邮箱（可复制）
✓ "验证码获取方式：请联系客服获取"
✓ 重要提醒：不要修改账号邮箱/密码/支付方式
✓ 独立服务声明
```

期望**不看到**：

```text
✗ 邮箱密码
✗ webmail 按钮
```

### B4. TicketPlus+ OTP 收信测试

```text
1. 用 dt-test-001@tickets.buffjo.top 在 TicketPlus+ 请求 OTP
2. 到 destination inbox 找邮件
3. 记录延迟时间、是否进垃圾箱
```

结果记录到 `docs/ops/managed-otp-test-results.md`。

---

## Go / No-Go 标准

### Phase A（wallet_only 默认流程）— 必须通过

```text
[ ] migration 004 + 005 已应用到 Supabase
[ ] RLS 阻止 anon 直接访问所有表
[ ] get_handover_by_code 在 wallet_only 下不返回邮箱/密码/OTP
[ ] admin 能创建 wallet_only mailbox account
[ ] admin 能创建订单并生成 handover code
[ ] handover page 显示 Wallet 添加指引
[ ] handover page 不显示邮箱密码/webmail/OTP 信息
[ ] GitHub Pages 部署正常，所有路由可访问
[ ] 客户页面中文提示清楚
```

### Phase B（managed_otp 例外模式）— 可选

```text
[ ] 收信方案已配置（Cloudflare 或 manual inbox）
[ ] admin 能创建 managed_otp mailbox account
[ ] handover page 显示登录邮箱 + "联系客服取验证码"
[ ] handover page 不显示邮箱密码
[ ] dt-test-001@tickets.buffjo.top 能收到普通邮件
[ ] dt-test-001@tickets.buffjo.top 能收到 TicketPlus+ OTP
[ ] OTP 延迟可接受
```

**Phase A 通过即可开始小规模试单（wallet_only 模式）。**
**Phase B 通过后才能启用 managed_otp 例外模式。**

---

## 不要做

```text
- Email Worker 自动解析验证码
- 自动发微信
- 自动购票
- 更多平台适配
- 新 UI 大改
- FastAPI 后端
- mailcow 集成
```

等 wallet_only 流程跑通、managed_otp 收信稳定后，再考虑自动化。

---

## 参考

- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/)
- [Cloudflare Email Routing Addresses](https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/)
