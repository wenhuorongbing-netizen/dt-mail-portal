可以。现在应该把开发目标从“做一个网页/后台”升级成：

> **每个月跑一轮高强度 overnight dev sprint，让系统越来越接近“客户只拿 Wallet，运营者最快交付，后台自动记录所有风险和历史”的专业票务交付工作台。**

当前项目状态已经适合进入这种月度开发循环：主线已切到 **GitHub Pages + Supabase**，默认交付是 **wallet_only**，客户默认不拿 TicketPlus+ 登录邮箱、OTP、邮箱密码或 webmail 权限。README 当前也明确写了客户默认不注册、不登录，不接收 TicketPlus+ 登录邮箱、OTP、邮箱密码或 webmail access。 `CURRENT.md` 也确认默认是 `wallet_only`，客户页面不得显示 webmail、邮箱密码、TicketPlus+ 登录邮箱或 OTP 指引。

你要的不是“小修小补”，而是一套 **Monthly Dev Spec / Overnight Run System**。下面这份可以直接保存成：

```text
docs/monthly-dev-spec.md
docs/overnight-runbook.md
docs/goal-month-2026-06.md
```

---

# Monthly Dev Spec：D-Ticket Wallet Ops System

## 0. 总目标

本月开发目标：

```text
把 dt-mail-portal 从“能用的 wallet-only 交付页 + admin 后台”
升级成“高效率、低风险、可审计、移动端优秀、几乎无需客户网页操作的 Wallet 交付运营系统”。
```

最终体验应该是：

```text
客户侧：
客户付款后，只收到一条清晰消息。
消息里有 Apple Wallet / Google Wallet 添加链接。
客户点链接 → 添加 Wallet → 乘车时打开 Wallet 二维码。
网页只是备用说明页，不是主要操作入口。

运营侧：
你打开后台，一单从创建到交付只需要 2–5 分钟。
系统自动算价、生成文案、生成交付包、记录风险、记录历史。
你不需要反复复制、改文案、想规则、查状态。
每一单都有时间线、证据、状态、风险等级、交付记录。
```

当前验收记录里，Phase A 的 wallet_only 页面已经通过：页面不显示登录邮箱、不显示邮箱密码、不显示 webmail 按钮，中文提示通过；Phase B 的 managed_otp 只是页面验证通过，OTP 收信仍 pending。  所以本月所有核心功能都应围绕 **wallet_only 默认交付**展开，managed_otp 只作为例外模式。

---

# 1. 产品原则

## 1.1 客户几乎不需要网页

客户最理想路径：

```text
微信/聊天中收到交付消息
↓
点 Apple Wallet / Google Wallet 官方链接
↓
添加成功
↓
乘车前打开 Wallet
↓
验票时出示身份证件
```

网页只承担三种备用用途：

```text
1. 客户找不到 Wallet 链接时，打开交付页查看链接；
2. 客户不知道怎么添加 Wallet 时，查看教程；
3. 客户发生问题时，把交付码发给客服排查。
```

因此，前端客户页不是“主流程”，而是：

```text
Wallet delivery fallback page
Support and instruction page
Receipt / handover proof page
```

## 1.2 不交付账号，不交付邮箱，不交付付款风险

默认模式：

```text
delivery_mode = wallet_only
```

客户不得看到：

```text
TicketPlus+ 登录邮箱
OTP
邮箱密码
webmail URL
付款方式
账号恢复信息
```

只有例外模式才允许 `managed_otp` 或 `external_mailbox`。当前 `wallet-only-delivery.md` 也已经定义：客户不接收 TicketPlus+ 登录邮箱、OTP、邮箱密码、webmail URL、付款方式细节或账号恢复信息。

## 1.3 后台必须让你少思考

后台必须减少这些消耗：

```text
少算价
少查日期
少复制字段
少写重复文案
少想客户下一步该怎么做
少担心忘记取消/付款/交付状态
少翻历史聊天找证据
```

