import { describe, expect, it } from 'vitest';
import { classifyWalletLinks, looksLikeWalletLink } from '../handover';

describe('classifyWalletLinks', () => {
  it('classifies Apple Wallet links', () => {
    const result = classifyWalletLinks(['https://wallet.apple.com/card/123']);
    expect(result.apple).toHaveLength(1);
    expect(result.google).toHaveLength(0);
  });

  it('classifies Google Wallet links', () => {
    const result = classifyWalletLinks(['https://pay.google.com/gp/v/save/123']);
    expect(result.google).toHaveLength(1);
    expect(result.apple).toHaveLength(0);
  });

  it('classifies google.com/pay as Google Wallet', () => {
    const result = classifyWalletLinks(['https://google.com/pay/abc']);
    expect(result.google).toHaveLength(1);
    expect(result.other).toHaveLength(0);
  });

  it('classifies unknown links as other', () => {
    const result = classifyWalletLinks(['https://example.com/thing']);
    expect(result.other).toHaveLength(1);
  });

  it('handles empty array', () => {
    const result = classifyWalletLinks([]);
    expect(result.apple).toHaveLength(0);
    expect(result.google).toHaveLength(0);
    expect(result.other).toHaveLength(0);
  });

  it('handles multiple links', () => {
    const result = classifyWalletLinks([
      'https://wallet.apple.com/card/1',
      'https://pay.google.com/gp/v/save/2',
      'https://example.com',
    ]);
    expect(result.apple).toHaveLength(1);
    expect(result.google).toHaveLength(1);
    expect(result.other).toHaveLength(1);
  });
});

describe('looksLikeWalletLink', () => {
  it('recognizes Apple Wallet URLs', () => {
    expect(looksLikeWalletLink('https://wallet.apple.com/card/123', 'apple')).toBe(true);
    expect(looksLikeWalletLink('https://www.apple.com/wallet', 'apple')).toBe(true);
  });

  it('rejects non-Apple URLs for apple type', () => {
    expect(looksLikeWalletLink('https://pay.google.com/gp/v/save/1', 'apple')).toBe(false);
  });

  it('recognizes Google Wallet URLs', () => {
    expect(looksLikeWalletLink('https://pay.google.com/gp/v/save/123', 'google')).toBe(true);
    expect(looksLikeWalletLink('https://google.com/wallet/thing', 'google')).toBe(true);
    expect(looksLikeWalletLink('https://google.com/pay/123', 'google')).toBe(true);
  });

  it('rejects non-Google URLs for google type', () => {
    expect(looksLikeWalletLink('https://wallet.apple.com/card/1', 'google')).toBe(false);
  });
});
