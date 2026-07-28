package com.example.hoscore.core.network

import android.content.Context
import com.example.hoscore.core.auth.SessionStore
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Response
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

/**
 * Manual dependency container. Avoids annotation-processor version coupling on
 * this bleeding-edge toolchain while giving every layer a single source for the
 * session store, API, and websocket. Rebuild [api] whenever the environment
 * (prod/dev) changes.
 */
object ServiceLocator {

    lateinit var sessionStore: SessionStore
        private set

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
        explicitNulls = false
    }

    @Volatile
    private var _api: HoscoreApi? = null

    @Volatile
    private var _baseUrl: String? = null

    /** Callback fired when any request returns 401 — used to force logout. */
    var onUnauthorized: (() -> Unit)? = null

    fun init(context: Context) {
        Environment.init(context)
        sessionStore = SessionStore(context)
    }

    /** Current API client; rebuilt lazily if the base URL changed. */
    val api: HoscoreApi
        get() {
            val target = Environment.apiBaseUrl
            val existing = _api
            if (existing != null && _baseUrl == target) return existing
            return build(target).also { _api = it; _baseUrl = target }
        }

    fun webOrigin(): String {
        return Environment.apiBaseUrl.removeSuffix("/api").removeSuffix("/")
    }

    /** Force a rebuild (call after toggling the dev environment). */
    fun rebuild() {
        _api = null
        _baseUrl = null
    }

    private fun build(baseUrl: String): HoscoreApi {
        val authInterceptor = Interceptor { chain ->
            val builder = chain.request().newBuilder()
            sessionStore.token?.let { builder.addHeader("Authorization", "Bearer $it") }
            val response: Response = chain.proceed(builder.build())
            // Only treat a 401 as an expired session for authenticated endpoints. The
            // backend also returns 401 for invalid login credentials / failed OTP on the
            // /auth/* routes — those must surface inline, not trigger a forced logout.
            val isAuthRoute = chain.request().url.encodedPath.contains("/auth/")
            if (response.code == 401 && !isAuthRoute && sessionStore.token != null) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    onUnauthorized?.invoke()
                }
            }
            response
        }

        val client = OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(authInterceptor)
            .build()

        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(HoscoreApi::class.java)
    }
}
