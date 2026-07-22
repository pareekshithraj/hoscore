package com.example.hoscore.core.common

/**
 * Lightweight wrapper for any async data pull. Every ViewModel exposes state
 * through this so screens can render loading / success / error uniformly.
 */
sealed interface Resource<out T> {
    data object Loading : Resource<Nothing>
    data class Success<T>(val data: T) : Resource<T>
    data class Error(val message: String, val code: Int? = null) : Resource<Nothing>
}
