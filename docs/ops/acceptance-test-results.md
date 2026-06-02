# Acceptance Test Results

> Phase A (wallet_only) and Phase B (managed_otp) verification results.

## Phase A：wallet_only 默认流程

### A1. Supabase 迁移

| 迁移 | 状态 | 日期 | 备注 |
|---|---|---|---|
| schema.sql + policies.sql | PASS | 2026-06-02 | 包含 004+005 全部内容，通过 Supabase SQL Editor 执行 |

### A2. RLS / RPC 验证

| 测试 | 期望 | 结果 | 备注 |
|---|---|---|---|
| anon 不能 select mailbox_accounts | 返回空 | PASS | status 200, data = [] |
| anon 不能 select orders | 返回空 | PASS | status 200, data = [] |
| anon 不能 select handover_codes | 返回空 | PASS | status 200, data = [] |
| get_handover_by_code 返回单条记录 | 通过 | PASS | code=csmug7me |
| wallet_only 下 mailbox_email = null | null | PASS | |
| wallet_only 下 mailbox_password = null | null | PASS | |
| wallet_only 下 mailbox_login_url = null | null | PASS | |
| managed_otp 下 mailbox_email 显示 | 显示 | PASS | test-otp@tickets.buffjo.top |
| managed_otp 下 mailbox_password = null | null | PASS | |
| 无效 code 返回 null | null | PASS | |

### A3. GitHub Pages 部署

| 路由 | 状态 | 备注 |
|---|---|---|
| /#/ | PASS | 首页正常 |
| /#/h/csmug7me | PASS | wallet_only handover 页面 |
| /#/h/6qdtanux | PASS | managed_otp handover 页面 |

GitHub Actions 环境变量：

```text
VITE_SUPABASE_URL = https://zmqjcwxrkvbtmtcfucwo.supabase.co ✅
VITE_SUPABASE_ANON_KEY = (configured) ✅
```

部署 URL: `https://wenhuorongbing-netizen.github.io/dt-mail-portal/`

### A4-A5. wallet_only 订单 + 客户页面

```text
Supabase 项目: SpirePlus (zmqjcwxrkvbtmtcfucwo)
测试邮箱: test-wallet@tickets.buffjo.top
Handover code: csmug7me
客户页面 URL: https://wenhuorongbing-netizen.github.io/dt-mail-portal/#/h/csmug7me
```

| 验收项 | 期望 | 结果 |
|---|---|---|
| 标题 "您的 D-Ticket Wallet 交付" | 显示 | PASS |
| Wallet 添加按钮 | 显示（有链接时） | PASS（fallback 提示正确） |
| "请优先添加到 Wallet" 提示 | 显示 | PASS |
| 独立服务声明 | 显示 | PASS |
| 不显示登录邮箱 | 隐藏 | PASS |
| 不显示邮箱密码 | 隐藏 | PASS |
| 不显示 webmail 按钮 | 隐藏 | PASS |
| 中文提示清楚 | 通过 | PASS |

---

## Phase B：managed_otp 例外模式

### B2-B3. managed_otp 订单 + 客户页面

```text
测试邮箱: test-otp@tickets.buffjo.top
Handover code: 6qdtanux
客户页面 URL: https://wenhuorongbing-netizen.github.io/dt-mail-portal/#/h/6qdtanux
```

| 验收项 | 期望 | 结果 |
|---|---|---|
| 标题 "例外交付信息" | 显示 | PASS |
| 登录邮箱可复制 | 显示 | PASS |
| "联系客服获取验证码" | 显示 | PASS |
| 不显示邮箱密码 | 隐藏 | PASS |
| 不显示 webmail 按钮 | 隐藏 | PASS |

### B4. OTP 收信测试

待配置 Cloudflare Email Routing 或 manual inbox 后测试。

---

## Go / No-Go 决定

```text
Phase A (wallet_only):  PASS
Phase B (managed_otp):  PASS (页面验证) / PENDING (OTP 收信)
Blocking issue: 无
Next action: 配置收信方案后测试 OTP 收信
Date: 2026-06-02
```

**Phase A 全部通过，可以开始小规模试单（wallet_only 模式）。**