你的系统应当逐步变成：

```text
订单控制台
风险控制台
交付文案生成器
历史审计器
Wallet 交付管理器
```

---

# 2. 本月开发范围

## 2.1 Feature Area A：Wallet Delivery Pack

目标：客户不需要打开网页也能完成操作。

### A1. Delivery Pack Generator

后台订单详情页增加按钮：

```text
生成 Wallet 交付包
```

输出三种文案：

```text
1. 极简交付文案
2. 详细交付文案
3. 售后/故障文案
```

极简版：

```text
您的 D-Ticket 已准备好。

请点击以下官方链接添加到 Wallet：
Apple Wallet: {apple_wallet_link}
Google Wallet: {google_wallet_link}

添加后，乘车前打开 Wallet 中的二维码。
验票时请同时出示本人证件。
本服务为独立购票协助服务，非官方售票方。
```

详细版：

```text
【D-Ticket Wallet 交付信息】

乘车人：{passenger_name}
车票月份：{ticket_month}

1. 请点击官方 Wallet 链接：
Apple Wallet：{apple_wallet_link}
Google Wallet：{google_wallet_link}

2. 如果在微信里打不开：
请复制链接到 Safari / Chrome 打开。

3. 添加成功后：
乘车前打开 Apple Wallet / Google Wallet 中的二维码。
验票时请携带本人护照/身份证件。

4. 注意：
不要只保存截图。
不要打印 PDF。
请确认姓名和证件一致。
```

售后版：

```text
如果 Wallet 链接打不开：
1. 复制链接到 Safari/Chrome；
2. 换网络后重试；
3. 截图发给客服；
4. 提供交付码：{handover_code}
```

### A2. Wallet Link Parser

订单详情里添加两个字段：

```text
apple_wallet_link
google_wallet_link
```

同时支持从 `instructions` 里自动提取 URL。当前前端已经有 `extractHttpLinks()`，会从 instructions 里提取链接并用于 wallet_only。

新增需求：

```text
自动识别 apple / google
自动显示链接健康状态
如果只有一个链接，明确提示“只检测到一个 Wallet 链接”
如果没有链接，客户页显示“请联系客服补发”
```

### A3. One-Tap Copy Buttons

订单详情页增加：

```text
复制极简交付包
复制详细交付包
复制售后排障包
复制客户交付链接
复制交付码
复制乘车人信息
```

### A4. Wallet Proof Checklist

交付前 checklist：

```text
[ ] 乘车人姓名已确认
[ ] 车票月份已确认
[ ] Wallet 链接来自官方邮件/App/网页
[ ] 没有发送自制 pkpass
[ ] 没有只发二维码截图
[ ] 已记录付款/订阅风险
[ ] 已生成交付码
[ ] 已发送客户交付包
```

---

## 2.2 Feature Area B：Operator Workflow Optimization

目标：你每单少点 20 次，少复制 10 次。

### B1. Order Command Center

后台 `/admin/orders` 重新组织为三栏：

```text
左栏：订单队列
中栏：当前订单详情
右栏：操作面板 / 交付包 / 风险 / 历史
```

状态分组：

```text
待付款
已付款待购票
已购票待 Wallet
已生成交付包
已交付待确认
异常
已关闭
```

### B2. Quick Action Bar

每个订单详情顶部固定一排按钮：

```text
标记已付款
标记已购票
粘贴 Wallet 链接
生成交付包
复制交付文案
标记已交付
关闭订单
标记异常
```

### B3. Batch Work Mode

增加“批量处理模式”：

```text
勾选多个订单
批量生成交付包
批量标记状态
批量复制客户摘要
批量导出 CSV
```

### B4. Today Work Queue

新增 dashboard：

```text
今日待处理
今日已交付
异常订单
10号规则风险
待补 Wallet 链接
未关闭订单
```

### B5. Order Timer

每个订单记录：

```text
created_at
paid_at
ticket_purchased_at
handover_created_at
delivered_at
closed_at
```

