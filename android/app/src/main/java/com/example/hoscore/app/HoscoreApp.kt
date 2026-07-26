package com.example.hoscore.app

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.example.hoscore.core.auth.SessionManager
import com.example.hoscore.core.model.ContextItem
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.feature.auth.LoginScreen
import com.example.hoscore.feature.hospital.HospitalShell
import com.example.hoscore.feature.patient.PatientShell
import com.example.hoscore.feature.superadmin.SuperAdminShell
import kotlinx.coroutines.launch

/**
 * Root of the app. Observes the session and routes to the correct context shell
 * (patient / hospital / super-admin) or the auth flow. Hosts the context
 * switcher and drives dark-mode from [AppState].
 */
@Composable
fun HoscoreApp(appState: AppState) {
    val session by ServiceLocator.sessionStore.session.collectAsState()
    val scope = rememberCoroutineScope()
    var showSwitcher by remember { mutableStateOf(false) }

    // Reconnect socket on cold start if a session was restored.
    LaunchedEffect(Unit) { SessionManager.reconnectSocketIfLoggedIn() }

    val loggedIn = !session?.token.isNullOrEmpty()
    if (!loggedIn) {
        LoginScreen(onLoggedIn = { /* session flow recomposes this */ })
        return
    }

    val active = session?.activeContext
    val contexts = session?.contexts ?: emptyList()
    val canSwitch = contexts.size > 1

    val onLogout: () -> Unit = { SessionManager.logout() }
    val onSwitch: () -> Unit = { showSwitcher = true }
    val toggleDark = { appState.toggleDark() }

    Box(Modifier.fillMaxSize()) {
        when (active?.type) {
            "hospital" -> HospitalShell(onLogout, onSwitch, appState.darkMode, toggleDark, canSwitch)
            "superadmin" -> SuperAdminShell(onLogout, onSwitch, appState.darkMode, toggleDark, canSwitch)
            else -> PatientShell(onLogout, onSwitch, appState.darkMode, toggleDark, canSwitch)
        }

        if (showSwitcher) {
            ContextSwitcherSheet(
                contexts = contexts,
                activeContext = active,
                onPick = { ctx: ContextItem ->
                    showSwitcher = false
                    if (ctx.type != active?.type || ctx.hospitalId != active?.hospitalId) {
                        scope.launch { SessionManager.switchContext(ctx) }
                    }
                },
                onDismiss = { showSwitcher = false },
            )
        }
    }
}
