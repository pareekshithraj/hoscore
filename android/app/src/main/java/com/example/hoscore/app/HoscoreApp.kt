package com.example.hoscore.app

import android.content.Context
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import com.example.hoscore.core.auth.SessionManager
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.model.ContextItem
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.feature.auth.LoginScreen
import com.example.hoscore.feature.hospital.HospitalShell
import com.example.hoscore.feature.onboarding.OnboardingScreen
import com.example.hoscore.feature.patient.PatientShell
import com.example.hoscore.feature.superadmin.SuperAdminShell
import kotlinx.coroutines.launch

private const val PREFS_NAME  = "hoscore_app_prefs"
private const val KEY_ONBOARD = "onboarding_done"

/**
 * Root of the app.
 * Flow: Onboarding (first-run only) → Login → Portal Shell
 * Hosts context switcher + switch error snackbar.
 */
@Composable
fun HoscoreApp(appState: AppState) {
    val session by ServiceLocator.sessionStore.session.collectAsState()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val snackState = remember { SnackbarHostState() }

    // ── Onboarding first-run flag ──────────────────────────────────────────
    val prefs = remember { context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE) }
    var onboardingDone by remember { mutableStateOf(prefs.getBoolean(KEY_ONBOARD, false)) }

    // ── Switcher / switching state ─────────────────────────────────────────
    var showSwitcher  by remember { mutableStateOf(false) }
    var isSwitching   by remember { mutableStateOf(false) }

    // Reconnect socket on cold start if a session was restored.
    LaunchedEffect(Unit) { SessionManager.reconnectSocketIfLoggedIn() }

    // ── Onboarding ─────────────────────────────────────────────────────────
    if (!onboardingDone) {
        OnboardingScreen(
            onFinish = {
                prefs.edit().putBoolean(KEY_ONBOARD, true).apply()
                onboardingDone = true
            }
        )
        return
    }

    // ── Auth gate ──────────────────────────────────────────────────────────
    val loggedIn = !session?.token.isNullOrEmpty()
    if (!loggedIn) {
        LoginScreen(onLoggedIn = { /* session flow recomposes */ })
        return
    }

    // ── Authenticated ──────────────────────────────────────────────────────
    val active   = session?.activeContext
    val contexts = session?.contexts ?: emptyList()
    val canSwitch = contexts.size > 1

    val onLogout: () -> Unit = { SessionManager.logout() }
    val onSwitch: () -> Unit = { showSwitcher = true }

    Box(Modifier.fillMaxSize()) {
        // Portal shells
        when (active?.type) {
            "hospital"   -> HospitalShell(onLogout, onSwitch, canSwitch)
            "superadmin" -> SuperAdminShell(onLogout, onSwitch, canSwitch)
            else         -> PatientShell(onLogout, onSwitch, canSwitch)
        }

        // Switch error snackbar
        SnackbarHost(
            hostState = snackState,
            modifier = Modifier.align(Alignment.BottomCenter),
        ) { data ->
            Snackbar(
                snackbarData = data,
                containerColor = Color(0xFF1E293B),
                contentColor = Color.White,
            )
        }

        // Context switcher bottom sheet
        if (showSwitcher) {
            ContextSwitcherSheet(
                contexts      = contexts,
                activeContext = active,
                isSwitching   = isSwitching,
                onPick = { ctx: ContextItem ->
                    if (ctx.type == active?.type && ctx.hospitalId == active?.hospitalId) {
                        showSwitcher = false
                        return@ContextSwitcherSheet
                    }
                    isSwitching = true
                    scope.launch {
                        val result = SessionManager.switchContext(ctx)
                        isSwitching  = false
                        showSwitcher = false
                        if (result is Resource.Error) {
                            snackState.showSnackbar("Switch failed: ${result.message}")
                        }
                    }
                },
                onDismiss = { showSwitcher = false },
            )
        }
    }
}
