# Spec: Wallet Delivery Pack Generator

> **Feature**: Night 1 — Feature Area A from `docs/goal.md`  
> **Status**: Ready for implementation  
> **Scope**: Admin order detail panel only (no customer-facing changes)

---

## 1. Overview

The Wallet Delivery Pack Generator lets operators generate three types of copy-ready delivery messages from the order detail panel in `/#/admin/orders`:

1. **极简交付文案** (Short) — Minimal WeChat-paste message with Wallet links and disclaimer.
2. **详细交付文案** (Detailed) — Full step-by-step instructions for the customer.
3. **售后排障文案** (Troubleshoot) — After-delivery FAQ for troubleshooting Wallet issues.

Each template has a one-click copy button. The order detail panel also gains:
- Two new input fields: `apple_wallet_link` and `google_wallet_link` (saved to the `orders` table).
- A pre-delivery checklist with 8 checkboxes (local UI state only, not persisted).

---

## 2. Data Model Changes

### 2.1 New columns on `orders` table

Add two nullable text columns:

```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS apple_wallet_link text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS google_wallet_link text;
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `apple_wallet_link` | `text` | yes | Official Apple Wallet add-to-wallet URL from TicketPlus+ email/app/web |
| `google_wallet_link` | `text` | yes | Official Google Wallet add-to-wallet URL from TicketPlus+ email/app/web |

These are operator-managed fields. They are **not** returned to the customer handover RPC (`get_handover_by_code`). Customers receive Wallet links through the `instructions` field on `handover_codes`.

### 2.2 Migration file

Create `supabase/migrations/006_add_wallet_link_fields.sql`:

```sql
-- 006: Add apple_wallet_link and google_wallet_link to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS apple_wallet_link text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS google_wallet_link text;

COMMENT ON COLUMN public.orders.apple_wallet_link IS 'Official Apple Wallet add link from TicketPlus+ email/app/web. Operator-managed.';
COMMENT ON COLUMN public.orders.google_wallet_link IS 'Official Google Wallet add link from TicketPlus+ email/app/web. Operator-managed.';
```

### 2.3 TypeScript type update

In `frontend/src/modules/orders/orderUtils.ts`, add to the `Order` interface:

```typescript
export interface Order {
  // ... existing fields ...
  apple_wallet_link: string | null;   // NEW
  google_wallet_link: string | null;  // NEW
}
```

---

## 3. Template Functions — `orderUtils.ts`

Add three new exported functions after `buildHandoverText`. All functions are pure (no side effects), accept an `Order`, and return a `string`.

### 3.1 `generateShortDeliveryPack`

```typescript
export function generateShortDeliveryPack(order: Order): string
```

**Template (Chinese-first):**

```
您的 D-Ticket 已准备好。

请点击以下官方链接添加到 Wallet：
Apple Wallet: {apple_wallet_link 或 "链接待补充"}
Google Wallet: {google_wallet_link 或 "链接待补充"}

添加后，乘车前打开 Wallet 中的二维码。
验票时请同时出示本人证件。
本服务为独立购票协助服务，非官方售票方。
```

**Rules:**
- If `order.apple_wallet_link` is set, include it. Otherwise show `链接待补充`.
- If `order.google_wallet_link` is set, include it. Otherwise show `链接待补充`.
- Include `passenger_name` if present (add line: `乘车人：{passenger_name}`).
- Include `ticket_month` if present (add line: `车票月份：{ticket_month}`).
- **NEVER** include `mailbox_email`, `mailbox_password`, `webmail_url`, or OTP.
- End with the independent-service disclaimer (Chinese version).

### 3.2 `generateDetailedDeliveryPack`

```typescript
export function generateDetailedDeliveryPack(order: Order): string
```

**Template (Chinese-first):**

```
【D-Ticket Wallet 交付信息】

