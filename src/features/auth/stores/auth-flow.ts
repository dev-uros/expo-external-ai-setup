import type { AppleProof } from '@/features/auth/api/auth';
import type { RegistrationProfile } from '@/features/auth/schemas/sign-in';
import type { AvatarAsset } from '@/features/shared/schemas/avatar';
import { create } from '@/lib/zustand';

/**
 * What the sign-in screens hand each other: which address the code went to and why, what the
 * registration form held, and — after Google or Apple answered 404 — the proof to register with.
 * Memory only: nothing here should outlive the app or a sign-out.
 */

export type ProviderProof =
  { provider: 'google'; idToken: string } | ({ provider: 'apple' } & AppleProof);

export interface ProviderRegistration {
  proof: ProviderProof;
  /** Read off the provider; shown, not editable — the server reads it from the token anyway. */
  email: string;
  givenName: string | null;
  familyName: string | null;
}

export type CodePurpose =
  | { kind: 'sign-in' }
  | { kind: 'register'; profile: RegistrationProfile; avatar: AvatarAsset | null };

interface AuthFlowState {
  email: string;
  purpose: CodePurpose;
  /** When another code may be asked for (epoch ms). */
  resendAt: number;
  provider: ProviderRegistration | null;
  /** The address typed on the welcome screen, carried to registration. */
  setEmail: (email: string) => void;
  codeSent: (email: string, purpose: CodePurpose, retryAfterSeconds: number) => void;
  setResendAt: (retryAfterSeconds: number) => void;
  startProviderRegistration: (registration: ProviderRegistration) => void;
  clearProvider: () => void;
}

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  email: '',
  purpose: { kind: 'sign-in' },
  resendAt: 0,
  provider: null,
  setEmail: (email) => set({ email }),
  codeSent: (email, purpose, retryAfterSeconds) =>
    set({ email, purpose, resendAt: Date.now() + retryAfterSeconds * 1000 }),
  setResendAt: (retryAfterSeconds) => set({ resendAt: Date.now() + retryAfterSeconds * 1000 }),
  startProviderRegistration: (registration) => set({ provider: registration }),
  clearProvider: () => set({ provider: null }),
}));
