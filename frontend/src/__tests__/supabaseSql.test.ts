/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function readRepoFile(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../../../${relativePath}`, import.meta.url)), 'utf8');
}

describe('Supabase SQL contract', () => {
  const schema = readRepoFile('supabase/schema.sql');
  const policies = readRepoFile('supabase/policies.sql');
  const migration004 = readRepoFile('supabase/migrations/004_managed_otp_delivery_mode.sql');
  const migration005 = readRepoFile('supabase/migrations/005_wallet_only_default.sql');

  it('defaults mailbox delivery to wallet_only everywhere new records can be created', () => {
    for (const sql of [schema, migration004, migration005]) {
      expect(sql).toContain("default 'wallet_only'");
      expect(sql).toContain("'wallet_only', 'managed_otp', 'external_mailbox', 'customer_mailbox'");
      expect(sql).not.toContain("default 'managed_otp'");
    }
  });

  it('keeps anonymous handover lookup on the canonical RPC and grants anon execute only on that RPC', () => {
    expect(policies).toContain('create or replace function public.get_handover_by_code(p_code text)');
    expect(policies).toContain('security definer');
    expect(policies).toContain('grant execute on function public.get_handover_by_code(text) to anon;');
    expect(policies).toContain('grant execute on function public.generate_handover_code() to authenticated;');
  });

  it('hides account login fields when delivery_mode is wallet_only', () => {
    expect(policies).toContain("coalesce(v_mailbox.delivery_mode, 'wallet_only')");
    expect(policies).toMatch(/'mailbox_email',\s+case[\s\S]+wallet_only[\s\S]+then null/);
    expect(policies).toMatch(/'mailbox_password',\s+case[\s\S]+wallet_only[\s\S]+<> 'wallet_only'[\s\S]+customer_can_login/);
    expect(policies).toMatch(/'mailbox_login_url',\s+case[\s\S]+<> 'wallet_only'[\s\S]+customer_can_login/);
    expect(policies).toMatch(/'mailbox_username',\s+case[\s\S]+<> 'wallet_only'[\s\S]+customer_can_login/);
    expect(policies).toMatch(/'customer_can_login',\s+case[\s\S]+wallet_only[\s\S]+then false/);
    expect(policies).not.toContain("coalesce(v_mailbox.delivery_mode, 'managed_otp')");
  });

  it('ships an upgrade migration that replaces the handover RPC for existing databases', () => {
    expect(migration005).toContain('create or replace function public.get_handover_by_code(p_code text)');
    expect(migration005).toContain("'mailbox_email',    case");
    expect(migration005).toContain("when coalesce(v_mailbox.delivery_mode, 'wallet_only') = 'wallet_only' then null");
    expect(migration005).toContain('grant execute on function public.get_handover_by_code(text) to anon;');
  });
});
