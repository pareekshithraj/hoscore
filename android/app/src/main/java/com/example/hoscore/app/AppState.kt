package com.example.hoscore.app

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * Process-wide UI preferences that sit above the composition (dark mode). Kept
 * tiny and observable so [MainActivity] can recompose the theme instantly.
 */
class AppState(context: Context) {
    private val prefs = context.getSharedPreferences("hoscore_app", Context.MODE_PRIVATE)

    var darkMode by mutableStateOf(prefs.getBoolean(KEY_DARK, false))
        private set

    fun toggleDark() {
        darkMode = !darkMode
        prefs.edit().putBoolean(KEY_DARK, darkMode).apply()
    }

    private companion object {
        const val KEY_DARK = "dark_mode"
    }
}
