package com.example.hoscore.core.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.hoscore.core.network.HoscoreSocket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

object CallAlerts {
    private const val CHANNEL_ID = "hoscore_queue"
    private val started = AtomicBoolean(false)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var lastId = 1001

    fun start(context: Context) {
        if (!started.compareAndSet(false, true)) return
        val app = context.applicationContext
        ensureChannel(app)
        scope.launch {
            HoscoreSocket.events.collect { text ->
                runCatching {
                    val json = JSONObject(text)
                    if (json.optString("type") == "queue_called") {
                        val data = json.optJSONObject("data")
                        val token = data?.optInt("tokenNumber", 0) ?: 0
                        val room = data?.optString("roomName") ?: "OPD"
                        val doctor = data?.optString("doctorName") ?: "your doctor"
                        notify(app, "Token #$token called", "Go to $room for $doctor now.")
                    }
                }
            }
        }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        mgr.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Queue calls", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "You are being called in the OPD queue"
            }
        )
    }

    private fun notify(context: Context, title: String, body: String) {
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        runCatching { NotificationManagerCompat.from(context).notify(lastId++, notification) }
    }
}