乘车人：{passenger_name 或 "待确认"}
车票月份：{ticket_month 或 "待确认"}
交付码：{handover_code 或 "未生成"}

1. 请点击官方 Wallet 链接：
   Apple Wallet：{apple_wallet_link 或 "链接待补充"}
   Google Wallet：{google_wallet_link 或 "链接待补充"}

2. 如果在微信里打不开：
   请复制链接到 Safari / Chrome 打开。

3. 添加成功后：
   乘车前打开 Apple Wallet / Google Wallet 中的二维码。
   验票时请携带本人护照/身份证件。

4. 注意：
   不要只保存截图。
   不要打印 PDF。
   请确认姓名和证件一致。

本服务为独立购票协助服务，与 TicketPlus+、Deutsche Bahn、BVG、Deutschlandticket 无关联。
```

**Rules:**
- Same Wallet link logic as short version.
- `handover_code`: use the first code from `order.handover_codes?.[0]?.code` if available, otherwise `未生成`.
- **NEVER** include credentials.

### 3.3 `generateTroubleshootPack`

```typescript
export function generateTroubleshootPack(order: Order): string
```

**Template (Chinese-first):**

```
D-Ticket Wallet 常见问题

如果 Wallet 链接打不开：
1. 复制链接到 Safari/Chrome 打开（不要在微信内直接打开）。
2. 换一个网络后重试（如切换 Wi-Fi / 移动数据）。
3. 确认手机系统支持 Apple Wallet 或 Google Wallet。
4. 如仍无法解决，请截图发给客服。

交付码：{handover_code 或 "请联系客服获取"}
乘车人：{passenger_name 或 "请联系客服确认"}
车票月份：{ticket_month 或 "请联系客服确认"}

Apple Wallet: {apple_wallet_link 或 "请联系客服补发"}
Google Wallet: {google_wallet_link 或 "请联系客服补发"}

本服务为独立购票协助服务，与 TicketPlus+、Deutsche Bahn、BVG、Deutschlandticket 无关联。
```

**Rules:**
- Same credential exclusion rules as above.
- Include handover_code, passenger_name, ticket_month.

### 3.4 Implementation notes

- Each function must call a shared internal helper to resolve wallet links with fallback text, to avoid duplication.
- The disclaimer line must use the exact Chinese text specified above. Do not omit it.
- All three functions are `wallet_only`-safe by design: they reference only `Order` fields that are safe to display (`passenger_name`, `ticket_month`, `apple_wallet_link`, `google_wallet_link`) plus `handover_codes`. They never access `mailbox_account` fields.

---

## 4. UI Changes — `orders/index.tsx`

### 4.1 New state variables

```typescript
const [appleWalletLink, setAppleWalletLink] = useState('');
const [googleWalletLink, setGoogleWalletLink] = useState('');
const [checklist, setChecklist] = useState<Record<string, boolean>>({
  passenger_name_confirmed: false,
  ticket_month_confirmed: false,
  wallet_links_present: false,
  no_custom_pkpass: false,
  no_qr_only: false,
  risk_reviewed: false,
  handover_code_generated: false,
  delivery_pack_sent: false,
});
```

### 4.2 Populate wallet link fields on order selection

When `selectedOrder` changes, sync the wallet link input fields:

```typescript
useEffect(() => {
  if (selectedOrder) {
    setAppleWalletLink(selectedOrder.apple_wallet_link ?? '');
    setGoogleWalletLink(selectedOrder.google_wallet_link ?? '');
  }
}, [selectedOrder]);
```

### 4.3 Save wallet links handler

```typescript
async function handleSaveWalletLinks() {
  if (!selectedOrder) return;
  setBtnLoading(true);
  setErrorMsg('');

  const { error } = await supabase
    .from('orders')
    .update({
      apple_wallet_link: appleWalletLink.trim() || null,
      google_wallet_link: googleWalletLink.trim() || null,
    })
    .eq('id', selectedOrder.id);

  if (error) {
    setErrorMsg(error.message);
  } else {
    await loadOrders();
    await refreshSelectedOrder(selectedOrder.id);
  }

  setBtnLoading(false);
}
```

### 4.4 UI layout — Wallet Links section

Insert **between** the "Assigned Email Record" section and the "Handover Codes" section in the order detail card. This positions it logically: operator assigns email → pastes Wallet links → generates handover → generates delivery pack.

```tsx
{/* --- Wallet Links --- */}
<div style={{ marginBottom: '16px' }}>
  <h4 style={{ margin: '0 0 10px' }}>Wallet Links</h4>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div>
      <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Apple Wallet Link</label>
      <Input
        value={appleWalletLink}
        onChange={(e) => setAppleWalletLink(e.target.value)}
        placeholder="https://wallet.apple.com/..."
      />
    </div>
    <div>
      <label className="eyebrow" style={{ display: 'block', marginBottom: '4px' }}>Google Wallet Link</label>
      <Input
        value={googleWalletLink}
        onChange={(e) => setGoogleWalletLink(e.target.value)}
        placeholder="https://pay.google.com/..."
      />
    </div>
    <Button
      className="button-secondary"
      disabled={btnLoading}
      onClick={handleSaveWalletLinks}
      style={{ alignSelf: 'flex-start', minHeight: '36px', padding: '0 12px' }}
    >
      Save Wallet Links
    </Button>
  </div>
