export const TICKET_PRICE_PER_MONTH = 63.0;

export type OrderStatus =
  | 'requested'
  | 'paid'
  | 'mailbox_assigned'
  | 'ticket_purchased'
  | 'handover_created'
  | 'delivered'
  | 'closed'
  | 'exception';

export type DeliveryMode = 'wallet_only' | 'managed_otp' | 'external_mailbox' | 'customer_mailbox';

export interface MailboxAccount {
  id: string;
  email_address: string;
  provider: string;
  delivery_mode: DeliveryMode;
  login_url: string | null;
  username: string | null;
  password_enc: string | null;
  customer_can_login: boolean;
  otp_managed_by_operator: boolean;
  domain: string;
  status: string;
}

export interface HandoverCode {
  id: string;
  order_id: string;
  code: string;
  instructions: string;
  status: string;
  viewed_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  operator_id: string;
  customer_label: string;
  customer_contact: string | null;
  passenger_name: string | null;
  passenger_birthdate: string | null;
  ticket_month: string | null;
  start_date: string | null;
  after_tenth_day: boolean;
  ticket_month_count: number;
  ticket_price_total: number;
  service_fee: number;
  total_amount: number;
  status: OrderStatus;
  mailbox_account_id: string | null;
  created_at: string;
  updated_at: string;
  mailbox_account?: MailboxAccount;
  handover_codes?: HandoverCode[];
}

export const STATUS_LABELS: Record<OrderStatus, { text: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = {
  requested: { text: 'Requested', tone: 'neutral' },
  paid: { text: 'Paid', tone: 'warning' },
  mailbox_assigned: { text: 'Mailbox Assigned', tone: 'warning' },
  ticket_purchased: { text: 'Ticket Purchased', tone: 'success' },
  handover_created: { text: 'Handover Created', tone: 'success' },
  delivered: { text: 'Delivered', tone: 'success' },
  closed: { text: 'Closed', tone: 'neutral' },
  exception: { text: 'Exception', tone: 'danger' },
};

export const STATUS_FLOW: OrderStatus[] = [
  'requested',
  'paid',
  'mailbox_assigned',
  'ticket_purchased',
  'handover_created',
  'delivered',
  'closed',
];

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  wallet_only: 'Wallet Only',
  managed_otp: 'Managed OTP Exception',
  external_mailbox: 'External Mailbox Exception',
  customer_mailbox: 'Customer Mailbox Exception',
};

