import ThemeTransition from '../../modules/theme-transition/src/ThemeTransitionModule';

/**
 * Our own native module (`modules/theme-transition`, Swift + Kotlin), wrapped here like any other
 * native dependency.
 *
 * Changing the theme repaints native views at once and React Native views on their next render;
 * the cross-fade hides the frames in between: `freeze` covers the window with a snapshot, the
 * theme changes underneath, `reveal` fades the snapshot out. `applyColorScheme` makes the new
 * scheme reach every native view on Android, where `Appearance.setColorScheme` alone does not.
 */

/** Fire and forget: it runs on the main thread, ahead of the next frame React Native draws. */
export function applyColorScheme(scheme: 'light' | 'dark' | 'system'): void {
  void ThemeTransition.applyColorScheme(scheme);
}

/** Runs `change` under a cross-fade: snapshot, change, let it paint, fade the snapshot out. */
export async function crossFade(change: () => void, durationMs = 250): Promise<void> {
  await ThemeTransition.freeze();
  try {
    change();
    await afterPaint();
  } finally {
    await ThemeTransition.reveal(durationMs);
  }
}

/**
 * Resolves once React has committed the change and the native views have drawn it: two frames
 * for React Native, and a little more for Android's configuration change to reach Compose.
 */
function afterPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 80)))
  );
}
