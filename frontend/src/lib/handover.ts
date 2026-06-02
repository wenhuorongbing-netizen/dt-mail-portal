import { WEBMAIL_URL, supabase } from './supabase';

export type DeliveryMode = 'wallet_only' | 'managed_otp' | 'external_mailbox' | 'customer_mailbox';

export interface HandoverData {
  handover_id: string;
  code: string;
  instructions: string;
  handover_status: string;
  viewed_at: string | null;
  order_id: string;
  customer_label: string | null;
  ticket_month: string | null;
  status: string;
  mailbox_email: string | null;
  mailbox_password: string | null;
  mailbox_domain: string | null;
  mailbox_provider: string | null;
  delivery_mode: DeliveryMode | null;
  mailbox_login_url: string | null;
  mailbox_username: string | null;
  customer_can_login: boolean | null;
  otp_managed_by_operator: boolean | null;
}

export interface HandoverViewModel {
  deliveryMode: DeliveryMode;
  isWalletOnly: boolean;
  isManagedOtp: boolean;
  canCustomerLogin: boolean;
  visibleEmail: string | null;
  visiblePassword: string | null;
  mailboxUsername: string | null;
  mailboxLoginUrl: string | null;
  steps: string[];
  copyText: string;
  walletLinks: string[];
}

const WALLET_ONLY_STEPS = ['确认实名信息', '添加 Wallet', '乘车前打开二维码', '验票时出示证件'];
const MANAGED_OTP_STEPS = ['复制登录邮箱', '联系客服取验证码', '登录 TicketPlus+', '查看车票'];
const EXTERNAL_MAILBOX_STEPS = ['登录邮箱', '收验证码', '登录 TicketPlus+', '查看车票'];

const CUSTOMER_LOGIN_MODES: DeliveryMode[] = ['external_mailbox', 'customer_mailbox'];

function normalizeDeliveryMode(mode: DeliveryMode | null | undefined): DeliveryMode {
  return mode ?? 'wallet_only';
}

export function extractHttpLinks(text: string | null | undefined): string[] {
  const matches = text?.match(/https?:\/\/[^\s<>"')]+/g) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[.,;，。；]+$/, '')))];
}

export function getWalletLinkLabel(url: string, index: number): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('apple')) return '打开 Apple Wallet 链接';
  if (lowerUrl.includes('google')) return '打开 Google Wallet 链接';
  return `打开 Wallet 链接 ${index + 1}`;
}

export function looksLikeWalletLink(url: string, type: 'apple' | 'google'): boolean {
  const lower = url.toLowerCase();
  if (type === 'apple') {
    return lower.includes('apple.com') || lower.includes('wallet.apple');
  }
  return lower.includes('pay.google.com') || lower.includes('google.com/wallet') || lower.includes('google.com/pay');
}

export function classifyWalletLinks(
  links: string[],
): { apple: string[]; google: string[]; other: string[] } {
  const apple: string[] = [];
  const google: string[] = [];
  const other: string[] = [];

  for (const link of links) {
    const lower = link.toLowerCase();
    if (lower.includes('apple.com') || lower.includes('wallet.apple')) {
      apple.push(link);
    } else if (lower.includes('pay.google.com') || lower.includes('google.com/wallet') || lower.includes('google.com/pay')) {
      google.push(link);
    } else {
      other.push(link);
    }
  }

  return { apple, google, other };
}

export async function getHandoverByCode(code: string): Promise<HandoverData | null> {
  const { data, error } = await supabase.rpc('get_handover_by_code', {
    p_code: code,
  });

  if (error) {
    throw error;
  }

  return (data as HandoverData | null) ?? null;
}

export function createHandoverViewModel(data: HandoverData): HandoverViewModel {
  const deliveryMode = normalizeDeliveryMode(data.delivery_mode);
  const isWalletOnly = deliveryMode === 'wallet_only';
  const canCustomerLogin =
    CUSTOMER_LOGIN_MODES.includes(deliveryMode) &&
    Boolean(data.customer_can_login && data.mailbox_password);
  const isManagedOtp = deliveryMode === 'managed_otp' && !canCustomerLogin;

  const visibleEmail = isWalletOnly ? null : data.mailbox_email;
  const visiblePassword = canCustomerLogin ? data.mailbox_password : null;
  const mailboxUsername = canCustomerLogin
    ? data.mailbox_username ?? visibleEmail?.split('@')[0] ?? null
    : null;
  const mailboxLoginUrl = canCustomerLogin ? data.mailbox_login_url ?? WEBMAIL_URL : null;
  const walletLinks = isWalletOnly ? extractHttpLinks(data.instructions) : [];

  return {
    deliveryMode,
    isWalletOnly,
    isManagedOtp,
    canCustomerLogin,
    visibleEmail,
    visiblePassword,
    mailboxUsername,
    mailboxLoginUrl,
    steps: isWalletOnly ? WALLET_ONLY_STEPS : canCustomerLogin ? EXTERNAL_MAILBOX_STEPS : MANAGED_OTP_STEPS,
    copyText: buildCopyText(data, {
      deliveryMode,
      isWalletOnly,
      isManagedOtp,
      canCustomerLogin,
      visibleEmail,
      visiblePassword,
      mailboxUsername,
      mailboxLoginUrl,
      steps: [],
      copyText: '',
      walletLinks,
    }),
    walletLinks,
  };
}

function buildCopyText(data: HandoverData, view: HandoverViewModel): string {
  if (view.isWalletOnly) {
    return [
      'D-Ticket Wallet 交付信息',
      `交付码: ${data.code}`,
      data.ticket_month ? `车票月份: ${data.ticket_month}` : '',
      '',
      '请使用客服发送的 TicketPlus+ 官方 Apple Wallet / Google Wallet 添加链接。',
      '如果在微信内打不开链接，请复制链接到 Safari 或 Chrome 打开。',
      '添加完成后，乘车前打开 Wallet 中的二维码，并随身携带护照或身份证件。',
      '',
      data.instructions?.trim() ? `客服备注:\n${data.instructions.trim()}` : '',
      '',
      '独立服务声明: 本服务不是 TicketPlus+、Deutsche Bahn、BVG 或 Deutschlandticket 官方服务。',
    ].filter(Boolean).join('\n');
  }

  if (view.canCustomerLogin) {
    return [
      'D-Ticket 邮箱登录交付信息',
      `TicketPlus+ 登录邮箱: ${view.visibleEmail ?? ''}`,
      `邮箱网页登录用户名: ${view.mailboxUsername ?? ''}`,
      `邮箱密码: ${view.visiblePassword ?? ''}`,
      `邮箱登录地址: ${view.mailboxLoginUrl ?? ''}`,
      '',
      '请只在获批的例外场景使用账号登录方式，不要修改 TicketPlus+ 账号邮箱、密码或支付方式。',
      '',
      data.instructions?.trim() ? `客服备注:\n${data.instructions.trim()}` : '',
    ].filter(Boolean).join('\n');
  }

  return [
    'D-Ticket 托管 OTP 例外交付信息',
    `TicketPlus+ 登录邮箱: ${view.visibleEmail ?? ''}`,
    '验证码获取方式: 请通过客服渠道获取 TicketPlus+ 登录验证码。',
    '请不要尝试接管邮箱、修改账号邮箱/密码或更改支付方式。',
    '',
    data.instructions?.trim() ? `客服备注:\n${data.instructions.trim()}` : '',
  ].filter(Boolean).join('\n');
}
