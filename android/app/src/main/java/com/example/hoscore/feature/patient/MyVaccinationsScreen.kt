package com.example.hoscore.feature.patient

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.Vaccination
import com.example.hoscore.core.network.RecordVaccinationRequest
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.launch

private val VaxGreen   = Color(0xFF10B981)
private val VaxGreenSoft = Color(0xFFD1FAE5)
private val VaxAmber   = Color(0xFFF59E0B)
private val VaxAmberSoft = Color(0xFFFEF3C7)
private val VaxSlate   = Color(0xFF64748B)
private val VaxSlateSoft = Color(0xFFF1F5F9)
private val VaxText    = Color(0xFF0F172A)

@Composable
fun MyVaccinationsScreen(onBack: (() -> Unit)? = null, vm: VaccinationsVM = viewModel()) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Vaccinations", "Digital immunisation passport", onBack = onBack)
        DataScreen(vm) { list ->
            val completed = list.count { (it.status ?: "").uppercase() == "COMPLETED" }
            val total     = list.size
            val progress  = if (total > 0) completed.toFloat() / total else 0f

            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 24.dp),
            ) {
                // ── Progress header banner ──────────────────────────────────
                item {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Brush.linearGradient(listOf(Color(0xFF064E3B), Color(0xFF065F46))))
                            .padding(20.dp),
                    ) {
                        Column {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column {
                                    Text("Immunisation Status", fontSize = 11.sp, color = Color.White.copy(0.7f), fontWeight = FontWeight.Medium)
                                    Text("$completed / $total Vaccines", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                                }
                                Box(
                                    Modifier.size(56.dp).clip(CircleShape).background(VaxGreen.copy(0.25f)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(Icons.Rounded.Vaccines, null, tint = VaxGreen, modifier = Modifier.size(28.dp))
                                }
                            }
                            Spacer(Modifier.height(12.dp))
                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                                color = VaxGreen,
                                trackColor = Color.White.copy(0.15f),
                                strokeCap = StrokeCap.Round,
                            )
                            Spacer(Modifier.height(6.dp))
                            Text("${(progress * 100).toInt()}% complete", fontSize = 11.sp, color = Color.White.copy(0.8f), fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // ── Legend ──────────────────────────────────────────────────
                item {
                    Row(
                        Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        VaxLegendDot(VaxGreen, "Completed")
                        VaxLegendDot(VaxAmber, "Pending")
                        VaxLegendDot(VaxSlate, "Skipped")
                    }
                }

                if (list.isEmpty()) {
                    item { EmptyState("No vaccine records", "Records will appear here automatically.", Icons.Rounded.Vaccines) }
                } else {
                    items(list, key = { it.id }) { v ->
                        VaccineCard(v) {
                            // Mark as given
                            scope.launch {
                                apiCall { ServiceLocator.api.run {
                                    val req = RecordVaccinationRequest(
                                        id = v.id,
                                        status = "COMPLETED",
                                        givenBy = "Self-reported",
                                    )
                                    recordVaccination(req)
                                } }
                                vm.refresh()
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun VaxLegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(color))
        Text(label, fontSize = 11.sp, color = VaxSlate, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun VaccineCard(v: Vaccination, onMarkDone: () -> Unit) {
    val status = (v.status ?: "PENDING").uppercase()
    val isDone  = status == "COMPLETED"
    val isSkip  = status == "SKIPPED"

    val borderColor by animateColorAsState(
        when {
            isDone -> VaxGreen.copy(0.3f)
            isSkip -> VaxSlate.copy(0.2f)
            else   -> VaxAmber.copy(0.3f)
        },
        animationSpec = tween(300), label = "vaxBorder",
    )
    val badgeBg    = when { isDone -> VaxGreenSoft; isSkip -> VaxSlateSoft; else -> VaxAmberSoft }
    val badgeColor = when { isDone -> VaxGreen;     isSkip -> VaxSlate;     else -> VaxAmber }

    Column(
        Modifier
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, borderColor, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Status icon
            Box(
                Modifier.size(40.dp).clip(CircleShape).background(badgeBg),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (isDone) Icons.Rounded.CheckCircle else if (isSkip) Icons.Rounded.Cancel else Icons.Rounded.Schedule,
                    null,
                    tint = badgeColor,
                    modifier = Modifier.size(22.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(v.name, fontWeight = FontWeight.Bold, color = VaxText, fontSize = 14.sp)
                if (!v.scheduledAge.isNullOrBlank()) Text("Scheduled: ${v.scheduledAge}", fontSize = 11.sp, color = VaxSlate)
                if (!v.date.isNullOrBlank()) Text("Given: ${v.date?.take(10)}", fontSize = 11.sp, color = VaxSlate)
                if (!v.provider.isNullOrBlank()) Text("By: ${v.provider}", fontSize = 11.sp, color = VaxSlate)
            }
            Surface(shape = RoundedCornerShape(8.dp), color = badgeBg) {
                Text(
                    status,
                    Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                    fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = badgeColor,
                )
            }
        }
        if (!isDone && !isSkip) {
            Spacer(Modifier.height(10.dp))
            Button(
                onClick = onMarkDone,
                modifier = Modifier.fillMaxWidth().height(36.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = VaxGreen),
            ) {
                Icon(Icons.Rounded.CheckCircle, null, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(6.dp))
                Text("I received this (self-report)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

