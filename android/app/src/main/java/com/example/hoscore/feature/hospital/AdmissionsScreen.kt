package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.MedicalServices
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.components.statusColor
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun AdmissionsScreen() {
    val t = HoscoreTokens.current
    val vm: AdmissionsVM = viewModel()
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Admissions", "Inpatient census")
        DataScreen(vm) { list ->
            if (list.isEmpty()) {
                EmptyState("No active admissions", "Admitted patients will appear here.", Icons.Rounded.MedicalServices)
            } else {
                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(list, key = { it.id }) { a ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Column {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(a.patientName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                    StatusBadge(a.status, statusColor(a.status))
                                }
                                Text(
                                    listOfNotNull(a.roomName, a.bedName, a.doctorName?.let { "Dr. $it" }).joinToString(" · "),
                                    color = t.textMuted, fontSize = 12.sp,
                                )
                                if (!a.reason.isNullOrBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text(a.reason, color = t.textSecondary, fontSize = 12.sp)
                                }
                                if (a.status.equals("Admitted", true)) {
                                    Spacer(Modifier.height(10.dp))
                                    OutlinedButton(
                                        onClick = { vm.discharge(a.id) },
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.fillMaxWidth().height(42.dp),
                                    ) { Text("Discharge", fontWeight = FontWeight.Bold, color = t.primary, fontSize = 13.sp) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
