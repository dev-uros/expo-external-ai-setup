import { create } from '@/lib/zustand';

/**
 * The app's one toast: a short confirmation that floats over the screen and leaves on its own.
 * It never takes layout space, so nothing jumps when it appears or goes. `ToastHost` in the root
 * layout draws it; any feature shows one with `useToastStore.getState().show(...)`.
 *
 * Only for news the user does not have to act on — an error that needs attention belongs next to
 * what failed, not in a toast that disappears.
 */
export type ToastTone = 'success' | 'info';

export interface Toast {
  /** Changes with every `show`, so the same message twice is still a new toast. */
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toast: Toast | null;
  show: (message: string, tone?: ToastTone) => void;
  hide: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toast: null,
  show: (message, tone = 'success') => set({ toast: { id: nextId++, message, tone } }),
  // Only the toast that asked to go — a newer one shown meanwhile stays.
  hide: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
}));
