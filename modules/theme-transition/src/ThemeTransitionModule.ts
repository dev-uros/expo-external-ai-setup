import { NativeModule, requireNativeModule } from 'expo';

declare class ThemeTransitionModule extends NativeModule {
  /**
   * Makes a scheme set with `Appearance.setColorScheme` reach every native view (Android; a no-op
   * on iOS). `system` follows the phone.
   */
  applyColorScheme(scheme: 'light' | 'dark' | 'system'): Promise<void>;
  /** Covers the window with a snapshot of how it looks now. */
  freeze(): Promise<void>;
  /** Fades the snapshot out over `durationMs` and removes it. */
  reveal(durationMs: number): Promise<void>;
}

export default requireNativeModule<ThemeTransitionModule>('ThemeTransition');
