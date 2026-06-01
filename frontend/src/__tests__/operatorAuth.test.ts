import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: authMock,
  },
}));

import { normalizeOperatorLogin, signInOrRegisterOperator } from '../lib/operatorAuth';

describe('normalizeOperatorLogin', () => {
  it('maps short operator names to the configured auth domain', () => {
    expect(normalizeOperatorLogin(' ABC ', 'ops.example.test')).toBe('abc@ops.example.test');
  });

  it('keeps full email identifiers for compatibility', () => {
    expect(normalizeOperatorLogin('Admin@Example.COM', 'ops.example.test')).toBe('admin@example.com');
  });
});

describe('signInOrRegisterOperator', () => {
  beforeEach(() => {
    authMock.signInWithPassword.mockReset();
    authMock.signUp.mockReset();
  });

  it('rejects missing email before calling Supabase', async () => {
    const result = await signInOrRegisterOperator('   ', 'secret1');

    expect(result.status).toBe('validation_error');
    expect(authMock.signInWithPassword).not.toHaveBeenCalled();
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it('rejects short passwords before calling Supabase', async () => {
    const result = await signInOrRegisterOperator('operator@example.com', '123');

    expect(result.status).toBe('validation_error');
    expect(authMock.signInWithPassword).not.toHaveBeenCalled();
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it('signs in an existing operator and appends the default domain to short names', async () => {
    authMock.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const result = await signInOrRegisterOperator(' operator ', 'secret1');

    expect(result).toMatchObject({ status: 'signed_in', source: 'login' });
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: 'operator@operators.localhost',
      password: 'secret1',
    });
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it('rejects invalid short names before calling Supabase', async () => {
    const result = await signInOrRegisterOperator('bad name', 'secret1');

    expect(result.status).toBe('validation_error');
    expect(authMock.signInWithPassword).not.toHaveBeenCalled();
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it('self-registers an operator when login credentials are unknown', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    authMock.signUp.mockResolvedValue({
      data: { session: { access_token: 'token' }, user: { identities: [{ id: 'identity-1' }] } },
      error: null,
    });

    const result = await signInOrRegisterOperator('new@example.com', 'secret1');

    expect(result).toMatchObject({ status: 'signed_in', source: 'registration' });
    expect(authMock.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'secret1',
      options: { data: { account_type: 'operator' } },
    });
  });

  it('returns confirmation_required when Supabase creates a user without a session', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    authMock.signUp.mockResolvedValue({
      data: { session: null, user: { identities: [{ id: 'identity-1' }] } },
      error: null,
    });

    const result = await signInOrRegisterOperator('new@example.com', 'secret1');

    expect(result).toMatchObject({ status: 'confirmation_required', source: 'registration' });
  });

  it('returns password_mismatch for obfuscated existing users', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    authMock.signUp.mockResolvedValue({
      data: { session: null, user: { identities: [] } },
      error: null,
    });

    const result = await signInOrRegisterOperator('existing@example.com', 'secret1');

    expect(result).toMatchObject({ status: 'password_mismatch', source: 'login' });
  });

  it('does not auto-register when login fails for a non-credential error', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Rate limit exceeded' },
    });

    const result = await signInOrRegisterOperator('operator@example.com', 'secret1');

    expect(result).toMatchObject({ status: 'error', source: 'login' });
    expect(authMock.signUp).not.toHaveBeenCalled();
  });
});
