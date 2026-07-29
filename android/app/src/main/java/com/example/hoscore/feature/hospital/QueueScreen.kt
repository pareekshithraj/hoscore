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
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.EventAvailable
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.border
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QueueScreen() {
    val t = HoscoreTokens.current
    val vm: QueueVM = viewModel()
    LaunchedEffect(Unit) { vm.start() }
    val state by vm.state.collectAsState()
    val pendingState by vm.pendingState.collectAsState()
    
    var showDatePicker by remember { mutableStateOf(false) }
    if (showDatePicker) {
        val dpState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    val ms = dpState.selectedDateMillis ?: System.currentTimeMillis()
                    val dt = java.time.Instant.ofEpochMilli(ms).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                    vm.setDate(dt.toString())
                    showDatePicker = false
                }) { Text("Confirm") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
            }
        ) {
            DatePicker(dpState)
        }
    }

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar(
            "OPD Queue", 
            "Date: ${vm.selectedDate}",
            trailingIcon = Icons.Rounded.CalendarMonth,
            onTrailing = { showDatePicker = true }
        )
        when (val s = state) {
            is Resource.Loading -> LoadingSkeleton()
            is Resource.Error -> ErrorState(s.message, onRetry = { vm.refresh() })
            is Resource.Success -> {
                val pendingList = (pendingState as? Resource.Success)?.data ?: emptyList()
                val queueList = s.data

                if (queueList.isEmpty() && pendingList.isEmpty()) {
                    EmptyState("Queue is empty", "Patients checked in will show here.", Icons.Rounded.Groups)
                } else {
                    val waitingCount = queueList.count { it.status.uppercase() == "WAITING" }
                    val consultCount = queueList.count { it.status.uppercase() == "IN_CONSULTATION" }
                    
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        item {
                            Box(
                                Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(t.primary.copy(alpha=0.1f)).padding(12.dp)
                            ) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Rounded.Groups, null, tint = t.primary, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.size(8.dp))
                                    Text("$waitingCount waiting  ·  $consultCount in consultation", fontWeight = FontWeight.Bold, color = t.primary, fontSize = 13.sp)
                                }
                            }
                        }
                        
                        if (pendingList.isNotEmpty()) {
                            item {
                                Text("Pending Online Bookings", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp, modifier = Modifier.padding(top = 8.dp))
                            }
                            items(pendingList, key = { "pending_${it.id}" }) { apt ->
                                HoscoreCard(Modifier.fillMaxWidth()) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            Modifier.size(46.dp).clip(androidx.compose.foundation.shape.CircleShape).background(t.amber.copy(0.1f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Rounded.EventAvailable, null, tint = t.amber, modifier = Modifier.size(20.dp))
                                        }
                                        Spacer(Modifier.size(14.dp))
                                        Column(Modifier.weight(1f)) {
                                            Text(apt.patientName ?: "Unknown", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                            Text(
                                                listOfNotNull(apt.doctorName?.let { "Dr. $it" }, apt.department).joinToString(" · "),
                                                color = t.textMuted, fontSize = 12.sp,
                                            )
                                        }
                                    }
                                    Spacer(Modifier.height(12.dp))
                                    Button(
                                        onClick = { vm.checkIn(apt) },
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = t.amber),
                                        modifier = Modifier.fillMaxWidth().height(42.dp),
                                    ) {
                                        Text("Check In to Queue", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 13.sp)
                                    }
                                }
                            }
                            item {
                                Text("Active Queue", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp, modifier = Modifier.padding(top = 16.dp))
                            }
                        }

                        items(queueList, key = { it.id }) { q ->
                            HoscoreCard(Modifier.fillMaxWidth()) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        Modifier.size(46.dp)
                                            .clip(androidx.compose.foundation.shape.CircleShape)
                                            .background(Color.White)
                                            .border(2.dp, t.primary.copy(0.3f), androidx.compose.foundation.shape.CircleShape),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text("${q.tokenNumber ?: "-"}", fontWeight = FontWeight.Black, color = t.primary, fontSize = 16.sp)
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
