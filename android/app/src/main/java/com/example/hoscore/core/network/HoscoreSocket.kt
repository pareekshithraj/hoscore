package com.example.hoscore.core.network

import android.util.Log
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit

/**
 * Thin realtime channel. Emits raw server messages; screens (queue, stats)
 * collect [events] and refresh. Reconnects with linear backoff on drop.
 */
object HoscoreSocket {
    private const val TAG = "HoscoreSocket"

    private val client = OkHttpClient.Builder()
        .pingInterval(25, TimeUnit.SECONDS)
        .build()

    private var socket: WebSocket? = null
    private var closedByUser = false

    private val _events = MutableSharedFlow<String>(extraBufferCapacity = 32)
    val events: SharedFlow<String> = _events

    fun connect(token: String) {
        closedByUser = false
        socket?.cancel()
        val url = "${Environment.wsUrl}?token=$token"
        val request = Request.Builder().url(url).build()
        socket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                _events.tryEmit(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.w(TAG, "socket failure: ${t.message}")
            }
        })
    }

    fun disconnect() {
        closedByUser = true
        socket?.close(1000, "client disconnect")
        socket = null
    }
}
