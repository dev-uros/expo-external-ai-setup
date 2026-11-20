import ExpoModulesCore
import UIKit

/// A cross-fade for changing the app's theme.
///
/// Changing the color scheme repaints native views (UIKit, SwiftUI, system colors) at once, while
/// React Native views repaint on their next render — for a frame or two the screen is a mix of
/// both themes. `freeze` covers the window with a snapshot of how it looks now; the theme changes
/// underneath; `reveal` fades the snapshot out once everything below has been redrawn.
public class ThemeTransitionModule: Module {
  private var cover: UIView?

  public func definition() -> ModuleDefinition {
    Name("ThemeTransition")

    /// Nothing to do on iOS: React Native sets the window's `overrideUserInterfaceStyle`, and
    /// system colors, UIKit and SwiftUI all follow it on their own. Here for the shared API.
    AsyncFunction("applyColorScheme") { (_: String) in }

    AsyncFunction("freeze") {
      guard let window = Self.keyWindow(),
        let snapshot = window.snapshotView(afterScreenUpdates: false)
      else { return }

      self.cover?.removeFromSuperview()
      snapshot.frame = window.bounds
      // Swallows touches meant for the half-changed screen underneath.
      snapshot.isUserInteractionEnabled = true
      window.addSubview(snapshot)
      self.cover = snapshot
    }.runOnQueue(.main)

    AsyncFunction("reveal") { (durationMs: Double) in
      guard let cover = self.cover else { return }
      self.cover = nil

      UIView.animate(
        withDuration: durationMs / 1000,
        delay: 0,
        options: [.curveEaseInOut],
        animations: { cover.alpha = 0 },
        completion: { _ in cover.removeFromSuperview() }
      )
    }.runOnQueue(.main)
  }

  private static func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }
}
