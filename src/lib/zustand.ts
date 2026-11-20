import { create as createZustandStore, type StateCreator } from 'zustand';

/**
 * Zustand, configured for this app: every store made through `create` registers a reset to
 * its initial state, so signing out can wipe all client state in one call. A store created
 * from the bare package would survive a sign-out and leak one user's state to the next.
 */

const resets = new Set<() => void>();

export function create<T>(initializer: StateCreator<T>) {
  const store = createZustandStore<T>()(initializer);
  const initialState = store.getInitialState();
  resets.add(() => store.setState(initialState, true));
  return store;
}

export function resetAllStores(): void {
  resets.forEach((reset) => reset());
}

/**
 * A store that belongs to the device, not to whoever is signed in — the theme, for one. It is
 * not registered for the sign-out reset: the next person on this phone keeps the same setting.
 * Anything about a user goes through `create`.
 */
export function createDeviceStore<T>(initializer: StateCreator<T>) {
  return createZustandStore<T>()(initializer);
}
