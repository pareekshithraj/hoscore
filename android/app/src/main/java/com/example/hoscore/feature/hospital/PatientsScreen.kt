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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun PatientsScreen() {
    val t = HoscoreTokens.current
    val vm: PatientsVM = viewModel()
    var query by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Patients", "Registered patient directory")
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            placeholder = { Text("Search by name or ID", color = t.textMuted) },
            leadingIcon = { Icon(Icons.Rounded.Search, null, tint = t.textMuted) },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            keyboardOptions = KeyboardOptions(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = t.primary,
                unfocusedBorderColor = t.cardBorder,
                focusedContainerColor = t.card,
                unfocusedContainerColor = t.card,
                focusedTextColor = t.textPrimary,
                unfocusedTextColor = t.textPrimary,
            ),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp),
        )
        Spacer(Modifier.size(8.dp))
        DataScreen(vm) { list ->
            val filtered = list.filter {
                query.isBlank() ||
                    it.name.contains(query, true) ||
                    it.sixDigitId?.contains(query, true) == true
            }
            if (filtered.isEmpty()) {
                EmptyState("No patients found", "Try a different search.", Icons.Rounded.Person)
            } else {
                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(filtered, key = { it.id }) { p ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    Modifier.size(44.dp).clip(CircleShape).background(t.primary.copy(0.12f)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        p.name.take(1).uppercase(),
                                        fontWeight = FontWeight.Black, color = t.primary, fontSize = 17.sp,
                                    )
                                }
                                Spacer(Modifier.size(14.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(p.name, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                    Text(
                                        listOfNotNull(
                                            p.age?.let { "$it yrs" }, p.gender, p.bloodGroup,
                                        ).joinToString(" · ").ifEmpty { "Patient" },
                                        color = t.textMuted, fontSize = 12.sp,
                                    )
                                }
                                if (p.sixDigitId != null) StatusBadge("#${p.sixDigitId}", t.cyan)
                            }
                        }
                    }
                }
            }
        }
    }
}