自动计算：

```text
付款到交付耗时
创建到关闭耗时
平均每单耗时
本月处理效率
```

---

## 2.3 Feature Area C：历史记录与审计

目标：每单能追溯，不靠记忆。

### C1. Order Timeline

每个订单增加时间线：

```text
2026-06-02 13:00 创建订单
2026-06-02 13:05 标记已付款
2026-06-02 13:10 录入 Wallet 链接
2026-06-02 13:12 生成交付码
2026-06-02 13:13 复制交付文案
2026-06-02 13:15 标记已交付
```

事件类型：

```text
order.created
payment.marked_paid
ticket.marked_purchased
wallet.link_added
handover.created
handover.viewed
handover.copied
status.changed
risk.updated
note.added
```

### C2. Immutable Audit Events

已有 `audit_events` 表。需要让前端真正写入：

```text
每次状态变化写 audit_events
每次生成 handover code 写 audit_events
每次复制交付包写 audit_events
每次修改 passenger info 写 audit_events
```

### C3. Notes and Evidence

订单详情增加：

```text
内部备注
客户备注
风险备注
交付备注
证据链接
截图文件名/外部链接
```

因为 GitHub Pages + Supabase 免费架构不一定立刻做文件上传，可以先只保存：

```text
evidence_url
evidence_note
screenshot_filename
```

后续再接 Supabase Storage。

### C4. Handover View History

记录：

```text
handover viewed_at
view_count
last_viewed_at
```

现在 RPC 已经会在首次访问时把 handover 标记为 viewed。 后续应扩展为多次访问计数。

---

## 2.4 Feature Area D：HCI / UI / 美术系统

目标：看起来不像临时工具，而像专业交付中心。

### D1. Visual Direction

统一为：

```text
Transit Operations Desk
深墨蓝 / 象牙白 / 琥珀高亮 / 电蓝辅助
细边框
卡片式信息层级
移动端大按钮
清晰中文
```

### D2. Customer Page Redesign

客户页首屏只保留最重要动作：

```text
标题：您的 D-Ticket Wallet 交付
主按钮：添加到 Apple Wallet
主按钮：添加到 Google Wallet
次按钮：查看教程
次按钮：联系客服
```

次屏才显示：

```text
车票月份
乘车前检查
独立服务声明
常见问题
交付码
```

### D3. Admin UI Redesign

后台 UI 目标：

```text
密度高但不乱
复制按钮明显
状态颜色一致
风险标记醒目
操作路径短
```

状态颜色建议：

```text
requested：灰
paid：蓝
ticket_purchased：紫
handover_created：琥珀
delivered：绿
closed：深灰
exception：红
```

### D4. Microinteractions

增加：

```text
复制成功 toast
状态切换动画
保存成功微提示
Wallet 链接检测 loading
风险标签 pulse
移动端按钮 pressed 状态
```

### D5. Empty / Error States

不要出现空白表格。

空状态示例：

```text
今天还没有待处理订单。
点击“新建订单”开始第一单。
```

错误状态示例：

```text
无法加载订单。
请检查 Supabase 连接或重新登录。
```

### D6. Print / Screenshot Friendly

客户页需要适合截图转发：

```text
关键信息集中在一屏
标题明确
按钮大
交付码可见
声明简短
```

---

## 2.5 Feature Area E：可用性与可访问性

目标：客户和你都能少犯错。

### E1. Mobile First QA

必须测试：

```text
iPhone Safari 390px
Android Chrome 393px
微信内置浏览器
Edge desktop
```

### E2. Accessibility Requirements

所有按钮必须：

```text
可键盘 focus
focus ring 清楚
aria-label 完整
复制按钮有文本反馈
颜色对比度足够
表单 label 正确
错误提示不只靠颜色
```

### E3. Reduced Motion

