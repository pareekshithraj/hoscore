package com.example.hoscore.core.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.example.hoscore.core.model.ContextItem
import com.example.hoscore.core.model.Session
import com.example.hoscore.core.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.json.Json

/**
 * Encrypted, persistent home for the auth session. Exposes the current token +
 * contexts as observable state so the whole app reacts to login / logout /
 * context switches. Backed by EncryptedSharedPreferences (AES-256).
 */
class SessionStore(context: Context) {

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    private val prefs: SharedPreferences = securePrefs(context.applicationContext)

    private val _session = MutableStateFlow(load())
    val session: StateFlow<Session?> = _session.asStateFlow()

    val token: String? get() = _session.value?.token
    val user: User? get() = _session.value?.user
    val activeContext: ContextItem? get() = _session.value?.activeContext
    val contexts: List<ContextItem> get() = _session.value?.contexts ?: emptyList()

    fun isLoggedIn(): Boolean = !token.isNullOrEmpty()

    /** Persist a full session returned by login / verify-otp. */
    fun save(session: Session) {
        _session.value = session
        prefs.edit().putString(KEY_SESSION, json.encodeToString(Session.serializer(), session)).apply()
    }

    /** Replace just the token + active context (used by /auth/switch-context). */
    fun updateActiveContext(newToken: String, ctx: ContextItem) {
        val current = _session.value ?: return
        save(current.copy(token = newToken, activeContext = ctx))
    }

    fun clear() {
        _session.value = null
        prefs.edit().remove(KEY_SESSION).apply()
    }

    private fun load(): Session? {
        val raw = prefs.getString(KEY_SESSION, null) ?: return null
        return runCatching { json.decodeFromString(Session.serializer(), raw) }.getOrNull()
    }

    private fun securePrefs(context: Context): SharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    } catch (e: Exception) {
        Log.w("SessionStore", "Encrypted prefs unavailable, falling back: ${e.message}")
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private companion object {
        const val PREFS_NAME = "hoscore_secure_session"
        const val KEY_SESSION = "session_json"
    }
}
