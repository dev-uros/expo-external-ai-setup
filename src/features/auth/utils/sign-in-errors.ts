import { ApiError } from '@/lib/http';

/**
 * What a failed sign-in means, read off the HTTP status alone — never off the message, which is
 * the server's, in the app's language, and is shown as it arrives.
 *
 * - `no-account` (404): Google or Apple vouched for somebody with no account → register;
 * - `use-code` (409): the address has an account the provider may not join → sign in with a code;
 * - `rejected` (422): wrong code or untrustworthy token;
 * - `wait` (429): too many attempts or a code asked for too soon — `Retry-After` says how long;
 * - `blocked` (403): the account has been blocked;
 * - `unavailable` (503): the provider is not configured or cannot be reached;
 * - `offline` (0): no answer at all.
 */
export type SignInFailure =
  'no-account' | 'use-code' | 'rejected' | 'wait' | 'blocked' | 'unavailable' | 'offline' | 'other';

export function classifySignInError(error: unknown): SignInFailure {
  if (!(error instanceof ApiError)) return 'other';
  switch (error.status) {
    case 0:
      return 'offline';
    case 403:
      return 'blocked';
    case 404:
      return 'no-account';
    case 409:
      return 'use-code';
    case 422:
      return 'rejected';
    case 429:
      return 'wait';
    case 503:
      return 'unavailable';
    default:
      return 'other';
  }
}