实现：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none;
    transition: none;
  }
}
```

### E4. Error Prevention

表单防错：

```text
姓名为空不能购票状态推进
车票月份为空不能生成交付包
wallet_only 没有 Wallet 链接时显示强警告
managed_otp 时提示“例外模式，不推荐”
customer_can_login=true 时强提示支付风险
```

### E5. Language Simplification

客户页全部中文优先，英文辅助。客户不需要理解：

```text
RPC
handover
delivery_mode
wallet_only
operator
```

客户看到的是：

```text
交付码
Wallet 链接
乘车前检查
联系客服
规则说明
```

---

## 2.6 Feature Area F：风险控制与业务规则

### F1. Payment Risk Panel

每单增加风险字段：

```text
payment_owner: operator / customer / unknown
operator_payment_method_attached: yes / no / unknown
subscription_cancelled: yes / no / not_needed / unknown
renewal_risk: none / low / medium / high
customer_has_account_access: yes / no
```

### F2. Risk Gate

这些情况下禁止生成 customer-login 交付：

```text
operator_payment_method_attached = yes
customer_has_account_access = yes
delivery_mode != wallet_only
```

必须显示：

```text
高风险：客户可能重新订阅或触发付款。
请改用 wallet_only。
```

### F3. Mode Decision Assistant

后台新增“交付模式推荐”：

```text
如果有 Wallet 链接 → 推荐 wallet_only
如果客户必须登录账号但付款方式已清理 → managed_otp 可用
如果客户拥有自己的邮箱/付款方式 → external_mailbox/customer_mailbox 可用
否则禁止交付账号
```

### F4. 10号规则自动提示

订单 start_date 变化时自动提示：

```text
1–10号：通常 1 个月
10号之后：通常 2 个月
```

并生成客户确认文案。

---

# 3. 本月 Overnight Run 结构

每晚跑一个 overnight sprint。每晚都要遵守：

```text
不做 TicketPlus+ 自动注册
不做自动付款
不绕过 OTP
不做自制 Wallet pass
不把 service_role 放前端
默认 wallet_only
```

当前 README 也已经规定不自动化 CAPTCHA、OTP bypass、第三方账号创建、支付或购票。

---

# 4. 30-Night Development Calendar

## Week 1：基础体验与交付效率

### Night 1：Wallet Delivery Pack

目标：

```text
后台订单详情增加 Wallet 交付包生成器。
```

交付物：

```text
apple_wallet_link / google_wallet_link 字段
Wallet 链接提取
复制极简文案
复制详细文案
复制售后文案
```

验收：

```text
wallet_only 订单不显示邮箱/OTP/密码
复制文案可直接发微信
build/test 通过
```

---

### Night 2：Customer Page Minimal Mode

目标：

```text
客户页面变成极简 Wallet 操作页。
```

交付物：

```text
首屏只显示 Wallet 添加按钮
教程折叠到下方
交付码小字显示
客服按钮
```

验收：

```text
390px 不溢出
无 Wallet 链接时 fallback 清晰
截图好看
```

---

### Night 3：Order Command Center v1

目标：

```text
订单详情从表格体验升级为操作台体验。
```

交付物：

```text
订单列表 + 详情面板
状态按钮固定
当前订单摘要
复制按钮组
```

---

### Night 4：Status Timeline

目标：

```text
每个订单有历史时间线。
```

交付物：

```text
audit_events 写入
timeline UI
状态变化自动记录
```

---

### Night 5：Risk Panel v1

目标：

```text
加入支付/订阅风险管理。
```

字段：

```text
payment_owner
payment_method_attached
subscription_cancelled
renewal_risk
customer_has_account_access
```

---

### Night 6：Copy UX Polish

目标：

```text
所有复制行为变快、清楚、可追踪。
```

交付物：

```text
复制 toast
复制状态
复制事件写 audit
一键复制所有客户信息
```

---

### Night 7：Week 1 Hardening

目标：

```text
修 bug、补测试、整理文档。
```

必须通过：

```text
npm run deploy:check
RLS contract tests
customer page mobile screenshot review
```

---

## Week 2：可用性、HCI、美术与客户体验

### Night 8：Design Token System

目标：

```text
统一颜色、间距、字体、状态色。
```

交付物：

```text
tokens.css
status color map
button variants
card variants
```

---

### Night 9：Customer Visual Redesign

目标：

```text
客户页更像专业交付页。
```

交付物：

```text
Hero redesign
Wallet action cards
Pre-ride checklist
Independent service notice
```

---

### Night 10：Admin Visual Redesign

目标：

```text
后台更像运营 cockpit。
```

交付物：

```text
Dashboard cards
Queue columns
Compact tables
Sticky action bar
```

---

### Night 11：Accessibility Pass

目标：

```text
键盘、焦点、aria、对比度。
```

验收：

```text
Tab 顺序合理
所有按钮 aria-label
错误提示文本化
prefers-reduced-motion
```

---

### Night 12：Mobile WeChat UX

目标：

```text
微信里打开也好用。
```

交付物：

```text
复制链接提示
“微信打不开请复制到 Safari/Chrome”
大按钮
短文案
```

---

### Night 13：Error/Empty States

目标：

```text
所有页面都有专业空状态和错误状态。
```

---

### Night 14：Week 2 Design Review

目标：

```text
截图检查 + mobile QA + 修 polish。
```

---

## Week 3：工作流自动化与历史记录

### Night 15：Work Queue Dashboard

目标：

```text
一打开后台就知道今天要做什么。
```

卡片：

```text
待付款
已付款待购票
待 Wallet
待交付
异常
本月已交付
```

---

### Night 16：Order Timer Metrics

目标：

```text
自动统计每单耗时。
```

指标：

```text
付款到交付耗时
平均处理时长
本月处理数量
异常率
```

---

### Night 17：Evidence & Notes

目标：

```text
订单可存证据和备注。
```

字段：

```text
operator_note
customer_note
risk_note
evidence_url
```

---

### Night 18：Template Library

目标：

```text
所有文案模板可编辑。
```

模板：

```text
付款前确认
Wallet 交付
售后排障
10号规则
异常说明
```

---

### Night 19：Provider Profiles

目标：

```text
不同平台规则抽象。
```

先只做配置，不做自动化：

```text
ticketplus
db
mopla
rmv
manual
```

字段：

```text
supports_wallet
supports_import
payment_risk_level
handover_recommended_mode
notes
```

---

### Night 20：Search & Filter

目标：

```text
订单查找变快。
```

功能：

```text
按客户名
按月份
按状态
按风险
按交付码
按邮箱
```

---

### Night 21：Week 3 Data Review

目标：

```text
检查所有历史记录、状态、审计完整性。
```

---

## Week 4：上线质量、批量效率、运营闭环

### Night 22：Batch Mode

目标：

```text
批量处理订单。
```

功能：

```text
批量复制
批量状态变更
批量导出
批量生成交付包
```

---

### Night 23：Launch Checklist Automation

目标：

```text
系统自动告诉你一单是否可以交付。
```

Checklist：

```text
乘车人姓名
车票月份
Wallet 链接
风险状态
交付码
文案已生成
```

---

### Night 24：Security Hardening

目标：

```text
operator 登录安全补强。
```

任务：

```text
关闭自动注册或加 allowlist
admin route 加更强提示
RLS contract test
bundle secret scan 扩展
```

目前自动 operator sign-up 是风险点：代码会先尝试登录，登录失败后调用 `signUp()` 自注册 operator。 这一晚必须处理。

---

### Night 25：Supabase Storage / Attachment Plan

目标：

```text
为证据截图做规划或初版。
```

可以先只做：

```text
evidence_url
```

不一定直接上 Storage。

---

### Night 26：Analytics Export

目标：

```text
导出月度运营数据。
```

导出：

```text
CSV
订单数
收入
服务费
平均耗时
异常订单
交付模式比例
```

---

### Night 27：Customer FAQ Generator

目标：

```text
客户常见问题自动生成短回复。
```

问题：

```text
Wallet 打不开
票没显示
二维码在哪里
能不能截图
姓名错了怎么办
10号后为什么两个月
```

---

### Night 28：End-to-End QA

目标：

```text
模拟 20 单，找流程卡点。
```

模拟类型：

```text
正常 wallet_only
无 Wallet 链接
客户问规则
异常订单
退款争议
10号后订单
```

---

### Night 29：Docs Freeze

目标：

```text
所有文档和代码一致。
```

检查：

```text
README
CURRENT
wallet-only workflow
managed-otp workflow
deployment-status
acceptance results
```

---

### Night 30：Monthly Release

目标：

```text
打月度 release。
```

产物：

```text
CHANGELOG
release notes
known issues
next month backlog
screenshots
deployment check
```

---

# 5. Overnight Run Master Prompt

每晚丢给 agent 的总 prompt：

```text
Read AGENTS.md, docs/CURRENT.md, README.md, docs/ops/wallet-only-delivery.md, docs/ops/acceptance-test-results.md, and the current monthly goal file.

