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

/**
 * Renders the standard loading → error → content lifecycle for a [ListViewModel].
 * Guarantees every data screen ships with skeleton + retry states.
 */
@Composable
fun <T> DataScreen(
    vm: ListViewModel<T>,
    modifier: Modifier = Modifier,
    skeletonRows: Int = 5,
    content: @Composable (T) -> Unit,
) {
    LaunchedEffect(Unit) { vm.loadOnce() }
    val state by vm.state.collectAsState()
    Crossfade(targetState = state::class, modifier = modifier, label = "dataState") {
        when (val s = state) {
            is Resource.Loading -> LoadingSkeleton(rows = skeletonRows)
            is Resource.Error -> ErrorState(message = s.message, onRetry = { vm.refresh() })
            is Resource.Success -> content(s.data)
        }
    }
}
