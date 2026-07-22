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
    PRESCRIPTIONS,
    LABS,
    VITALS,
    BILLING,
    DOCTORS,
    STAFF,
    INVENTORY,
    EXPENSES,
    CLAIMS,
    SHIFTS,
    NOTICES,
    LEAVES,
    FEEDBACK,
    AUDIT_LOGS
}

private data class MoreItem(val label: String, val icon: ImageVector, val dest: HospitalDest)

@Composable
fun HospitalMoreScreen(onOpen: (HospitalDest) -> Unit, onLogout: () -> Unit) {
    val t = HoscoreTokens.current
    val ctx = ServiceLocator.sessionStore.activeContext

    val clinicalItems = listOf(
        MoreItem("Rooms & Beds", Icons.Rounded.Bed, HospitalDest.ROOMS),
        MoreItem("Admissions", Icons.Rounded.MedicalServices, HospitalDest.ADMISSIONS),
        MoreItem("Prescriptions", Icons.Rounded.Medication, HospitalDest.PRESCRIPTIONS),
        MoreItem("Lab Orders", Icons.Rounded.Science, HospitalDest.LABS),
        MoreItem("Patient Vitals", Icons.Rounded.MonitorHeart, HospitalDest.VITALS),
        MoreItem("Doctors Roster", Icons.Rounded.Badge, HospitalDest.DOCTORS),
    )

    val adminItems = listOf(
        MoreItem("Billing & Invoices", Icons.Rounded.ReceiptLong, HospitalDest.BILLING),
        MoreItem("Inventory Stock", Icons.Rounded.Inventory2, HospitalDest.INVENTORY),
        MoreItem("Operating Expenses", Icons.Rounded.Payments, HospitalDest.EXPENSES),
        MoreItem("Insurance Claims", Icons.Rounded.Shield, HospitalDest.CLAIMS),
        MoreItem("Staff Directory", Icons.Rounded.People, HospitalDest.STAFF),
        MoreItem("Duty Shifts", Icons.Rounded.CalendarMonth, HospitalDest.SHIFTS),
        MoreItem("Notice Board", Icons.Rounded.PushPin, HospitalDest.NOTICES),
        MoreItem("Leave Approvals", Icons.Rounded.EventBusy, HospitalDest.LEAVES),
        MoreItem("Patient Reviews", Icons.Rounded.Star, HospitalDest.FEEDBACK),
        MoreItem("Audit Trail", Icons.Rounded.HistoryToggleOff, HospitalDest.AUDIT_LOGS),
    )

    Column(Modifier.fillMaxSize().background(t.screenBg).verticalScroll(rememberScrollState())) {
        HoscoreTopBar("Hospital Operations", ctx?.hospitalName ?: "Clinical Portal")
        Column(Modifier.padding(horizontal = 20.dp)) {

            SectionTitle("Clinical Modules")
            Spacer(Modifier.height(10.dp))
            GridItems(clinicalItems, t, onOpen)

            Spacer(Modifier.height(20.dp))

            SectionTitle("Administration & Finance")
            Spacer(Modifier.height(10.dp))
            GridItems(adminItems, t, onOpen)

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