You are working on the dt-mail-portal Phase 1 system.

Current source of truth:
- GitHub Pages + Supabase only.
- Default delivery mode is wallet_only.
- Customers must not receive TicketPlus+ login email, OTP, mailbox password, webmail URL, or account access by default.
- managed_otp, external_mailbox, and customer_mailbox are exception modes only.
- Do not automate TicketPlus+ registration, login, CAPTCHA, OTP bypass, payment, or ticket purchase.
- Do not create custom Apple Wallet .pkpass files or custom Google Wallet passes.
- Use only official issuer Wallet links when present.
- No service_role key in frontend.

Tonight's target:
<INSERT NIGHT OBJECTIVE>

Implementation rules:
1. Keep customer UX Chinese-first.
2. Customer pages must be mobile-first and WeChat-friendly.
3. Operator workflow must reduce clicks and copy/paste workload.
4. Every new risk-sensitive action must have a visible warning.
5. Every status-changing action should write an audit event if possible.
6. Add or update tests where practical.
7. Do not break existing wallet_only behavior.
8. Do not expose mailbox_password unless customer_can_login = true and delivery_mode is an approved exception mode.

Acceptance:
- npm run deploy:check passes.
- npm run build passes.
- frontend/dist contains no service_role or sb_secret.
- Existing wallet_only test handover still hides email/password/webmail.
- New feature is documented.
- Add a short summary to docs/ops/monthly-dev-log.md.
```

---

# 6. Specialized Agent Prompts

## 6.1 UX / HCI Agent

```text
You are the UX/HCI agent for a Chinese-first mobile wallet delivery system.

