import { isClerkAPIResponseError } from '@clerk/expo';
import { t } from '../i18n/strings';

export type AuthMode = 'signIn' | 'signUp';

/**
 * Map a Clerk error to a friendly Arabic message. Known error codes are
 * translated; anything unrecognized falls back to a generic message so raw
 * (English) backend strings never surface to the user.
 */
export function clerkErrorMessage(error: unknown, mode: AuthMode): string {
  if (isClerkAPIResponseError(error)) {
    const code = error.errors?.[0]?.code;

    if (mode === 'signIn' && (code === 'form_identifier_not_found' || code === 'form_password_incorrect')) {
      return t.auth.invalidCredentials;
    }
    if (mode === 'signUp' && code === 'form_identifier_exists') {
      return t.auth.emailInUse;
    }
    if (code === 'form_password_length_too_short') {
      return t.auth.passwordShort;
    }
    if (code === 'form_password_pwned') {
      return t.auth.passwordWeak;
    }
  }
  return t.auth.genericError;
}
