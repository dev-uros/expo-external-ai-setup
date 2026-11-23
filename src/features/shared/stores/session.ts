import { setReportedUser } from '@/lib/sentry';
import { create } from '@/lib/zustand';
import type { User } from '@/features/shared/schemas/user';

/**
 * Who is signed in. The user lives in memory only — a cached role would outlive the server's
 * opinion of it — and is fetched fresh from `GET /auth/me` on every launch.
 *
 * `loading` holds the splash screen until the stored token has been checked; routing decides
 * between the signed-in and signed-out groups only once it is `signedIn` or `signedOut`.
 */
export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

interface SessionState {
  status: SessionStatus;
  user: User | null;
  setSignedIn: (user: User) => void;
  setSignedOut: () => void;
  /** The account changed (an edit came back); the session itself goes on. */
  replaceUser: (user: User) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  setSignedIn: (user) => {
    setReportedUser(user.id);
    set({ status: 'signedIn', user });
  },
  setSignedOut: () => {
    setReportedUser(null);
    set({ status: 'signedOut', user: null });
  },
  replaceUser: (user) => set({ user }),
}));
