package com.example.hoscore.feature.patient

import androidx.activity.compose.BackHandler
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.hoscore.core.ui.components.NavTab
import com.example.hoscore.core.ui.components.PillBottomBar

/** Full-screen sub-flows layered above the tabbed patient portal. */
private sealed interface PatientOverlay {
    data object Find : PatientOverlay
    data class Book(val hospitalId: String, val hospitalName: String) : PatientOverlay
}

@Composable
fun PatientShell(
    onLogout: () -> Unit,
    onSwitchContext: () -> Unit,
    canSwitch: Boolean,
) {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var overlay by remember { mutableStateOf<PatientOverlay?>(null) }
    val tabs = remember {
        listOf(
            NavTab("Home", Icons.Rounded.Home),
            NavTab("Visits", Icons.Rounded.CalendarMonth),
            NavTab("Records", Icons.Rounded.Description),
            NavTab("More", Icons.Rounded.GridView),
        )
    }

    // Booking / find-hospital sub-flow takes over the whole screen when active.
    if (overlay != null) {
        BackHandler { overlay = if (overlay is PatientOverlay.Book) PatientOverlay.Find else null }
        Box(Modifier.fillMaxSize()) {
            when (val o = overlay) {
                is PatientOverlay.Find -> FindHospitalsScreen(
                    onBack = { overlay = null },
                    onPick = { id, name -> overlay = PatientOverlay.Book(id, name) },
                )
                is PatientOverlay.Book -> BookAppointmentScreen(
                    hospitalId = o.hospitalId,
                    hospitalName = o.hospitalName,
                    onBack = { overlay = PatientOverlay.Find },
                    onBooked = { overlay = null; tab = 1 },
                )
                null -> Unit
            }
        }
        return
    }

    Box(Modifier.fillMaxSize()) {
        Crossfade(targetState = tab, modifier = Modifier.fillMaxSize().padding(bottom = 64.dp), label = "patientTab") { t ->
            when (t) {
                0 -> PatientDashboardScreen(
                    onSwitchContext = onSwitchContext,
                    onLogout = onLogout,
                    canSwitch = canSwitch,
                    onOpenTab = { tab = it },
                    onFindHospitals = { overlay = PatientOverlay.Find },
                )
                1 -> PatientAppointmentsScreen(onBook = { overlay = PatientOverlay.Find })
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