Optimize the customer flow so the customer barely needs the webpage:
- First priority is official Apple Wallet / Google Wallet link.
- Webpage is only fallback, tutorial, and support.
- Reduce text on first screen.
- Make the primary action obvious within 3 seconds.
- Use clear Chinese microcopy.
- Add WeChat-specific fallback instructions.
- Ensure 390px viewport works.
- Ensure all interactive elements have 44px touch target.
- Ensure focus states and aria labels.

Do not expose TicketPlus+ login email, OTP, mailbox password, or webmail URL in wallet_only.
```

## 6.2 Operator Workflow Agent

```text
You are the operator productivity agent.

Goal:
Reduce one order from 10–15 minutes to 2–5 minutes.

Optimize:
- Order creation
- Price calculation
- Wallet link entry
- Handover package generation
- Copy buttons
- Status transitions
- Audit history
- Risk flags

Add quick actions and reduce repeated typing.
Every important operator action should be one click or one copy button.
```

## 6.3 Visual Design Agent

```text
You are the visual design agent.

Aesthetic:
Professional transit operations desk.
Not generic SaaS.
Not purple-gradient AI template.

Use:
- Deep navy / ink
- Ivory / stone background
- Amber action highlights
- Electric blue secondary accents
- Dense admin panels
- Calm customer pages
- Clear hierarchy
- Subtle motion
- Screenshot-friendly customer layout

