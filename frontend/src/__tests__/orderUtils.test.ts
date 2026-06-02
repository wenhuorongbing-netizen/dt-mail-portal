import { describe, expect, it } from 'vitest';
import {
  buildHandoverText,
  calculatePricing,
  customerCanLogin,
  getTicketMonth,
  type MailboxAccount,
  type Order,
} from '../modules/orders/orderUtils';

function mailbox(overrides: Partial<MailboxAccount> = {}): MailboxAccount {
  return {
    id: 'mailbox-1',
    email_address: 'ticket-user@tickets.buffjo.top',
    provider: 'cloudflare_routing',
    delivery_mode: 'wallet_only',
    login_url: 'https://webmail.example.test',
    username: 'ticket-user',
    password_enc: 'secret-password',
    customer_can_login: false,
    otp_managed_by_operator: true,
    domain: 'tickets.buffjo.top',
    status: 'active',
    ...overrides,
  };
}

function order(mailboxAccount: MailboxAccount): Order {
  return {
    id: 'order-1',
    operator_id: 'operator-1',
    customer_label: 'customer',
    customer_contact: null,
    passenger_name: 'SAN ZHANG',
    passenger_birthdate: '1995-10-24',
    ticket_month: '2026-06',
    start_date: '2026-06-01',
    after_tenth_day: false,
    ticket_month_count: 1,
    ticket_price_total: 63,
    service_fee: 10,
    total_amount: 73,
    status: 'ticket_purchased',
    mailbox_account_id: mailboxAccount.id,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    apple_wallet_link: null,
    google_wallet_link: null,
    mailbox_account: mailboxAccount,
    handover_codes: [],
  };
}

describe('order pricing helpers', () => {
  it('uses one ticket month on or before the 10th', () => {
    expect(calculatePricing('2026-06-10', 10)).toEqual({
      after10th: false,
      monthCount: 1,
      ticketPrice: 63,
      total: 73,
    });
  });

  it('uses two ticket months after the 10th', () => {
    expect(calculatePricing('2026-06-11', 10)).toEqual({
      after10th: true,
      monthCount: 2,
      ticketPrice: 126,
      total: 136,
    });
  });

  it('derives the ticket month from the start date', () => {
    expect(getTicketMonth('2026-09-05')).toBe('2026-09');
  });
});

describe('order handover text', () => {
  it('builds Wallet-only handover text without account credentials', () => {
    const text = buildHandoverText(order(mailbox()), { origin: 'https://portal.example.test' });

    expect(text).toContain('Wallet-only Handover');
    expect(text).toContain('{{apple_wallet_link}}');
    expect(text).toContain('{{google_wallet_link}}');
    expect(text).toContain('We are NOT affiliated');
    expect(text).not.toContain('ticket-user@tickets.buffjo.top');
    expect(text).not.toContain('secret-password');
    expect(text).not.toContain('Webmail URL');
  });

  it('builds managed OTP exception text with login email but no mailbox password', () => {
    const text = buildHandoverText(order(mailbox({ delivery_mode: 'managed_otp' })), {
      origin: 'https://portal.example.test',
    });

    expect(text).toContain('Managed OTP Exception');
    expect(text).toContain('ticket-user@tickets.buffjo.top');
    expect(text).toContain('验证码获取方式');
    expect(text).not.toContain('secret-password');
    expect(text).not.toContain('Webmail URL');
  });

  it('builds mailbox login exception text only when customers can log in', () => {
    const account = mailbox({
      delivery_mode: 'external_mailbox',
      customer_can_login: true,
    });

    expect(customerCanLogin(account)).toBe(true);

    const text = buildHandoverText(order(account), {
      origin: 'https://portal.example.test',
      webmailUrl: 'https://fallback-webmail.example.test',
    });

    expect(text).toContain('Mailbox Login Exception');
    expect(text).toContain('Webmail URL: https://webmail.example.test');
    expect(text).toContain('Full email (for TicketPlus+ login): ticket-user@tickets.buffjo.top');
    expect(text).toContain('Password: secret-password');
  });
});
