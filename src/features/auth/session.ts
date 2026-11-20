import { ApiError, setAuthToken, setUnauthorizedHandler } from '@/lib/http';
import { queryClient } from '@/lib/query-client';
import { deleteToken, readToken, writeToken } from '@/lib/secure-store';
import { resetAllStores } from '@/lib/zustand';
import { me } from '@/features/auth/api/session';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';

/**
 * The session lifecycle: starting one after a login, ending one, and restoring one on launch.
 *
 * These call `api/` directly rather than through `query/` on purpose: they run outside any
 * screen (at launch, from the HTTP client's 401 hook) and their result is the session itself,
 * not data a component renders.
 */

export async function startSession(token: string, user: User): Promise<void> {
  setAuthToken(token);
  await writeToken(token);
  useSessionStore.getState().setSignedIn(user);
}

/**
 * Ends the session and wipes everything the previous user could have left behind: the token,
 * every cached query and every Zustand store. Routing follows the session status, so the
 * signed-out group takes over on its own.
 */
export async function endSession({ keepToken = false } = {}): Promise<void> {
  setAuthToken(null);
  if (!keepToken) await deleteToken();
  queryClient.clear();
  resetAllStores();
  useSessionStore.getState().setSignedOut();
}

/**
 * Turns a stored token back into a session, while the splash screen is still up.
 *
 * No token → signed out. A token the API rejects (401, or 403 for a switched-off account) is
 * deleted. Any other failure — no connection, server down — also lands on the login screen,
 * but keeps the token: being offline at launch is not a reason to forget a valid session, and
 * the next launch tries again.
 */
export async function restoreSession(): Promise<void> {
  const token = await readToken();
  if (token === null) {
    await endSession();
    return;
  }

  setAuthToken(token);
  try {
    const { data } = await me();
    useSessionStore.getState().setSignedIn(data);
  } catch (error) {
    const rejected = error instanceof ApiError && (error.status === 401 || error.status === 403);
    await endSession({ keepToken: !rejected });
  }
}

/** A request that carried a token answered 401: the token is dead, wherever it was used. */
export function installUnauthorizedHandler(): void {
  setUnauthorizedHandler(() => {
    if (useSessionStore.getState().status === 'signedIn') void endSession();
  });
}
