package com.example.hoscore.core.network

import android.content.Context
import com.example.hoscore.BuildConfig

/**
 * Holds the prod / local-dev endpoint choice. Persisted so the login screen's
 * "Local Dev Environment" toggle survives restarts. Changing it rebuilds the
 * Retrofit + WebSocket stack via [ServiceLocator].
 */
object Environment {
    private const val PREFS = "hoscore_env"
    private const val KEY_DEV = "use_dev"

    @Volatile
    var useDev: Boolean = false
        private set

    fun init(context: Context) {
        useDev = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_DEV, false)
    }

    fun setUseDev(context: Context, value: Boolean) {
        useDev = value
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_DEV, value).apply()
    }

    val apiBaseUrl: String get() = if (useDev) BuildConfig.DEV_API_BASE else BuildConfig.PROD_API_BASE
    val wsUrl: String get() = if (useDev) BuildConfig.DEV_WS_URL else BuildConfig.PROD_WS_URL
}
