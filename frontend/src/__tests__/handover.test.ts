import { describe, expect, it } from 'vitest';
import {
  createHandoverViewModel,
  extractHttpLinks,
  getWalletLinkLabel,
  type HandoverData,
} from '../lib/handover';

const baseHandover: HandoverData = {
  handover_id: 'handover-1',
  code: 'abc12345',
  instructions: '',
  handover_status: 'pending',
  viewed_at: null,
  order_id: 'order-1',
  customer_label: 'customer',
  ticket_month: '2026-06',
  status: 'handover_created',
  mailbox_email: 'ticket-user@tickets.buffjo.top',
  mailbox_password: 'secret-password',
  mailbox_domain: 'tickets.buffjo.top',
  mailbox_provider: 'cloudflare_routing',
  delivery_mode: 'wallet_only',
  mailbox_login_url: 'https://webmail.example.test',
  mailbox_username: 'ticket-user',
  customer_can_login: true,
  otp_managed_by_operator: true,
};

describe('handover view model', () => {
  it('defaults null delivery_mode to wallet_only and hides all account login fields', () => {
    const view = createHandoverViewModel({
      ...baseHandover,
      delivery_mode: null,
      instructions: 'Apple https://wallet.example.test/apple Google https://wallet.example.test/google.',
    });

    expect(view.deliveryMode).toBe('wallet_only');
    expect(view.isWalletOnly).toBe(true);
    expect(view.visibleEmail).toBeNull();
    expect(view.visiblePassword).toBeNull();
    expect(view.mailboxLoginUrl).toBeNull();
    expect(view.mailboxUsername).toBeNull();
    expect(view.copyText).not.toContain('ticket-user@tickets.buffjo.top');
    expect(view.copyText).not.toContain('secret-password');
    expect(view.walletLinks).toEqual([
      'https://wallet.example.test/apple',
      'https://wallet.example.test/google',
    ]);
  });

  it('keeps managed OTP as an explicit exception without exposing mailbox password', () => {
    const view = createHandoverViewModel({
      ...baseHandover,
      delivery_mode: 'managed_otp',
      customer_can_login: false,
      mailbox_password: null,
    });

    expect(view.isWalletOnly).toBe(false);
    expect(view.isManagedOtp).toBe(true);
    expect(view.visibleEmail).toBe('ticket-user@tickets.buffjo.top');
    expect(view.visiblePassword).toBeNull();
    expect(view.mailboxLoginUrl).toBeNull();
    expect(view.copyText).toContain('验证码获取方式');
  });

  it('exposes webmail fields only for approved customer-login exception modes', () => {
    const view = createHandoverViewModel({
      ...baseHandover,
      delivery_mode: 'external_mailbox',
      customer_can_login: true,
    });

    expect(view.canCustomerLogin).toBe(true);
    expect(view.visibleEmail).toBe('ticket-user@tickets.buffjo.top');
    expect(view.visiblePassword).toBe('secret-password');
    expect(view.mailboxUsername).toBe('ticket-user');
    expect(view.mailboxLoginUrl).toBe('https://webmail.example.test');
    expect(view.copyText).toContain('邮箱密码: secret-password');
  });
});

describe('handover link helpers', () => {
  it('deduplicates links and trims trailing punctuation', () => {
    expect(extractHttpLinks('Open https://a.test/link, then https://a.test/link and https://b.test/add.')).toEqual([
      'https://a.test/link',
      'https://b.test/add',
    ]);
  });

  it('labels Apple and Google wallet links', () => {
    expect(getWalletLinkLabel('https://example.test/apple/add', 0)).toBe('打开 Apple Wallet 链接');
    expect(getWalletLinkLabel('https://example.test/google/add', 1)).toBe('打开 Google Wallet 链接');
    expect(getWalletLinkLabel('https://example.test/pass/add', 2)).toBe('打开 Wallet 链接 3');
  });
});