</div>
```

### 4.5 UI layout — Wallet Delivery Pack section

Insert **after** the "Handover Codes" section and **before** the "Customer Metadata" section. This is the main new section.

```tsx
{/* --- Wallet Delivery Pack --- */}
<div style={{ marginBottom: '16px' }}>
  <h4 style={{ margin: '0 0 10px' }}>Wallet Delivery Pack</h4>

  {/* Three copy buttons in a row */}
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
    <button
      onClick={() => {
        const text = generateShortDeliveryPack(selectedOrder);
        triggerCopy(text, 'pack-short');
        logDeliveryPackCopy('short');
      }}
      style={copyButtonStyle}
    >
      {copyState['pack-short'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
      {copyState['pack-short'] ? '已复制' : '复制极简文案'}
    </button>
    <button
      onClick={() => {
        const text = generateDetailedDeliveryPack(selectedOrder);
        triggerCopy(text, 'pack-detailed');
        logDeliveryPackCopy('detailed');
      }}
      style={copyButtonStyle}
    >
      {copyState['pack-detailed'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
      {copyState['pack-detailed'] ? '已复制' : '复制详细文案'}
    </button>
    <button
      onClick={() => {
        const text = generateTroubleshootPack(selectedOrder);
        triggerCopy(text, 'pack-troubleshoot');
        logDeliveryPackCopy('troubleshoot');
      }}
      style={copyButtonStyle}
    >
      {copyState['pack-troubleshoot'] ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
      {copyState['pack-troubleshoot'] ? '已复制' : '复制售后文案'}
    </button>
  </div>

  {/* Preview textareas — collapsible */}
  <details style={{ marginBottom: '12px' }}>
    <summary style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--muted)' }}>Preview templates</summary>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
      {[
        { label: '极简交付文案', text: generateShortDeliveryPack(selectedOrder) },
        { label: '详细交付文案', text: generateDetailedDeliveryPack(selectedOrder) },
        { label: '售后排障文案', text: generateTroubleshootPack(selectedOrder) },
      ].map(({ label, text }) => (
        <div key={label}>
          <p className="eyebrow" style={{ margin: '0 0 4px' }}>{label}</p>
          <textarea
            readOnly
            value={text}
            style={{
              width: '100%',
              height: '140px',
              padding: '10px',
              border: '1px solid rgba(16,25,47,0.08)',
              borderRadius: 10,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              lineHeight: '1.4',
              resize: 'vertical',
              background: 'white',
            }}
          />
        </div>
      ))}
    </div>
  </details>
</div>
```

**`copyButtonStyle`** (shared constant):

```typescript
const copyButtonStyle: React.CSSProperties = {
  background: 'rgba(16,25,47,0.06)',
  border: 'none',
  padding: '6px 10px',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.78rem',
  fontWeight: 600,
};
```

### 4.6 UI layout — Pre-delivery Checklist

Insert **inside** the Wallet Delivery Pack section, **after** the preview textareas.

```tsx
{/* --- Pre-delivery Checklist --- */}
<div style={{ background: '#f4efe6', padding: '14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
  <span className="eyebrow">Pre-delivery Checklist</span>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
    {[
      { key: 'passenger_name_confirmed', label: '乘车人姓名已确认' },
      { key: 'ticket_month_confirmed', label: '车票月份已确认' },
      { key: 'wallet_links_present', label: 'Wallet 链接来自官方邮件/App/网页' },
      { key: 'no_custom_pkpass', label: '没有发送自制 pkpass' },
      { key: 'no_qr_only', label: '没有只发二维码截图' },
      { key: 'risk_reviewed', label: '已记录付款/订阅风险' },
      { key: 'handover_code_generated', label: '已生成交付码' },
      { key: 'delivery_pack_sent', label: '已发送客户交付包' },
    ].map(({ key, label }) => (
      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checklist[key]}
          onChange={(e) => setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))}
          style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
        />
        <span style={{ textDecoration: checklist[key] ? 'line-through' : 'none', color: checklist[key] ? 'var(--muted)' : 'inherit' }}>
          {label}
        </span>
      </label>
    ))}
  </div>
</div>
```

**Note:** The checklist is local UI state only (not persisted to the database). It resets when the operator navigates away. This is intentional for Phase 1 — a lightweight SOP reminder.

---

## 5. Wallet Link Detection — `handover.ts`

### 5.1 New utility function

Add to `frontend/src/lib/handover.ts`:

```typescript
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
    } else if (lower.includes('pay.google.com') || lower.includes('google.com/wallet')) {
      google.push(link);
    } else {
      other.push(link);
    }
  }

  return { apple, google, other };
}
```

### 5.2 URL validation helper

Add to `frontend/src/lib/handover.ts`:

```typescript
export function looksLikeWalletLink(url: string, type: 'apple' | 'google'): boolean {
  const lower = url.toLowerCase();
  if (type === 'apple') {
    return lower.includes('apple.com') || lower.includes('wallet.apple');
  }
  return lower.includes('pay.google.com') || lower.includes('google.com/wallet') || lower.includes('google.com/pay');
}
```

### 5.3 Integration in `orders/index.tsx`

When the operator pastes a URL into the `apple_wallet_link` or `google_wallet_link` input field, show a subtle inline hint if the URL does not match the expected pattern:

```typescript
const appleLinkValid = !appleWalletLink || looksLikeWalletLink(appleWalletLink, 'apple');
const googleLinkValid = !googleWalletLink || looksLikeWalletLink(googleWalletLink, 'google');
```

Render a small warning text below the input if invalid:

```tsx
{!appleLinkValid && (
  <p style={{ color: 'var(--warning)', fontSize: '0.75rem', margin: '4px 0 0' }}>
    This URL does not look like an Apple Wallet link.
  </p>
)}
```

---

## 6. Audit Events

### 6.1 Helper function

Add to `frontend/src/modules/orders/orderUtils.ts` (or a new `frontend/src/lib/audit.ts` if preferred):

```typescript
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
```

### 6.2 Invocation

Each copy button in the delivery pack section calls `logDeliveryPackCopy` after the clipboard write. The function is fire-and-forget (no await in the UI handler).

---

## 7. Security Rules

These rules are enforced by the template functions and the UI layer:

| Rule | Enforcement |
|------|-------------|
| `wallet_only` orders never expose `mailbox_email` | Template functions never read `mailbox_account` fields |
| `wallet_only` orders never expose `mailbox_password` | Same as above |
| `wallet_only` orders never expose `webmail_url` | Same as above |
| `wallet_only` orders never expose OTP | Same as above |
| Templates contain only safe fields | Functions reference only: `passenger_name`, `ticket_month`, `apple_wallet_link`, `google_wallet_link`, `handover_codes[].code` |
| Disclaimer always included | Each template ends with the independent-service disclaimer |
| Wallet links not leaked via handover RPC | `apple_wallet_link` / `google_wallet_link` are on `orders`, not returned by `get_handover_by_code` |

The template functions are designed to be inherently safe: they accept an `Order` object and only access whitelisted fields. Even if `mailbox_account` is populated on the order, the template functions ignore it.

---

## 8. Testing

### 8.1 Unit tests for template functions

Create `frontend/src/modules/orders/__tests__/deliveryPack.test.ts`:

```typescript
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
```

### 8.2 Unit tests for `classifyWalletLinks`

Create `frontend/src/lib/__tests__/handover.test.ts`:

```typescript
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
  });

  it('rejects non-Google URLs for google type', () => {
    expect(looksLikeWalletLink('https://wallet.apple.com/card/1', 'google')).toBe(false);
  });
});
```

---

## 9. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/006_add_wallet_link_fields.sql` | **CREATE** | Migration to add `apple_wallet_link` and `google_wallet_link` columns to `orders` |
| `frontend/src/modules/orders/orderUtils.ts` | **MODIFY** | Add `apple_wallet_link` / `google_wallet_link` to `Order` interface; add `generateShortDeliveryPack`, `generateDetailedDeliveryPack`, `generateTroubleshootPack` functions; add `logDeliveryPackCopy` audit helper |
| `frontend/src/modules/orders/index.tsx` | **MODIFY** | Add wallet link inputs, save handler, delivery pack section with 3 copy buttons, preview textareas, pre-delivery checklist, URL validation hints |
| `frontend/src/lib/handover.ts` | **MODIFY** | Add `classifyWalletLinks` and `looksLikeWalletLink` utility functions |
| `frontend/src/modules/orders/__tests__/deliveryPack.test.ts` | **CREATE** | Unit tests for the three template functions |
| `frontend/src/lib/__tests__/handover.test.ts` | **CREATE** | Unit tests for `classifyWalletLinks` and `looksLikeWalletLink` |

