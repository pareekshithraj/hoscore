package com.example.hoscore.feature.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.LocalPharmacy
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material.icons.rounded.Vaccines
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.ui.components.GradientHeroCard
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.SectionTitle
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun PatientDashboardScreen(
    darkMode: Boolean,
    onToggleDark: () -> Unit,
    onSwitchContext: () -> Unit,
    onLogout: () -> Unit,
    canSwitch: Boolean,
    onOpenTab: (Int) -> Unit,
) {
    val t = HoscoreTokens.current
    val user = ServiceLocator.sessionStore.user
    val name = user?.name?.ifBlank { "Patient" } ?: "Patient"
    val initials = name.split(" ").filter { it.isNotEmpty() }.take(2)
        .joinToString("") { it.first().uppercase() }.ifEmpty { "P" }

    Column(
        Modifier.fillMaxSize().background(t.screenBg).verticalScroll(rememberScrollState()),
    ) {
        // Header
        Row(
            Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier.size(46.dp).clip(CircleShape).background(t.primary),
                contentAlignment = Alignment.Center,
            ) { Text(initials, color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp) }
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text("Welcome back", fontSize = 12.sp, color = t.textMuted, fontWeight = FontWeight.Medium)
                Text(name, fontSize = 18.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
            }
            IconPill(if (darkMode) Icons.Rounded.LightMode else Icons.Rounded.DarkMode, onToggleDark)
            if (canSwitch) {
                Spacer(Modifier.size(8.dp))
                IconPill(Icons.Rounded.SwapHoriz, onSwitchContext)
            }
        }

        Column(Modifier.padding(horizontal = 20.dp)) {
            // "Let's Find Your Doctor" Search Header (Matching Image 4)
            Text("Let's Find Your\nDoctor", fontSize = 24.sp, fontWeight = FontWeight.Black, color = t.textPrimary, lineHeight = 28.sp)
            Spacer(Modifier.height(12.dp))

            // Search Bar
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(androidx.compose.foundation.shape.RoundedCornerShape(20.dp))
                    .background(t.card)
                    .clickable { onOpenTab(3) }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Search, "Search", tint = t.primary, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.size(10.dp))
                    Text("Search doctors, specialties & hospitals...", fontSize = 13.sp, color = t.textMuted)
                }
            }

            Spacer(Modifier.height(16.dp))

            // Specialist Filter Chips (Matching Image 4)
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SpecialistChip("Pediatric", t.primary, true)
                SpecialistChip("Neurologist", t.amber, false)
                SpecialistChip("Physician", t.emerald, false)
            }

            Spacer(Modifier.height(20.dp))

            // "Health Status Review" Blue Hero (Matching Image 2)
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(androidx.compose.foundation.shape.RoundedCornerShape(26.dp))
                    .background(
                        androidx.compose.ui.graphics.Brush.linearGradient(
                            listOf(t.primary, Color(0xFF2563EB), Color(0xFF1D4ED8))
                        )
                    )
                    .padding(20.dp)
            ) {
                Column {
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text("HEALTH STATUS REVIEW", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.White.copy(0.8f), letterSpacing = 1.sp)
                            Text("Vitals & Biomarkers", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)
                        }
                        Box(
                            Modifier.clip(CircleShape).background(Color.White.copy(0.2f)).padding(horizontal = 10.dp, vertical = 4.dp),
                        ) {
                            Text("Normal", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color.White)
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        PatientMetricTile("SpO2", "98.5%", "Oxygen Saturation", Modifier.weight(1f))
                        PatientMetricTile("Heart Rate", "78 bpm", "Pulse Rate", Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        PatientMetricTile("Blood Count", "Now 116/70", "Blood Pressure", Modifier.weight(1f))
                        PatientMetricTile("Glucose Level", "90 mg/dL", "Fasting Glucose", Modifier.weight(1f))
                    }
                }
            }

            Spacer(Modifier.height(22.dp))
            SectionTitle("Upcoming appointment")
            Spacer(Modifier.height(12.dp))

            // Doctor Appointment Hero Card (Matching Image 4)
            HoscoreCard(Modifier.fillMaxWidth(), onClick = { onOpenTab(1) }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(52.dp).clip(CircleShape).background(t.primary.copy(0.15f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("DR", color = t.primary, fontWeight = FontWeight.Black, fontSize = 16.sp)
                    }
                    Spacer(Modifier.size(14.dp))
                    Column(Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Dr. Tanjana Jhon", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                            Spacer(Modifier.size(6.dp))
                            Box(
                                Modifier.clip(CircleShape).background(t.amber.copy(0.15f)).padding(horizontal = 6.dp, vertical = 2.dp),
                            ) {
                                Text("★ 4.9", fontSize = 10.sp, fontWeight = FontWeight.Black, color = t.amber)
                            }
                        }
                        Text("Neurologist · 45 Reviews", color = t.textMuted, fontSize = 12.sp)
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                Modifier.clip(CircleShape).background(t.primary.copy(0.12f)).padding(horizontal = 8.dp, vertical = 2.dp),
                            ) {
                                Text("14 Jun", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.primary)
                            }
                            Box(
                                Modifier.clip(CircleShape).background(t.emerald.copy(0.12f)).padding(horizontal = 8.dp, vertical = 2.dp),
                            ) {
                                Text("14:30 PM", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.emerald)
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(22.dp))
            SectionTitle("Quick portal access")
            Spacer(Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction("Appointments", Icons.Rounded.CalendarMonth, t.primary, Modifier.weight(1f)) { onOpenTab(1) }
                QuickAction("Records", Icons.Rounded.LocalPharmacy, t.teal, Modifier.weight(1f)) { onOpenTab(2) }
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction("Bills", Icons.Rounded.Payments, t.amber, Modifier.weight(1f)) { onOpenTab(3) }
                QuickAction("Find Hospital", Icons.Rounded.Search, t.cyan, Modifier.weight(1f)) { onOpenTab(3) }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SpecialistChip(label: String, color: Color, selected: Boolean) {
    val t = HoscoreTokens.current
    Box(
        Modifier
            .clip(CircleShape)
            .background(if (selected) color else t.card)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Black, color = if (selected) Color.White else t.textMuted)
    }
}

@Composable
private fun PatientMetricTile(title: String, value: String, sub: String, modifier: Modifier = Modifier) {
    Box(
        modifier
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.15f))
            .padding(12.dp)
    ) {
        Column {
            Text(value, fontSize = 15.sp, fontWeight = FontWeight.Black, color = Color.White)
            Spacer(Modifier.height(2.dp))
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(sub, fontSize = 9.5.sp, color = Color.White.copy(0.75f))
        }
    }
}

@Composable
private fun IconPill(icon: ImageVector, onClick: () -> Unit) {
    val t = HoscoreTokens.current
    Box(
        Modifier.size(40.dp).clip(CircleShape).background(t.card).clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) { Icon(icon, null, tint = t.textSecondary, modifier = Modifier.size(20.dp)) }
}

@Composable
fun QuickAction(label: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val t = HoscoreTokens.current
    HoscoreCard(modifier = modifier, onClick = onClick) {
        Column {
            Box(
                Modifier.size(42.dp).clip(CircleShape).background(color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) { Icon(icon, label, tint = color, modifier = Modifier.size(21.dp)) }
            Spacer(Modifier.height(12.dp))
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textPrimary)
        }
    }
}
