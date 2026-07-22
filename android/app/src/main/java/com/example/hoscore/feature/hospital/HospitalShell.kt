package com.example.hoscore.feature.hospital

import androidx.activity.compose.BackHandler
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.GridView
import androidx.compose.material.icons.rounded.People
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

@Composable
fun HospitalShell(
    onLogout: () -> Unit,
    onSwitchContext: () -> Unit,
    darkMode: Boolean,
    onToggleDark: () -> Unit,
    canSwitch: Boolean,
) {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var subScreen by remember { mutableStateOf<HospitalDest?>(null) }

    val tabs = remember {
        listOf(
            NavTab("Dashboard", Icons.Rounded.Dashboard),
            NavTab("Queue", Icons.Rounded.Groups),
            NavTab("Patients", Icons.Rounded.People),
            NavTab("More", Icons.Rounded.GridView),
        )
    }

    // Sub-screen overlay from More grid with native back handling
    if (subScreen != null) {
        val closeSub = { subScreen = null }
        BackHandler { closeSub() }
        Box(Modifier.fillMaxSize()) {
            when (subScreen) {
                HospitalDest.ROOMS -> RoomsScreen()
                HospitalDest.ADMISSIONS -> AdmissionsScreen()
                HospitalDest.PRESCRIPTIONS -> PrescriptionsScreen(onBack = closeSub)
                HospitalDest.LABS -> LabOrdersScreen(onBack = closeSub)
                HospitalDest.VITALS -> VitalsScreen(onBack = closeSub)
                HospitalDest.BILLING -> BillingScreen(onBack = closeSub)
                HospitalDest.DOCTORS -> DoctorsScreen(onBack = closeSub)
                HospitalDest.STAFF -> StaffScreen(onBack = closeSub)
                HospitalDest.INVENTORY -> InventoryScreen(onBack = closeSub)
                HospitalDest.EXPENSES -> ExpensesScreen(onBack = closeSub)
                HospitalDest.CLAIMS -> ClaimsScreen(onBack = closeSub)
                HospitalDest.SHIFTS -> ShiftsScreen(onBack = closeSub)
                HospitalDest.NOTICES -> NoticesScreen(onBack = closeSub)
                HospitalDest.LEAVES -> LeavesScreen(onBack = closeSub)
                HospitalDest.FEEDBACK -> FeedbackScreen(onBack = closeSub)
                HospitalDest.AUDIT_LOGS -> AuditLogsScreen(onBack = closeSub)
                null -> Unit
            }
        }
        return
    }

    Box(Modifier.fillMaxSize()) {
        Crossfade(targetState = tab, modifier = Modifier.fillMaxSize().padding(bottom = 78.dp), label = "hospitalTab") { current ->
            when (current) {
                0 -> HospitalDashboardScreen(
                    darkMode = darkMode,
                    onToggleDark = onToggleDark,
                    onSwitchContext = onSwitchContext,
                    canSwitch = canSwitch,
                )
                1 -> QueueScreen()
                2 -> PatientsScreen()
                else -> HospitalMoreScreen(onOpen = { subScreen = it }, onLogout = onLogout)
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
