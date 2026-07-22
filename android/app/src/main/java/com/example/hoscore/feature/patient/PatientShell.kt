package com.example.hoscore.feature.patient

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.GridView
import androidx.compose.material.icons.rounded.Home
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.hoscore.core.ui.components.NavTab
import com.example.hoscore.core.ui.components.PillBottomBar

@Composable
fun PatientShell(
    onLogout: () -> Unit,
    onSwitchContext: () -> Unit,
    darkMode: Boolean,
    onToggleDark: () -> Unit,
    canSwitch: Boolean,
) {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    val tabs = remember {
        listOf(
            NavTab("Home", Icons.Rounded.Home),
            NavTab("Visits", Icons.Rounded.CalendarMonth),
            NavTab("Records", Icons.Rounded.Description),
            NavTab("More", Icons.Rounded.GridView),
        )
    }

    Box(Modifier.fillMaxSize()) {
        Crossfade(targetState = tab, modifier = Modifier.fillMaxSize().padding(bottom = 78.dp), label = "patientTab") { t ->
            when (t) {
                0 -> PatientDashboardScreen(
                    darkMode = darkMode,
                    onToggleDark = onToggleDark,
                    onSwitchContext = onSwitchContext,
                    onLogout = onLogout,
                    canSwitch = canSwitch,
                    onOpenTab = { tab = it },
                )
                1 -> PatientAppointmentsScreen()
                2 -> PatientRecordsScreen()
                else -> PatientMoreScreen(onLogout = onLogout)
            }
        }
        PillBottomBar(
            tabs = tabs,
            selected = tab,
            onSelect = { tab = it },
            modifier = Modifier.align(Alignment.BottomCenter),
        )
    }
}
