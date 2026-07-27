package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.network.Admission
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.ListViewModel
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.theme.HoscoreTokens

class DischargesVM : ListViewModel<List<Admission>>({ getAdmissions() })

@Composable
fun DischargesScreen(onBack: () -> Unit, vm: DischargesVM = viewModel()) {
    val t = HoscoreTokens.current
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Discharge Summaries", "Completed inpatient stays", onBack = onBack)
        DataScreen(vm) { list ->
            val discharges = list.filter { it.status.equals("Discharged", ignoreCase = true) || it.status.equals("COMPLETED", ignoreCase = true) }
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (discharges.isEmpty()) {
                    item {
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Text("No completed discharge summaries found.", color = t.textMuted, fontSize = 13.sp)
                        }
                    }
                } else {
                    items(discharges, key = { it.id }) { d ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(d.patientName, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                                    Text("Room: ${d.roomName ?: "—"} · Bed: ${d.bedName ?: "—"}", color = t.textMuted, fontSize = 12.sp)
                                    if (d.doctorName != null) Text("Attending: ${d.doctorName}", color = t.textSecondary, fontSize = 12.sp)
                                }
                                StatusBadge("DISCHARGED", t.emerald)
                            }
                        }
                    }
                }
            }
        }
    }
}
