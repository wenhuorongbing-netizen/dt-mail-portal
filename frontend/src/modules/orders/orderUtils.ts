import { supabase } from '../../lib/supabase';

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
  apple_wallet_link: string | null;
  google_wallet_link: string | null;
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

function resolveWalletLink(link: string | null | undefined, fallback: string): string {
  return link?.trim() || fallback;
}

function buildShortPack(order: Order): string {
  const lines: string[] = ['您的 D-Ticket 已准备好。', ''];

  if (order.passenger_name) {
    lines.push(`乘车人：${order.passenger_name}`);
  }
  if (order.ticket_month) {
    lines.push(`车票月份：${order.ticket_month}`);
  }
  if (lines[lines.length - 1] !== '') lines.push('');

  lines.push('请点击以下官方链接添加到 Wallet：');
  lines.push(`Apple Wallet: ${resolveWalletLink(order.apple_wallet_link, '链接待补充')}`);
  lines.push(`Google Wallet: ${resolveWalletLink(order.google_wallet_link, '链接待补充')}`);
  lines.push('');
  lines.push('添加后，乘车前打开 Wallet 中的二维码。');
  lines.push('验票时请同时出示本人证件。');
  lines.push('本服务为独立购票协助服务，非官方售票方。');

  return lines.join('\n');
}

function buildDetailedPack(order: Order): string {
  const handoverCode = order.handover_codes?.[0]?.code;

  const lines: string[] = [
    '【D-Ticket Wallet 交付信息】',
    '',
    `乘车人：${order.passenger_name || '待确认'}`,
    `车票月份：${order.ticket_month || '待确认'}`,
    `交付码：${handoverCode || '未生成'}`,
    '',
    '1. 请点击官方 Wallet 链接：',
    `   Apple Wallet：${resolveWalletLink(order.apple_wallet_link, '链接待补充')}`,
    `   Google Wallet：${resolveWalletLink(order.google_wallet_link, '链接待补充')}`,
    '',
    '2. 如果在微信里打不开：',
    '   请复制链接到 Safari / Chrome 打开。',
    '',
    '3. 添加成功后：',
    '   乘车前打开 Apple Wallet / Google Wallet 中的二维码。',
    '   验票时请携带本人护照/身份证件。',
    '',
    '4. 注意：',
    '   不要只保存截图。',
    '   不要打印 PDF。',
    '   请确认姓名和证件一致。',
    '',
    '本服务为独立购票协助服务，与 TicketPlus+、Deutsche Bahn、BVG、Deutschlandticket 无关联。',
  ];

  return lines.join('\n');
}

function buildTroubleshootPack(order: Order): string {
  const handoverCode = order.handover_codes?.[0]?.code;

  const lines: string[] = [
    'D-Ticket Wallet 常见问题',
    '',
    '如果 Wallet 链接打不开：',
    '1. 复制链接到 Safari/Chrome 打开（不要在微信内直接打开）。',
    '2. 换一个网络后重试（如切换 Wi-Fi / 移动数据）。',
    '3. 确认手机系统支持 Apple Wallet 或 Google Wallet。',
    '4. 如仍无法解决，请截图发给客服。',
    '',
    `交付码：${handoverCode || '请联系客服获取'}`,
    `乘车人：${order.passenger_name || '请联系客服确认'}`,
    `车票月份：${order.ticket_month || '请联系客服确认'}`,
    '',
    `Apple Wallet: ${resolveWalletLink(order.apple_wallet_link, '请联系客服补发')}`,
    `Google Wallet: ${resolveWalletLink(order.google_wallet_link, '请联系客服补发')}`,
    '',
    '本服务为独立购票协助服务，与 TicketPlus+、Deutsche Bahn、BVG、Deutschlandticket 无关联。',
  ];

  return lines.join('\n');
}

export function generateShortDeliveryPack(order: Order): string {
  return buildShortPack(order);
}

export function generateDetailedDeliveryPack(order: Order): string {
  return buildDetailedPack(order);
}

export function generateTroubleshootPack(order: Order): string {
  return buildTroubleshootPack(order);
}

export async function logDeliveryPackCopy(
  templateType: 'short' | 'detailed' | 'troubleshoot',
  orderId: string,
  handoverCode: string | null,
): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const operatorId = userData.user?.id;
    if (!operatorId) return;

    await supabase.from('audit_events').insert({
      operator_id: operatorId,
      action: 'delivery_pack.copied',
      target_table: 'orders',
      target_id: orderId,
      details: {
        template_type: templateType,
        handover_code: handoverCode,
      },
    });
  } catch {
    // Silent fail — audit is best-effort
  }
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
