package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.SectionTitle
import com.example.hoscore.core.ui.theme.HoscoreTokens

/** Destinations reachable from the hospital "More" grid. */
enum class HospitalDest {
    ROOMS,
    ADMISSIONS,
    DISCHARGES,
    PRESCRIPTIONS,
    LABS,
    VITALS,
    BILLING,
    DOCTORS,
    STAFF,
    STAFF_TYPES,
    INVENTORY,
    EXPENSES,
    CLAIMS,
    SHIFTS,
    NOTICES,
    LEAVES,
    GROUPS,
    FEEDBACK,
    AUDIT_LOGS,
    MAP,
}

private data class MoreItem(val label: String, val icon: ImageVector, val dest: HospitalDest, val feature: String)

/**
 * Mirrors the web client's `hasFeature(permissions, feature, role)` (client/src/utils/features.ts):
 * ADMIN / SUPER_ADMIN see everything; other roles only see modules their staff-type
 * permissions include.
 */
private fun hasFeature(permissions: List<String>, feature: String, role: String?): Boolean {
    if (role == "ADMIN" || role == "SUPER_ADMIN") return true
    return permissions.contains(feature)
}

@Composable
fun HospitalMoreScreen(onOpen: (HospitalDest) -> Unit, onLogout: () -> Unit) {
    val t = HoscoreTokens.current
    val ctx = ServiceLocator.sessionStore.activeContext
    val permissions = ctx?.permissions ?: emptyList()
    val role = ctx?.role

    val clinicalItems = listOf(
        MoreItem("Rooms & Beds", Icons.Rounded.Bed, HospitalDest.ROOMS, "rooms"),
        MoreItem("Admissions", Icons.Rounded.MedicalServices, HospitalDest.ADMISSIONS, "admissions"),
        MoreItem("Discharge Summaries", Icons.Rounded.AssignmentTurnedIn, HospitalDest.DISCHARGES, "discharges"),
        MoreItem("Prescriptions", Icons.Rounded.Medication, HospitalDest.PRESCRIPTIONS, "prescriptions"),
        MoreItem("Lab Orders", Icons.Rounded.Science, HospitalDest.LABS, "labs"),
        MoreItem("Patient Vitals", Icons.Rounded.MonitorHeart, HospitalDest.VITALS, "vitals"),
        MoreItem("Doctors Roster", Icons.Rounded.Badge, HospitalDest.DOCTORS, "doctors"),
        MoreItem("Indoor Hospital Map", Icons.Rounded.Map, HospitalDest.MAP, "map"),
    ).filter { hasFeature(permissions, it.feature, role) }

    val adminItems = listOf(
        MoreItem("Billing & Invoices", Icons.Rounded.ReceiptLong, HospitalDest.BILLING, "billing"),
        MoreItem("Inventory Stock", Icons.Rounded.Inventory2, HospitalDest.INVENTORY, "inventory"),
        MoreItem("Operating Expenses", Icons.Rounded.Payments, HospitalDest.EXPENSES, "expenses"),
        MoreItem("Insurance Claims", Icons.Rounded.Shield, HospitalDest.CLAIMS, "claims"),
        MoreItem("Staff Directory", Icons.Rounded.People, HospitalDest.STAFF, "staff"),
        MoreItem("Staff Types & Roles", Icons.Rounded.AdminPanelSettings, HospitalDest.STAFF_TYPES, "staff_types"),
        MoreItem("Duty Shifts", Icons.Rounded.CalendarMonth, HospitalDest.SHIFTS, "shifts"),
        MoreItem("Department Groups", Icons.Rounded.Groups, HospitalDest.GROUPS, "groups"),
        MoreItem("Notice Board", Icons.Rounded.PushPin, HospitalDest.NOTICES, "notices"),
        MoreItem("Leave Approvals", Icons.Rounded.EventBusy, HospitalDest.LEAVES, "leaves"),
        MoreItem("Patient Reviews", Icons.Rounded.Star, HospitalDest.FEEDBACK, "feedback"),
        MoreItem("Audit Trail", Icons.Rounded.HistoryToggleOff, HospitalDest.AUDIT_LOGS, "audit_logs"),
    ).filter { hasFeature(permissions, it.feature, role) }

    Column(Modifier.fillMaxSize().background(t.screenBg).verticalScroll(rememberScrollState())) {
        HoscoreTopBar("Hospital Operations", ctx?.hospitalName ?: "Clinical Portal")
        Column(Modifier.padding(horizontal = 20.dp)) {

            if (clinicalItems.isNotEmpty()) {
                SectionTitle("Clinical Modules")
                Spacer(Modifier.height(10.dp))
                GridItems(clinicalItems, t, onOpen)
                Spacer(Modifier.height(20.dp))
            }

            if (adminItems.isNotEmpty()) {
                SectionTitle("Administration & Finance")
                Spacer(Modifier.height(10.dp))
                GridItems(adminItems, t, onOpen)
            }

            if (clinicalItems.isEmpty() && adminItems.isEmpty()) {
                Spacer(Modifier.height(20.dp))
                Text(
                    "No additional modules are enabled for your role. Contact your administrator for access.",
                    fontSize = 13.sp, color = t.textMuted, fontWeight = FontWeight.Medium,
                )
            }

            Spacer(Modifier.height(24.dp))
            OutlinedButton(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(48.dp),
            ) { Text("Sign out of Hospital", color = t.clinical, fontWeight = FontWeight.Bold) }
            Spacer(Modifier.height(30.dp))
        }
    }
}

@Composable
private fun GridItems(items: List<MoreItem>, t: com.example.hoscore.core.ui.theme.HoscorePalette, onOpen: (HospitalDest) -> Unit) {
    items.chunked(2).forEach { row ->
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            row.forEach { item ->
                HoscoreCard(Modifier.weight(1f), onClick = { onOpen(item.dest) }) {
                    Column(Modifier.padding(4.dp)) {
                        Box(
                            Modifier.size(38.dp).clip(CircleShape).background(t.primary.copy(0.12f)),
                            contentAlignment = Alignment.Center,
                        ) { Icon(item.icon, item.label, tint = t.primary, modifier = Modifier.size(20.dp)) }
                        Spacer(Modifier.height(10.dp))
                        Text(item.label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textPrimary)
                    }
                }
            }
            if (row.size == 1) Spacer(Modifier.weight(1f))
        }
        Spacer(Modifier.height(10.dp))
    }
}
