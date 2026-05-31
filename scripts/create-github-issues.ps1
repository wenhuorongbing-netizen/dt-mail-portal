param(
  [string]$Repo = "wenhuorongbing-netizen/dt-mail-portal"
)

$issues = @(
  @{ Title = "初始化 monorepo 项目结构"; Labels = "mvp,docs"; Body = "Create backend, frontend, docs, VS Code workspace, and GitHub planning skeleton." },
  @{ Title = "客户门户首页移动端 UI"; Labels = "frontend,mobile,mvp"; Body = "Build the first customer-facing mobile portal home." },
  @{ Title = "TicketPlus+ 登录教程页面"; Labels = "frontend,mobile,docs"; Body = "Create customer tutorial content and screen." },
  @{ Title = "规则说明页面"; Labels = "frontend,legal,docs"; Body = "Create rules and account-use explanation page." },
  @{ Title = "后台订单列表"; Labels = "frontend,admin,mvp"; Body = "Build internal order list view." },
  @{ Title = "后台新建订单页面"; Labels = "frontend,admin,mvp"; Body = "Build internal new-order form." },
  @{ Title = "邮箱账号生成逻辑"; Labels = "backend,email,admin"; Body = "Design and implement mailbox generation workflow." },
  @{ Title = "客户交付文案生成"; Labels = "backend,admin,docs"; Body = "Generate customer handover text from order data." },
  @{ Title = "订单状态流转"; Labels = "backend,admin"; Body = "Persist and validate order status changes." },
  @{ Title = "mailcow API 调研与封装"; Labels = "backend,email,infra"; Body = "Research Mailcow API and wrap internal backend service." },
  @{ Title = "Roundcube 登录页配置"; Labels = "email,infra,frontend"; Body = "Document and configure Roundcube login path." },
  @{ Title = "腾讯云部署文档"; Labels = "infra,docs"; Body = "Prepare deployment guide for Tencent Cloud." },
  @{ Title = "DNS / DKIM / SPF / DMARC 配置"; Labels = "infra,email,security"; Body = "Document DNS and email authentication records." },
  @{ Title = "客户隐私说明"; Labels = "legal,security,docs"; Body = "Draft privacy and data handling explanation." },
  @{ Title = "上线前测试清单"; Labels = "docs,mvp,security"; Body = "Create launch readiness checklist." }
)

foreach ($issue in $issues) {
  gh issue create --repo $Repo --title $issue.Title --label $issue.Labels --body $issue.Body
}
