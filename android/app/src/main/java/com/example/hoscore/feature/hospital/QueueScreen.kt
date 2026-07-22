package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.ErrorState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.LoadingSkeleton
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.components.statusColor
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun QueueScreen() {
    val t = HoscoreTokens.current
    val vm: QueueVM = viewModel()
    LaunchedEffect(Unit) { vm.start() }
    val state by vm.state.collectAsState()

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("OPD Queue", "Live patient flow")
        when (val s = state) {
            is Resource.Loading -> LoadingSkeleton()
            is Resource.Error -> ErrorState(s.message, onRetry = { vm.refresh() })
            is Resource.Success -> {
                if (s.data.isEmpty()) {
                    EmptyState("Queue is empty", "Patients checked in will show here.", Icons.Rounded.Groups)
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(s.data, key = { it.id }) { q ->
                            HoscoreCard(Modifier.fillMaxWidth()) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        Modifier.size(46.dp).clip(RoundedCornerShape(12.dp)).background(t.primary.copy(0.12f)),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text("#${q.tokenNumber ?: "-"}", fontWeight = FontWeight.Black, color = t.primary, fontSize = 14.sp)
                                    }
                                    Spacer(Modifier.size(14.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(q.patientName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                        Text(
                                            listOfNotNull(q.doctorName?.let { "Dr. $it" }, q.department).joinToString(" · "),
                                            color = t.textMuted, fontSize = 12.sp,
                                        )
                                    }
                                    StatusBadge(q.status, statusColor(q.status))
                                }
                                if (q.status.uppercase() != "COMPLETED") {
                                    Spacer(Modifier.height(12.dp))
                                    Button(
                                        onClick = { vm.advance(q) },
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = t.primary),
                                        modifier = Modifier.fillMaxWidth().height(42.dp),
                                    ) {
                                        Text(
                                            if (q.status.uppercase() == "WAITING") "Start consultation" else "Mark completed",
                                            fontWeight = FontWeight.Bold, color = Color.White, fontSize = 13.sp,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