Do not sacrifice usability for decoration.
```

## 6.4 QA / Security Agent

```text
You are the QA/security agent.

Verify:
- wallet_only never exposes mailbox_email, mailbox_password, login_url, username, OTP instructions.
- managed_otp exposes only login email, never password.
- external_mailbox shows password only when customer_can_login = true.
- RLS blocks anon direct table access.
- service_role does not appear in source, env example, GitHub workflow, or dist.
- admin routes require Supabase Auth.
- operator signup behavior is documented and safe.

Run:
npm run deploy:check
npm run build
bundle secret scan
manual route review
```

---

# 7. Feature Backlog by Priority

## P0：必须做

```text
1. Operator signup hardening / allowlist
2. Wallet Delivery Pack Generator
3. Order Timeline / audit events
4. Payment Risk Panel
5. Customer page minimal Wallet mode
6. deployment-status 文档更新
7. docs/goal.md 旧审查归档
```

## P1：强烈建议

```text
1. Work Queue Dashboard
2. Copy template library
3. Batch mode
4. Mobile WeChat polish
5. Accessibility pass
6. Evidence notes
7. Export CSV
```

## P2：增强项

```text
1. Provider profiles
2. Supabase Storage attachments
3. Analytics charts
4. FAQ generator
5. Multi-operator roles
6. Monthly reports
```

---

# 8. Database Additions Spec

建议新增或扩展这些表/字段。

## orders additions

```sql
alter table public.orders
add column if not exists paid_at timestamptz,
add column if not exists ticket_purchased_at timestamptz,
add column if not exists handover_created_at timestamptz,
add column if not exists delivered_at timestamptz,
add column if not exists closed_at timestamptz,
add column if not exists apple_wallet_link text,
add column if not exists google_wallet_link text,
add column if not exists payment_owner text default 'unknown',
add column if not exists operator_payment_method_attached boolean default false,
add column if not exists subscription_cancelled text default 'unknown',
add column if not exists renewal_risk text default 'unknown',
add column if not exists customer_has_account_access boolean default false,
add column if not exists operator_note text default '',
add column if not exists risk_note text default '',
add column if not exists evidence_url text;
```

## audit_events required details

```json
{
  "from_status": "paid",
  "to_status": "ticket_purchased",
  "wallet_links_present": true,
  "risk_level": "low",
  "copied_template": "wallet_delivery_short"
}
```

---

# 9. UI Screens to Build

## Customer

```text
/#/                       Landing
/#/h/:code                Wallet handover
/#/guide                  Wallet guide
/#/rules                  Rules
/#/support                Support fallback
```

## Admin

```text
/#/admin/dashboard        Work queue
/#/admin/orders           Order command center
/#/admin/orders/:id       Deep order detail
/#/admin/mailboxes        Controlled emails / provider records
/#/admin/templates        Copy templates
/#/admin/history          Audit events
/#/admin/reports          Monthly metrics
/#/admin/settings         Risk rules / provider profiles
```

---

# 10. Acceptance Matrix

| Area             | Required Result                                         |
| ---------------- | ------------------------------------------------------- |
| Customer default | wallet_only hides email/password/webmail/OTP            |
| Customer action  | customer can add Wallet from first screen               |
| Web optionality  | customer can complete via chat message without page     |
| Admin speed      | create → wallet → delivery package in under 2–5 minutes |
| Copy UX          | all customer messages one-click copy                    |
| Risk             | account/payment risk visible before handover            |
| History          | status changes logged                                   |
| Accessibility    | mobile, keyboard, contrast, labels pass                 |
| Deployment       | `npm run deploy:check` passes                           |
| Security         | no service_role in frontend/dist                        |
| Docs             | CURRENT, README, workflow docs aligned                  |

---

# 11. Monthly Definition of Done

本月结束时必须达到：

```text
1. 默认 wallet_only 流程完整可跑；
2. 客户无需网页也能从聊天消息添加 Wallet；
3. 网页只是备用交付页和教程；
4. 后台能生成三种交付文案；
5. 后台能记录 Wallet 链接、风险、历史；
6. 每个订单有 timeline；
7. 运营首页能看到当天待办；
8. 所有客户页 390px 手机可用；
9. 所有复制动作有反馈；
10. 没有客户默认看到邮箱/密码/OTP；
11. operator 注册已硬化；
12. 所有文档与代码一致；
13. deploy:check 通过；
14. 真实 wallet_only 票测试记录完成。
```

---

# 12. 第二天早上复审流程

每次 overnight run 结束后，第二天只做复审，不继续猛加功能。

复审清单：

```text
1. 看 git diff
2. 看新增/修改文件是否符合 CURRENT
3. npm run deploy:check
4. 打开 /#/h/<wallet_test_code>
5. 确认不显示邮箱/密码/webmail
6. 打开 /#/admin/orders
7. 新建一单模拟订单
8. 粘贴 Wallet 链接
9. 生成交付包
10. 复制文案到空白文本检查
11. 检查 audit_events
12. 检查 docs 是否更新
13. 记录结果到 monthly-dev-log
```

格式：

```md
# Monthly Dev Log

