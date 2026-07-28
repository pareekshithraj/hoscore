package com.example.hoscore.core.network

import android.content.Context
import com.example.hoscore.BuildConfig

/**
 * Holds the prod / local-dev endpoint choice. Persisted so the login screen's
 * environment toggle survives restarts.
 */
object Environment {
    private const val PREFS = "hoscore_env"
    private const val KEY_DEV = "use_dev"

    @Volatile
    var useDev: Boolean = BuildConfig.DEBUG
        private set

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        // Default to the dev endpoint (10.0.2.2:5000) only for debug builds. Release
        // builds must hit prod (api.hoscore.in) so the shipped APK works on real devices.
        useDev = if (prefs.contains(KEY_DEV)) {
            prefs.getBoolean(KEY_DEV, BuildConfig.DEBUG)
        } else {
            BuildConfig.DEBUG
        }
    }

    fun setUseDev(context: Context, value: Boolean) {
        useDev = value
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_DEV, value).apply()
    }

    val apiBaseUrl: String get() = if (useDev) BuildConfig.DEV_API_BASE else BuildConfig.PROD_API_BASE
    val wsUrl: String get() = if (useDev) BuildConfig.DEV_WS_URL else BuildConfig.PROD_WS_URL
}
