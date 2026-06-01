# Acceptance Test Results

> Record Phase A (wallet_only) and Phase B (managed_otp) verification results here.

## Phase A：wallet_only 默认流程

### A1. Supabase 迁移

| 迁移 | 状态 | 日期 | 备注 |
|---|---|---|---|
| 004_managed_otp_delivery_mode.sql | pending | | |
| 005_wallet_only_default.sql | pending | | |

### A2. RLS / RPC 验证

| 测试 | 期望 | 结果 | 备注 |
|---|---|---|---|
| anon 不能 select mailbox_accounts | 被拒 | | |
| anon 不能 select orders | 被拒 | | |
| anon 不能 select handover_codes | 被拒 | | |
| get_handover_by_code 返回单条记录 | 通过 | | |
| wallet_only 下 mailbox_email = null | 通过 | | |
| wallet_only 下 mailbox_password = null | 通过 | | |
| wallet_only 下 mailbox_login_url = null | 通过 | | |

### A3. GitHub Pages 部署

| 路由 | 状态 | 备注 |
|---|---|---|
| /#/ | | |
| /#/guide | | |
| /#/rules | | |
| /#/admin/login | | |
| /#/admin/orders | | |
| /#/admin/mailboxes | | |

GitHub Actions 环境变量：

```text
VITE_SUPABASE_URL = (configured: yes/no)
VITE_SUPABASE_ANON_KEY = (configured: yes/no)
```

### A4-A5. wallet_only 订单 + 客户页面

```text
测试订单 ID:
Handover code:
客户页面 URL:
```

| 验收项 | 期望 | 结果 |
|---|---|---|
| 标题 "您的 D-Ticket Wallet 交付" | 显示 | |
| Wallet 添加按钮 | 显示（如有链接） | |
| "请优先添加到 Wallet" 提示 | 显示 | |
| 独立服务声明 | 显示 | |
| 不显示登录邮箱 | 隐藏 | |
| 不显示邮箱密码 | 隐藏 | |
| 不显示 webmail 按钮 | 隐藏 | |
| 中文提示清楚 | 通过 | |

---

## Phase B：managed_otp 例外模式

### B1. 收信方案

```text
方案选择: Cloudflare Email Routing / manual inbox
测试邮箱: dt-test-001@tickets.buffjo.top
Destination: (your inbox)
```

### B2-B3. managed_otp 订单 + 客户页面

```text
测试订单 ID:
Handover code:
```

| 验收项 | 期望 | 结果 |
|---|---|---|
| 标题 "例外交付信息" | 显示 | |
| 登录邮箱可复制 | 显示 | |
| "联系客服获取验证码" | 显示 | |
| 不显示邮箱密码 | 隐藏 | |
| 不显示 webmail 按钮 | 隐藏 | |

### B4. OTP 收信测试

| 测试 | 地址 | 结果 | 延迟 | 进垃圾箱? | 备注 |
|---|---|---|---|---|---|
| 普通邮件 | dt-test-001@tickets.buffjo.top | | | | |
| TicketPlus+ OTP | dt-test-001@tickets.buffjo.top | | | | |

---

## Go / No-Go 决定

```text
Phase A (wallet_only):  PASS / FAIL
Phase B (managed_otp):  PASS / FAIL / SKIP
Blocking issue:
Next action:
Date:
```
