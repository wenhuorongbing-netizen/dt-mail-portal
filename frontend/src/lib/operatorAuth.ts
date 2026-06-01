import { supabase } from './supabase';

export type OperatorAuthSource = 'login' | 'registration';

export type OperatorAuthStatus =
  | 'signed_in'
  | 'confirmation_required'
  | 'password_mismatch'
  | 'validation_error'
  | 'error';

export interface OperatorAuthResult {
  status: OperatorAuthStatus;
  source?: OperatorAuthSource;
  message: string;
}

interface AuthLikeError {
  message?: string;
  status?: number;
  code?: string;
}

export const OPERATOR_AUTH_DOMAIN =
  import.meta.env.VITE_OPERATOR_AUTH_DOMAIN ?? 'operators.localhost';

const configuredMinPasswordLength = Number(import.meta.env.VITE_OPERATOR_MIN_PASSWORD_LENGTH ?? 6);
export const OPERATOR_MIN_PASSWORD_LENGTH =
  Number.isFinite(configuredMinPasswordLength) && configuredMinPasswordLength >= 3
    ? configuredMinPasswordLength
    : 6;

const SHORT_LOGIN_PATTERN = /^[a-z0-9._-]+$/;

export function normalizeOperatorLogin(rawIdentifier: string, domain = OPERATOR_AUTH_DOMAIN) {
  const identifier = rawIdentifier.trim().toLowerCase();
  if (!identifier) return '';
  if (identifier.includes('@')) return identifier;
  return `${identifier}@${domain.trim().toLowerCase()}`;
}

function isValidOperatorIdentifier(rawIdentifier: string) {
  const identifier = rawIdentifier.trim().toLowerCase();
  if (!identifier) return false;
  if (identifier.includes('@')) return true;
  return SHORT_LOGIN_PATTERN.test(identifier);
}

function getErrorText(error: AuthLikeError | null | undefined) {
  return `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
}

function isInvalidLogin(error: AuthLikeError | null | undefined) {
  const text = getErrorText(error);
  return (
    text.includes('invalid login credentials') ||
    text.includes('invalid_credentials') ||
    text.includes('user not found')
  );
}

function isEmailConfirmationRequired(error: AuthLikeError | null | undefined) {
  const text = getErrorText(error);
  return text.includes('email not confirmed') || text.includes('email_not_confirmed');
}

function isAlreadyRegistered(error: AuthLikeError | null | undefined) {
  const text = getErrorText(error);
  return (
    text.includes('already registered') ||
    text.includes('already been registered') ||
    text.includes('user already registered')
  );
}

function isObfuscatedExistingUser(identities: unknown) {
  return Array.isArray(identities) && identities.length === 0;
}

function authErrorMessage(error: AuthLikeError | null | undefined, fallback: string) {
  return error?.message ?? fallback;
}

export async function signInOrRegisterOperator(
  rawIdentifier: string,
  password: string,
): Promise<OperatorAuthResult> {
  const email = normalizeOperatorLogin(rawIdentifier);

  if (!email) {
    return { status: 'validation_error', message: '请输入操作员账号。' };
  }

  if (!isValidOperatorIdentifier(rawIdentifier)) {
    return {
      status: 'validation_error',
      message: '账号只能包含字母、数字、点、下划线或短横线；不需要输入 @ 和域名。',
    };
  }

  if (password.length < OPERATOR_MIN_PASSWORD_LENGTH) {
    return { status: 'validation_error', message: `密码至少需要 ${OPERATOR_MIN_PASSWORD_LENGTH} 位。` };
  }

  const signIn = await supabase.auth.signInWithPassword({ email, password });

  if (!signIn.error) {
    return {
      status: 'signed_in',
      source: 'login',
      message: '已登录，正在进入操作台。',
    };
  }

  if (isEmailConfirmationRequired(signIn.error)) {
    return {
      status: 'confirmation_required',
      source: 'login',
      message: '账号已注册，但邮箱尚未确认。请先完成 Supabase 发送的确认邮件，再返回登录。',
    };
  }

  if (!isInvalidLogin(signIn.error)) {
    return {
      status: 'error',
      source: 'login',
      message: authErrorMessage(signIn.error, '登录失败，请稍后重试。'),
    };
  }

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        account_type: 'operator',
      },
    },
  });

  if (signUp.error) {
    if (isAlreadyRegistered(signUp.error)) {
      return {
        status: 'password_mismatch',
        source: 'login',
        message: '账号已存在，但密码不正确。请使用原密码登录，或在 Supabase 后台重置密码。',
      };
    }

    return {
      status: 'error',
      source: 'registration',
      message: authErrorMessage(signUp.error, '注册失败，请检查账号密码后重试。'),
    };
  }

  if (isObfuscatedExistingUser(signUp.data.user?.identities)) {
    return {
      status: 'password_mismatch',
      source: 'login',
      message: '账号已存在，但密码不正确。请使用原密码登录，或在 Supabase 后台重置密码。',
    };
  }

  if (signUp.data.session) {
    return {
      status: 'signed_in',
      source: 'registration',
      message: '操作员账号已创建，正在进入操作台。',
    };
  }

  return {
    status: 'confirmation_required',
    source: 'registration',
    message: '操作员账号已创建。请先完成 Supabase 发送的确认邮件，再返回登录。',
  };
}