## Night 01 — Wallet Delivery Pack

Date:
Commit:
Goal:
Completed:
Failed:
Screenshots:
Risk:
Next:
Go/No-Go:
```

---

# 13. 当前最推荐的第一晚任务

第一晚不要做大而全，先做最能提高你赚钱效率的：

```text
Night 1：Wallet Delivery Pack Generator + Order Detail Quick Actions
```

因为它直接解决：

```text
客户几乎不需要网页
你一键复制交付信息
Wallet 链接成为主交付对象
后台从“订单表”变成“交付工具”
```

第一晚 prompt：

```text
Read AGENTS.md, docs/CURRENT.md, docs/ops/wallet-only-delivery.md, docs/ops/acceptance-test-results.md.

Implement Night 1: Wallet Delivery Pack Generator.

Goal:
Make wallet_only delivery possible directly through chat, so the customer barely needs the web page.

Tasks:
1. Add apple_wallet_link and google_wallet_link support in order UI.
2. Allow operator to paste Wallet links into order detail.
3. Generate three copy templates:
   - short wallet delivery
   - detailed wallet delivery
   - troubleshooting wallet delivery
4. Add copy buttons for each template.
5. Add a pre-delivery checklist:
   - passenger name confirmed
   - ticket month confirmed
   - official Wallet links present
   - no custom pkpass/pass
   - no QR-only final delivery
   - payment/subscription risk reviewed
6. Keep wallet_only page hiding mailbox_email, mailbox_password, webmail URL, and OTP.
7. Write audit event when a delivery pack is generated or copied if audit helper exists; otherwise add TODO with clear type.
8. Update docs/ops/wallet-only-delivery.md and docs/ops/monthly-dev-log.md.

Acceptance:
- npm run deploy:check passes.
- Wallet-only customer page still hides account-login fields.
- Operator can generate a message that can be sent directly in WeChat.
- No service_role in frontend/dist.
```

---

# 14. 核心方向再确认

你说得对：**最终客户最好只拿 Wallet。**
系统不要把客户训练成“登录网页、登录邮箱、登录账号、拿 OTP”。那样会把风险带回来。

最终产品应该是：

```text
客户：
我收到一个 Wallet 链接。
我点了。
我添加成功。
我乘车出示二维码和证件。

你：
我在后台创建订单。
我记录 Wallet 链接。
我生成交付包。
我发送。
我关闭订单。
系统留下全部历史。
```

这就是本月开发的主线。
