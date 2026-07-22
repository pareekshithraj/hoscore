package com.example.hoscore.core.network

import com.example.hoscore.core.common.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException

/**
 * Runs a suspend API block on IO and maps success / HTTP error / network error
 * into a [Resource]. Keeps every ViewModel free of try/catch boilerplate.
 */
suspend fun <T> apiCall(block: suspend HoscoreApi.() -> T): Resource<T> = withContext(Dispatchers.IO) {
    try {
        Resource.Success(ServiceLocator.api.block())
    } catch (e: HttpException) {
        val msg = when (e.code()) {
            401 -> "Session expired. Please sign in again."
            403 -> "You don't have access to this."
            404 -> "Not found."
            in 500..599 -> "Server error. Please try again."
            else -> "Request failed (${e.code()})."
        }
        Resource.Error(msg, e.code())
    } catch (e: IOException) {
        Resource.Error("Network error. Check your connection.")
    } catch (e: Exception) {
        Resource.Error(e.message ?: "Something went wrong.")
    }
}
