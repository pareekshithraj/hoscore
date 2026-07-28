package com.example.hoscore.core.network

import com.example.hoscore.core.common.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import retrofit2.HttpException
import java.io.IOException

/**
 * Runs a suspend API block on IO and maps success / HTTP error / network error
 * into a [Resource]. Parses exact server error strings from error JSON.
 */
suspend fun <T> apiCall(block: suspend HoscoreApi.() -> T): Resource<T> = withContext(Dispatchers.IO) {
    try {
        Resource.Success(ServiceLocator.api.block())
    } catch (e: HttpException) {
        val serverError = try {
            val body = e.response()?.errorBody()?.string()
            if (!body.isNullOrBlank()) {
                val json = JSONObject(body)
                json.optString("error").ifBlank { json.optString("message") }
            } else null
        } catch (_: Exception) {
            null
        }

        val msg = if (!serverError.isNullOrBlank()) {
            serverError
        } else {
            when (e.code()) {
                401 -> "Invalid credentials or session expired."
                403 -> "You don't have access to this feature."
                404 -> "Resource not found."
                in 500..599 -> "Server error. Please try again."
                else -> "Request failed (${e.code()})."
            }
        }
        Resource.Error(msg, e.code())
    } catch (e: IOException) {
        Resource.Error("Network error. Check your server connection.")
    } catch (e: Exception) {
        Resource.Error(e.message ?: "Something went wrong.")
    }
}