export function getTicketMonth(startDate: string): string {
  const date = new Date(startDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function calculatePricing(startDate: string, serviceFee: number) {
  const date = new Date(startDate);
  const after10th = date.getDate() > 10;
  const monthCount = after10th ? 2 : 1;
  const ticketPrice = monthCount * TICKET_PRICE_PER_MONTH;

  return {
    after10th,
    monthCount,
    ticketPrice,
    total: ticketPrice + serviceFee,
  };
}

export function getMailboxUsername(mailbox: MailboxAccount): string {
  return mailbox.username || mailbox.email_address.split('@')[0] || mailbox.email_address;
}

export function isCustomerLoginMode(mode: DeliveryMode): boolean {
  return mode === 'external_mailbox' || mode === 'customer_mailbox';
}

export function customerCanLogin(mailbox: MailboxAccount): boolean {
  return isCustomerLoginMode(mailbox.delivery_mode) && Boolean(mailbox.customer_can_login && mailbox.password_enc);
}

export function buildHandoverText(
  order: Order,
  options: { origin?: string; webmailUrl?: string } = {},
): string {
  const mailbox = order.mailbox_account;
  if (!mailbox) return '';

  const origin = options.origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
  const guideUrl = `${origin}/#/guide`;
  const rulesUrl = `${origin}/#/rules`;
  const mode = mailbox.delivery_mode ?? 'wallet_only';
  const canLogin = customerCanLogin(mailbox);

  if (mode === 'wallet_only') {
    return [
      '=== D-Ticket Wallet-only Handover ===',
      '',
      '您好，您的 D-Ticket 已准备交付。',
      order.passenger_name ? `乘客姓名: ${order.passenger_name}` : '',
      order.ticket_month ? `车票月份: ${order.ticket_month}` : '',
      '',
      '--- Wallet Links ---',
      'Apple Wallet 官方添加链接: {{apple_wallet_link}}',
      'Google Wallet 官方添加链接: {{google_wallet_link}}',
      '',
      '--- Quick Start ---',
      '1. 请打开客服发送的官方 Apple Wallet / Google Wallet 添加链接。',
      '2. 如果微信内无法打开，请复制链接到 Safari 或 Chrome。',
      '3. 添加后，乘车前打开 Wallet 中的 D-Ticket 二维码。',
      '4. 验票时请同时出示护照或身份证件。',
      '',
      '--- Important ---',
      '- 默认交付不提供 TicketPlus+ 登录邮箱、邮箱密码或 OTP 验证码。',
      '- 请不要修改 TicketPlus+ 账号、订阅或支付方式。',
      '- 不要把二维码截图作为唯一交付方式，优先使用官方 Wallet。',
      '',
      '--- Links ---',
      `Wallet Guide: ${guideUrl}`,
      `Rules & Billing: ${rulesUrl}`,
      '',
      '--- Disclaimer ---',
      'This is an independent purchase-assistance service.',
      'We are NOT affiliated with TicketPlus+, Deutsche Bahn, BVG, Deutschlandticket, or any official transport provider.',
    ].filter(Boolean).join('\n');
  }

  const fullEmail = mailbox.email_address;

  if (mode === 'managed_otp' || !canLogin) {
    return [
      '=== D-Ticket Managed OTP Exception Handover ===',
      '',
      '此交付方式仅用于已完成支付方式和订阅风险确认的例外场景。',
      '',
      '--- TicketPlus+ Login ---',
      `TicketPlus+ 登录邮箱: ${fullEmail}`,
      '验证码获取方式: 请联系客服获取 TicketPlus+ 登录验证码。',
      '请不要尝试接管邮箱、修改 TicketPlus+ 账号邮箱/密码或更改支付方式。',
      '',
      '--- Quick Start ---',
      '1. 打开 TicketPlus+，选择 Email Login / 邮箱登录。',
      `2. 输入完整邮箱地址: ${fullEmail}`,
      '3. 联系客服获取验证码。',
      '4. 在 TicketPlus+ 中输入验证码后查看车票。',
      '',
      '--- Links ---',
      `Wallet Guide: ${guideUrl}`,
      `Rules & Billing: ${rulesUrl}`,
      '',
      '--- Disclaimer ---',
      'This is an independent purchase-assistance service.',
      'We are NOT affiliated with TicketPlus+, Deutsche Bahn, BVG, Deutschlandticket, or any official transport provider.',
    ].join('\n');
  }

  const localPart = getMailboxUsername(mailbox);
  const password = mailbox.password_enc ?? '';
  const webmailUrl = mailbox.login_url || options.webmailUrl || '';

  return [
    '=== D-Ticket Mailbox Login Exception Handover ===',
    '',
    '此交付方式仅用于客户明确获批可登录邮箱的例外场景。',
    '',
    '--- Mailbox Login ---',
    `Webmail URL: ${webmailUrl}`,
    `Username (for webmail): ${localPart}`,
    `Full email (for TicketPlus+ login): ${fullEmail}`,
    `Password: ${password}`,
    '',
    '--- Quick Start ---',
    '1. 打开邮箱网页登录地址，并用用户名和密码登录。',
    `2. 在 TicketPlus+ 中选择 Email Login，并输入完整邮箱: ${fullEmail}`,
    '3. 在邮箱中查收 TicketPlus+ 验证码。',
    '4. 输入验证码后查看 Deutschlandticket 二维码。',
    '',
    '--- Important Rules ---',
    '- 不要修改 TicketPlus+ 账号邮箱、密码、订阅或支付方式。',
    '- 车票为实名制，验票时可能要求出示证件。',
    '- 如需取消下月订阅，必须在当月 10 日前处理。',
    '',
    '--- Links ---',
    `Wallet Guide: ${guideUrl}`,
    `Rules & Billing: ${rulesUrl}`,
    '',
    '--- Disclaimer ---',
    'This is an independent purchase-assistance service.',
    'We are NOT affiliated with TicketPlus+, Deutsche Bahn, BVG, Deutschlandticket, or any official transport provider.',
  ].join('\n');
}
