package expo.modules.themetransition

import android.content.res.Configuration
import android.content.res.Resources
import android.graphics.Bitmap
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.ViewGroup
import android.widget.ImageView
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Changing the app's theme on Android: making it reach every view, and cross-fading to it.
 *
 * `applyColorScheme` — React Native's `Appearance.setColorScheme` switches AppCompat's night mode,
 * but the activity handles `uiMode` itself (`android:configChanges`), so it is not recreated and
 * the new mode reaches only the activity's own resources. React Native resolves platform colors,
 * and `@expo/ui` Compose views build their theme, from the application's resources, and no view
 * is told the configuration changed — text stays in the old theme's colors. This writes the night
 * mode into both resources and dispatches the change down the view tree.
 *
 * Cross-fade —
 *
 * Changing the color scheme repaints native views (Compose, system colors) at once, while React
 * Native views repaint on their next render — for a frame or two the screen is a mix of both
 * themes. `freeze` covers the window with a picture of how it looks now; the theme changes
 * underneath; `reveal` fades the picture out once everything below has been redrawn.
 *
 * The picture is taken with `PixelCopy`, which copies what the compositor shows — hardware
 * bitmaps and surfaces included, which `View.draw` cannot render.
 */
class ThemeTransitionModule : Module() {
  private var cover: ImageView? = null

  override fun definition() = ModuleDefinition {
    Name("ThemeTransition")

    AsyncFunction("applyColorScheme") { scheme: String ->
      val activity = appContext.currentActivity ?: return@AsyncFunction
      val night = when (scheme) {
        "dark" -> Configuration.UI_MODE_NIGHT_YES
        "light" -> Configuration.UI_MODE_NIGHT_NO
        // Following the system: whatever the phone itself is set to.
        else -> Resources.getSystem().configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
      }

      listOf(activity.resources, activity.applicationContext.resources).distinct().forEach { res ->
        val config = Configuration(res.configuration)
        config.uiMode = (config.uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or night
        @Suppress("DEPRECATION")
        res.updateConfiguration(config, res.displayMetrics)
      }
      activity.window.decorView.dispatchConfigurationChanged(Configuration(activity.resources.configuration))
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("freeze") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        promise.resolve(null)
        return@AsyncFunction
      }
      val window = activity.window
      val decor = window.decorView as ViewGroup
      if (decor.width == 0 || decor.height == 0) {
        promise.resolve(null)
        return@AsyncFunction
      }

      val bitmap = Bitmap.createBitmap(decor.width, decor.height, Bitmap.Config.ARGB_8888)
      PixelCopy.request(window, bitmap, { result ->
        if (result == PixelCopy.SUCCESS) {
          cover?.let { decor.removeView(it) }
          val picture = ImageView(activity).apply {
            setImageBitmap(bitmap)
            scaleType = ImageView.ScaleType.FIT_XY
            // Swallows touches meant for the half-changed screen underneath.
            isClickable = true
            elevation = Float.MAX_VALUE
          }
          decor.addView(
            picture,
            ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
          )
          cover = picture
        }
        promise.resolve(null)
      }, Handler(Looper.getMainLooper()))
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("reveal") { durationMs: Double ->
      val picture = cover ?: return@AsyncFunction
      cover = null
      picture.animate()
        .alpha(0f)
        .setDuration(durationMs.toLong())
        .withEndAction { (picture.parent as? ViewGroup)?.removeView(picture) }
        .start()
    }.runOnQueue(Queues.MAIN)
  }
}
