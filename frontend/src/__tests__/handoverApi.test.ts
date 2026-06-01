import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  WEBMAIL_URL: 'https://webmail.example.test',
  supabase: supabaseMock,
}));

import { getHandoverByCode, type HandoverData } from '../lib/handover';

describe('getHandoverByCode API wrapper', () => {
  beforeEach(() => {
    supabaseMock.rpc.mockReset();
  });

  it('calls the canonical Supabase RPC with p_code', async () => {
    const handover = { code: 'abc12345', delivery_mode: 'wallet_only' } as HandoverData;
    supabaseMock.rpc.mockResolvedValue({ data: handover, error: null });

    await expect(getHandoverByCode('abc12345')).resolves.toBe(handover);

    expect(supabaseMock.rpc).toHaveBeenCalledWith('get_handover_by_code', {
      p_code: 'abc12345',
    });
  });

  it('returns null for missing handover records', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: null, error: null });

    await expect(getHandoverByCode('missing')).resolves.toBeNull();
  });

  it('throws Supabase RPC errors for the page to handle', async () => {
    const error = new Error('RPC unavailable');
    supabaseMock.rpc.mockResolvedValue({ data: null, error });

    await expect(getHandoverByCode('abc12345')).rejects.toThrow('RPC unavailable');
  });
});
