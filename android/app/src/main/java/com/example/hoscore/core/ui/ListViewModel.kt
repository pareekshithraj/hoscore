package com.example.hoscore.core.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.HoscoreApi
import com.example.hoscore.core.network.apiCall
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Reusable ViewModel for any read-mostly screen backed by a single GET. Screens
 * supply the fetch lambda; this handles loading / error / refresh state so each
 * list screen stays declarative.
 */
open class ListViewModel<T>(
    private val fetch: suspend HoscoreApi.() -> T,
) : ViewModel() {

    private val _state = MutableStateFlow<Resource<T>>(Resource.Loading)
    val state: StateFlow<Resource<T>> = _state.asStateFlow()

    private var loaded = false

    fun loadOnce() {
        if (loaded) return
        loaded = true
        refresh()
    }

    fun refresh() {
        _state.value = Resource.Loading
        viewModelScope.launch { _state.value = apiCall(fetch) }
    }

    /** Fire a mutation then refresh the list. */
    fun mutate(block: suspend HoscoreApi.() -> Unit) {
        viewModelScope.launch {
            apiCall(block)
            _state.value = apiCall(fetch)
        }
    }
}
