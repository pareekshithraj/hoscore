package com.example.hoscore.feature.superadmin

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Apartment
import androidx.compose.material.icons.rounded.Insights
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.People
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.hoscore.core.ui.components.NavTab
import com.example.hoscore.core.ui.components.PillBottomBar
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun SuperAdminShell(
    onLogout: () -> Unit,
    onSwitchContext: () -> Unit,
    canSwitch: Boolean,
) {
    val t = HoscoreTokens.current
    var tab by rememberSaveable { mutableIntStateOf(0) }
    val tabs = remember {
        listOf(
            NavTab("Overview", Icons.Rounded.Insights),
            NavTab("Hospitals", Icons.Rounded.Apartment),
            NavTab("Users", Icons.Rounded.People),
            NavTab("Billing", Icons.Rounded.Payments),
        )
    }

    Box(Modifier.fillMaxSize()) {
        Crossfade(targetState = tab, modifier = Modifier.fillMaxSize().padding(bottom = 64.dp), label = "adminTab") { current ->
            when (current) {
                0 -> SuperAdminOverviewScreen(onSwitchContext, canSwitch)
                1 -> ManageHospitalsScreen()
                2 -> ManageUsersScreen()
                else -> Column(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(1f)) { SubscriptionsScreen() }
                    OutlinedButton(
                        onClick = onLogout,
                        modifier = Modifier.padding(20.dp).height(48.dp),
                    ) { Text("Sign out", color = t.clinical, fontWeight = FontWeight.Bold) }
                }
            }
        }
        PillBottomBar(tabs = tabs, selected = tab, onSelect = { tab = it }, modifier = Modifier.align(Alignment.BottomCenter))
    }
}
