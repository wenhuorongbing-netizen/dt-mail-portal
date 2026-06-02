import { describe, expect, it } from 'vitest';
import {
  generateShortDeliveryPack,
  generateDetailedDeliveryPack,
  generateTroubleshootPack,
} from '../orderUtils';
import type { Order } from '../orderUtils';

const baseOrder: Order = {
  id: 'test-id',
  operator_id: 'op-id',
  customer_label: 'Test Customer',
  customer_contact: 'wxid_test',
  passenger_name: 'SAN ZHANG',
  passenger_birthdate: '1995-10-24',
  ticket_month: '2026-06',
  start_date: '2026-06-01',
  after_tenth_day: false,
  ticket_month_count: 1,
  ticket_price_total: 49.0,
  service_fee: 10.0,
  total_amount: 59.0,
  status: 'handover_created',
  mailbox_account_id: null,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
  apple_wallet_link: 'https://wallet.apple.com/example',
  google_wallet_link: 'https://pay.google.com/example',
  handover_codes: [{ id: 'hc1', order_id: 'test-id', code: 'ABC12345', instructions: '', status: 'pending', viewed_at: null, created_at: '2026-06-01T00:00:00Z' }],
};

describe('generateShortDeliveryPack', () => {
  it('includes passenger name and ticket month', () => {
    const result = generateShortDeliveryPack(baseOrder);
    expect(result).toContain('SAN ZHANG');
    expect(result).toContain('2026-06');
  });

  it('includes wallet links', () => {
    const result = generateShortDeliveryPack(baseOrder);
    expect(result).toContain('https://wallet.apple.com/example');
    expect(result).toContain('https://pay.google.com/example');
  });

  it('shows fallback text when links are missing', () => {
    const order = { ...baseOrder, apple_wallet_link: null, google_wallet_link: null };
    const result = generateShortDeliveryPack(order);
    expect(result).toContain('链接待补充');
  });

  it('omits passenger line when name is null', () => {
    const order = { ...baseOrder, passenger_name: null };
    const result = generateShortDeliveryPack(order);
    expect(result).not.toContain('乘车人');
    expect(result).toContain('车票月份');
  });

  it('includes disclaimer', () => {
    const result = generateShortDeliveryPack(baseOrder);
    expect(result).toContain('独立购票协助服务');
  });

  it('never contains credentials', () => {
    const result = generateShortDeliveryPack(baseOrder);
    expect(result).not.toContain('mailbox_email');
    expect(result).not.toContain('password');
    expect(result).not.toContain('webmail');
    expect(result).not.toContain('OTP');
  });

  it('ignores mailbox_account_id even when set', () => {
    const order = { ...baseOrder, mailbox_account_id: 'some-mailbox-id' };
    const result = generateShortDeliveryPack(order);
    expect(result).not.toContain('some-mailbox-id');
    expect(result).not.toContain('password');
  });
});

describe('generateDetailedDeliveryPack', () => {
  it('includes handover code', () => {
    const result = generateDetailedDeliveryPack(baseOrder);
    expect(result).toContain('ABC12345');
  });

  it('shows fallback when no handover code', () => {
    const order = { ...baseOrder, handover_codes: undefined };
    const result = generateDetailedDeliveryPack(order);
    expect(result).toContain('未生成');
  });

  it('includes disclaimer', () => {
    const result = generateDetailedDeliveryPack(baseOrder);
    expect(result).toContain('独立购票协助服务');
  });

  it('never contains credentials', () => {
    const result = generateDetailedDeliveryPack(baseOrder);
    expect(result).not.toContain('password');
    expect(result).not.toContain('webmail');
  });
});

describe('generateTroubleshootPack', () => {
  it('includes handover code', () => {
    const result = generateTroubleshootPack(baseOrder);
    expect(result).toContain('ABC12345');
  });

  it('includes troubleshooting steps', () => {
    const result = generateTroubleshootPack(baseOrder);
    expect(result).toContain('Safari');
    expect(result).toContain('Chrome');
  });

  it('includes disclaimer', () => {
    const result = generateTroubleshootPack(baseOrder);
    expect(result).toContain('独立购票协助服务');
  });

  it('never contains credentials', () => {
    const result = generateTroubleshootPack(baseOrder);
    expect(result).not.toContain('password');
    expect(result).not.toContain('webmail');
  });
});
