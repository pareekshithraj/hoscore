package com.example.hoscore.feature.superadmin

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.border
import androidx.compose.ui.draw.clip
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
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.MetricCard
import com.example.hoscore.core.ui.components.SectionTitle
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.components.statusColor
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun SuperAdminOverviewScreen(
    onSwitchContext: () -> Unit,
    canSwitch: Boolean,
) {
    // Purple SuperAdmin palette
    val SABg      = androidx.compose.ui.graphics.Color(0xFFF5F3FF)
    val SAPurple  = androidx.compose.ui.graphics.Color(0xFF7C3AED)
    val SAPurpleMid = androidx.compose.ui.graphics.Color(0xFFA855F7)
    val SAText    = androidx.compose.ui.graphics.Color(0xFF0F172A)
    val SAMuted   = androidx.compose.ui.graphics.Color(0xFF64748B)
    val SALight   = androidx.compose.ui.graphics.Color(0xFF94A3B8)

    val user = com.example.hoscore.core.network.ServiceLocator.sessionStore.user
    val initials = (user?.name ?: "SA").split(" ").filter { it.isNotEmpty() }.take(2)
        .joinToString("") { it.first().uppercase() }.ifEmpty { "SA" }
    val vm: SuperAdminStatsVM = viewModel()

    androidx.compose.foundation.layout.Column(
        Modifier.fillMaxSize()
            .background(SABg)
    ) {
        // Purple top bar
        androidx.compose.foundation.layout.Row(
            Modifier.fillMaxWidth()
                .background(androidx.compose.ui.graphics.Color.White)
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            androidx.compose.foundation.layout.Box(
                Modifier.size(46.dp)
                    .clip(androidx.compose.foundation.shape.CircleShape)
                    .background(androidx.compose.ui.graphics.Brush.linearGradient(listOf(SAPurple, SAPurpleMid))),
                contentAlignment = Alignment.Center,
            ) { Text(initials, color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp) }
            Spacer(Modifier.width(12.dp))
            androidx.compose.foundation.layout.Column(Modifier.weight(1f)) {
                Text("Super Admin 🛡️", fontSize = 12.sp, color = SALight, fontWeight = FontWeight.Medium)
                Text("Platform Control", fontSize = 15.sp, fontWeight = FontWeight.Black, color = SAText)
            }
            if (canSwitch) {
                androidx.compose.foundation.layout.Box(
                    Modifier.size(40.dp).clip(androidx.compose.foundation.shape.CircleShape)
                        .background(androidx.compose.ui.graphics.Color.White)
                        .border(androidx.compose.foundation.BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFE2E8F0)), androidx.compose.foundation.shape.CircleShape)
                        .clickable { onSwitchContext() },
                    contentAlignment = Alignment.Center,
                ) {
                    androidx.compose.material3.Icon(Icons.Rounded.People, null, tint = SAPurple, modifier = Modifier.size(20.dp))
                }
            }
        }

        DataScreen(vm) { s ->
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
                Spacer(Modifier.height(16.dp))
                // Purple hero card
                androidx.compose.foundation.layout.Box(
                    Modifier.fillMaxWidth()
                        .clip(androidx.compose.foundation.shape.RoundedCornerShape(24.dp))
                        .background(androidx.compose.ui.graphics.Brush.linearGradient(listOf(SAPurple, SAPurpleMid, androidx.compose.ui.graphics.Color(0xFFEC4899))))
                        .padding(20.dp)
                ) {
                    androidx.compose.foundation.layout.Column {
                        androidx.compose.foundation.layout.Box(
                            Modifier.clip(androidx.compose.foundation.shape.CircleShape)
                                .background(androidx.compose.ui.graphics.Color.White.copy(alpha = 0.2f))
                                .padding(horizontal = 10.dp, vertical = 3.dp),
                        ) {
                            Text("PLATFORM STATUS", fontSize = 9.sp, fontWeight = FontWeight.Black, color = androidx.compose.ui.graphics.Color.White, letterSpacing = 1.sp)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text("All Systems\nOperational", fontSize = 22.sp, fontWeight = FontWeight.Black, color = androidx.compose.ui.graphics.Color.White, lineHeight = 26.sp)
                        Spacer(Modifier.height(10.dp))
                        androidx.compose.foundation.layout.Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            androidx.compose.foundation.layout.Box(
                                Modifier.clip(androidx.compose.foundation.shape.CircleShape)
                                    .background(androidx.compose.ui.graphics.Color.White.copy(0.22f))
                                    .padding(horizontal = 10.dp, vertical = 3.dp),
                            ) { Text("${s.activeSubscriptions} Active", fontSize = 10.sp, fontWeight = FontWeight.Black, color = androidx.compose.ui.graphics.Color.White) }
                            androidx.compose.foundation.layout.Box(
                                Modifier.clip(androidx.compose.foundation.shape.CircleShape)
                                    .background(androidx.compose.ui.graphics.Color.White.copy(0.22f))
                                    .padding(horizontal = 10.dp, vertical = 3.dp),
                            ) { Text("${s.totalHospitals} Hospitals", fontSize = 10.sp, fontWeight = FontWeight.Black, color = androidx.compose.ui.graphics.Color.White) }
                        }
                    }
                }
                Spacer(Modifier.height(20.dp))
                SectionTitle("Global metrics")
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    MetricCard("Hospitals", s.totalHospitals.toString(), "Registered", Icons.Rounded.Apartment, SAPurple, Modifier.weight(1f))
                    MetricCard("Users", s.totalUsers.toString(), "All accounts", Icons.Rounded.Groups, SAPurpleMid, Modifier.weight(1f))
                }
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    MetricCard("Patients", s.totalPatients.toString(), "Platform-wide", Icons.Rounded.People, androidx.compose.ui.graphics.Color(0xFF0D9488), Modifier.weight(1f))
                    MetricCard("Revenue", s.monthlyRevenue?.let { "₹${it.toInt()}" } ?: "—", "This month", Icons.Rounded.Payments, androidx.compose.ui.graphics.Color(0xFF10B981), Modifier.weight(1f))
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
                                    val subStatus = h.subscriptionStatus
                                    if (subStatus != null) {
                                        Spacer(Modifier.height(6.dp))
                                        StatusBadge(subStatus, statusColor(subStatus))
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
