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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bed
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.network.Bed
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun RoomsScreen() {
    val t = HoscoreTokens.current
    val vm: RoomsVM = viewModel()
    val admissionsVm: AdmissionsVM = viewModel()
    var showAdmitDialog by remember { mutableStateOf(false) }

    if (showAdmitDialog) {
        AdmitPatientDialog(
            onDismiss = { showAdmitDialog = false },
            onAdmit = { name, bedId, reason ->
                admissionsVm.admit(name, bedId, reason)
                showAdmitDialog = false
            }
        )
    }

    androidx.compose.material3.Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = t.screenBg,
        topBar = { HoscoreTopBar("Rooms & Beds", "Bed occupancy board") },
        floatingActionButton = {
            androidx.compose.material3.ExtendedFloatingActionButton(
                onClick = { showAdmitDialog = true },
                containerColor = t.primary,
                contentColor = Color.White,
                icon = { androidx.compose.material3.Icon(Icons.Rounded.Add, null) },
                text = { Text("Admit Patient", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            DataScreen(vm) { rooms ->
                if (rooms.isEmpty()) {
                    EmptyState("No rooms configured", "Rooms and beds will appear here.", Icons.Rounded.Bed)
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        items(rooms, key = { it.id }) { room ->
                            HoscoreCard(Modifier.fillMaxWidth()) {
                                Column {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(room.name, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                                        Text(
                                            listOfNotNull(room.type, room.floor?.let { "Floor $it" }).joinToString(" · "),
                                            color = t.textMuted, fontSize = 12.sp, fontWeight = FontWeight.Medium,
                                        )
                                    }
                                    if (room.beds.isNotEmpty()) {
                                        Spacer(Modifier.height(12.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            room.beds.take(6).forEach { BedChip(it) }
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
}

@Composable
private fun AdmitPatientDialog(onDismiss: () -> Unit, onAdmit: (String, String, String?) -> Unit) {
    val t = HoscoreTokens.current
    var patientName by remember { mutableStateOf("") }
    var bedId by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Admit Patient", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = patientName,
                    onValueChange = { patientName = it; error = null },
                    label = { Text("Patient Name") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = bedId,
                    onValueChange = { bedId = it; error = null },
                    label = { Text("Bed UUID") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason for Admission (Optional)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    modifier = Modifier.fillMaxWidth()
                )
                if (error != null) {
                    Text(error!!, color = t.clinical, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    when {
                        patientName.isBlank() -> error = "Patient name is required."
                        bedId.isBlank() -> error = "Bed UUID is required."
                        else -> onAdmit(patientName.trim(), bedId.trim(), reason.ifBlank { null })
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text("Admit") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

@Composable
private fun BedChip(bed: Bed) {
    val t = HoscoreTokens.current
    val color = when (bed.status.uppercase()) {
        "OCCUPIED" -> t.clinical
        "MAINTENANCE" -> t.amber
        else -> t.emerald
    }
    Box(
        Modifier
            .width(44.dp)
            .height(44.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(color.copy(alpha = 0.15f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(bed.name.takeLast(3), fontSize = 11.sp, fontWeight = FontWeight.Black, color = color)
    }
}
