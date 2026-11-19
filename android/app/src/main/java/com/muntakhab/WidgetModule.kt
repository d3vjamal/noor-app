package com.muntakhab

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

// Lets JS hand the widget its schedule: a JSON array of {n: name, t: epoch millis}.
class WidgetModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "NoorWidget"

  @ReactMethod
  fun update(scheduleJson: String) {
    ctx.getSharedPreferences(PrayerWidgetProvider.PREFS, android.content.Context.MODE_PRIVATE)
        .edit()
        .putString(PrayerWidgetProvider.KEY, scheduleJson)
        .apply()
    PrayerWidgetProvider.refresh(ctx)
  }
}

class WidgetPackage : ReactPackage {
  override fun createNativeModules(c: ReactApplicationContext) = listOf(WidgetModule(c))
  override fun createViewManagers(c: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
