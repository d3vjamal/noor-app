package com.muntakhab

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.text.format.DateFormat
import android.widget.RemoteViews
import org.json.JSONArray
import java.util.Date

// Home-screen widget: the next prayer and four shortcuts into the app. The app writes the upcoming
// prayer times to SharedPreferences (see WidgetModule); the widget picks the first one still ahead.
class PrayerWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) {
      manager.updateAppWidget(id, build(context))
    }
  }

  companion object {
    const val PREFS = "noor_widget"
    const val KEY = "schedule"

    private fun link(context: Context, code: Int, path: String): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("noor://$path"), context, MainActivity::class.java)
      return PendingIntent.getActivity(
          context, code, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun build(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.widget_prayer)
      var name = context.getString(R.string.app_name)
      var time = ""
      try {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
        if (raw != null) {
          val arr = JSONArray(raw)
          val now = System.currentTimeMillis()
          for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            if (o.getLong("t") > now) {
              name = o.getString("n")
              time = DateFormat.getTimeFormat(context).format(Date(o.getLong("t")))
              break
            }
          }
        }
      } catch (_: Exception) {}
      views.setTextViewText(R.id.widget_name, name)
      views.setTextViewText(R.id.widget_time, time)
      views.setOnClickPendingIntent(R.id.widget_root, link(context, 0, "salat"))
      views.setOnClickPendingIntent(R.id.btn_salat, link(context, 1, "salat"))
      views.setOnClickPendingIntent(R.id.btn_library, link(context, 2, "library"))
      views.setOnClickPendingIntent(R.id.btn_dua, link(context, 3, "dua"))
      views.setOnClickPendingIntent(R.id.btn_tools, link(context, 4, "tools"))
      return views
    }

    fun refresh(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerWidgetProvider::class.java))
      for (id in ids) {
        manager.updateAppWidget(id, build(context))
      }
    }
  }
}
