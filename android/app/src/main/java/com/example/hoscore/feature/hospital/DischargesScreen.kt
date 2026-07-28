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
import com.example.hoscore.core.network.DischargeSummary
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.ListViewModel
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.theme.HoscoreTokens

class DischargesVM : ListViewModel<List<DischargeSummary>>({ getDischarges() })

@Composable
fun DischargesScreen(onBack: () -> Unit, vm: DischargesVM = viewModel()) {
    val t = HoscoreTokens.current
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Discharge Summaries", "Completed inpatient stays & care plans", onBack = onBack)
        DataScreen(vm) { list ->
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (list.isEmpty()) {
                    item {
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Text("No completed discharge summaries found.", color = t.textMuted, fontSize = 13.sp)
                        }
                    }
                } else {
                    items(list, key = { it.id }) { d ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Column {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(d.patientName, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                                        if (d.doctorName != null) Text("Dr. ${d.doctorName}", color = t.textMuted, fontSize = 12.sp)
                                    }
                                    StatusBadge(d.status, t.emerald)
                                }
                                if (!d.diagnosis.isNullOrBlank()) {
                                    Spacer(Modifier.height(6.dp))
                                    Text("Diagnosis: ${d.diagnosis}", fontWeight = FontWeight.Medium, color = t.textSecondary, fontSize = 12.sp)
                                }
                                if (!d.medications.isNullOrBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text("Medications: ${d.medications}", color = t.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
