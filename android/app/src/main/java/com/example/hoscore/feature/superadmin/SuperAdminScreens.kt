package com.example.hoscore.feature.superadmin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Apartment
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.People
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.GradientHeroCard
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.MetricCard
import com.example.hoscore.core.ui.components.SectionTitle
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.components.statusColor
import com.example.hoscore.core.ui.theme.HoscoreTokens

import com.example.hoscore.core.ui.components.WorkspaceHeaderBar

@Composable
fun SuperAdminOverviewScreen(
    darkMode: Boolean,
    onToggleDark: () -> Unit,
    onSwitchContext: () -> Unit,
    canSwitch: Boolean,
) {
    val t = HoscoreTokens.current
    val vm: SuperAdminStatsVM = viewModel()
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        WorkspaceHeaderBar(
            onSwitchContext = onSwitchContext,
            darkMode = darkMode,
            onToggleDark = onToggleDark,
            canSwitch = canSwitch
        )
        DataScreen(vm) { s ->
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
                GradientHeroCard(
                    eyebrow = "PLATFORM STATUS",
                    title = "All systems operational",
                    metricLabel = "Active subscriptions",
                    metricValue = s.activeSubscriptions.toString(),
                    bullets = listOf("Encrypted multi-tenant environment", "Realtime clinical websockets", "Automated billing & telemetry"),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(20.dp))
                SectionTitle("Global metrics")
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    MetricCard("Hospitals", s.totalHospitals.toString(), "Registered", Icons.Rounded.Apartment, t.primary, Modifier.weight(1f))
                    MetricCard("Users", s.totalUsers.toString(), "All accounts", Icons.Rounded.Groups, t.cyan, Modifier.weight(1f))
                }
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    MetricCard("Patients", s.totalPatients.toString(), "Platform-wide", Icons.Rounded.People, t.teal, Modifier.weight(1f))
                    MetricCard("Revenue", s.monthlyRevenue?.let { "₹${it.toInt()}" } ?: "—", "This month", Icons.Rounded.Payments, t.emerald, Modifier.weight(1f))
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun ManageHospitalsScreen() {
    val t = HoscoreTokens.current
    val vm: AdminHospitalsVM = viewModel()
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Hospitals", "Manage tenant hospitals")
        DataScreen(vm) { list ->
            if (list.isEmpty()) {
                EmptyState("No hospitals", "Registered hospitals appear here.", Icons.Rounded.Apartment)
            } else {
                LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(list, key = { it.id }) { h ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(h.name, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                    Text(h.city ?: "", color = t.textMuted, fontSize = 12.sp)
                                    if (h.subscriptionStatus != null) {
                                        Spacer(Modifier.height(6.dp))
                                        StatusBadge(h.subscriptionStatus, statusColor(h.subscriptionStatus))
                                    }
                                }
                                Switch(
                                    checked = h.isActive,
                                    onCheckedChange = { vm.toggle(h.id) },
                                    colors = SwitchDefaults.colors(checkedThumbColor = t.primary, checkedTrackColor = t.primary.copy(0.4f)),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ManageUsersScreen() {
    val t = HoscoreTokens.current
    val vm: AdminUsersVM = viewModel()
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Users", "Manage platform accounts")
        DataScreen(vm) { list ->
            if (list.isEmpty()) {
                EmptyState("No users", "Accounts appear here.", Icons.Rounded.People)
            } else {
                LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(list, key = { it.id }) { u ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(u.name.ifBlank { u.email }, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                    Text(u.email, color = t.textMuted, fontSize = 12.sp)
                                }
                                if (u.isSuperAdmin) StatusBadge("ADMIN", t.primary)
                                Spacer(Modifier.width(10.dp))
                                Switch(
                                    checked = u.isActive,
                                    onCheckedChange = { vm.toggle(u.id) },
                                    colors = SwitchDefaults.colors(checkedThumbColor = t.primary, checkedTrackColor = t.primary.copy(0.4f)),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SubscriptionsScreen() {
    val t = HoscoreTokens.current
    val vm: SubscriptionsVM = viewModel()
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Subscriptions", "Billing & licenses")
        DataScreen(vm) { list ->
            if (list.isEmpty()) {
                EmptyState("No subscriptions", "Active plans appear here.", Icons.Rounded.Payments)
            } else {
                LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(list, key = { it.id }) { sub ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column(Modifier.weight(1f)) {
                                    Text(sub.hospitalName ?: "Hospital", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                    Text(sub.plan ?: "—", color = t.textMuted, fontSize = 12.sp)
                                }
                                if (sub.status != null) StatusBadge(sub.status, statusColor(sub.status))
                            }
                        }
                    }
                }
            }
        }
    }
}