### Imports to add in `index.tsx`

```typescript
import {
  // ... existing imports from orderUtils ...
  generateShortDeliveryPack,
  generateDetailedDeliveryPack,
  generateTroubleshootPack,
  logDeliveryPackCopy,
} from './orderUtils';
import { looksLikeWalletLink } from '../../lib/handover';
```

---

## 10. Acceptance Criteria

- [ ] Operator can paste Apple Wallet and Google Wallet links into the order detail and save them.
- [ ] Saved links persist across page reloads.
- [ ] "复制极简文案" copies a short Chinese message with Wallet links and disclaimer.
- [ ] "复制详细文案" copies a detailed Chinese message with all steps, links, and disclaimer.
- [ ] "复制售后文案" copies a troubleshooting FAQ with handover code and disclaimer.
- [ ] Preview textareas show the generated text for each template.
- [ ] All three templates NEVER contain `mailbox_email`, `mailbox_password`, `webmail_url`, or OTP.
- [ ] All three templates include the independent-service disclaimer.
- [ ] Pre-delivery checklist renders 8 checkboxes with Chinese labels.
- [ ] URL validation shows a warning if the pasted URL does not match the expected wallet pattern.
- [ ] Copying a delivery pack writes an `audit_events` row with action `delivery_pack.copied`.
- [ ] Frontend builds without TypeScript errors (`npm run build`).
- [ ] Unit tests pass (`npx vitest run`).
