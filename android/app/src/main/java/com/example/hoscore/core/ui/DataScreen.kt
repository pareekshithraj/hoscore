package com.example.hoscore.core.ui

import androidx.compose.animation.Crossfade
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.ui.components.ErrorState
import com.example.hoscore.core.ui.components.LoadingSkeleton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

/**
 * Renders the standard loading → error → content lifecycle for a [ListViewModel].
 * Guarantees every data screen ships with skeleton + retry states.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T> DataScreen(
    vm: ListViewModel<T>,
    modifier: Modifier = Modifier,
    skeletonRows: Int = 5,
    content: @Composable (T) -> Unit,
) {
    LaunchedEffect(Unit) { vm.loadOnce() }
    val state by vm.state.collectAsState()
    var isManualRefreshing by remember { mutableStateOf(false) }

    LaunchedEffect(state) {
        if (state !is Resource.Loading) {
            isManualRefreshing = false
        }
    }

    PullToRefreshBox(
        isRefreshing = isManualRefreshing,
        onRefresh = {
            isManualRefreshing = true
            vm.refresh()
        },
        modifier = modifier
    ) {
        Crossfade(targetState = state, label = "dataState") { currentState ->
            when (currentState) {
                is Resource.Loading -> LoadingSkeleton(rows = skeletonRows)
                is Resource.Error -> ErrorState(message = currentState.message, onRetry = { vm.refresh() })
                is Resource.Success<T> -> content(currentState.data)
            }
        }
    }
}
