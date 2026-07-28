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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.AccessGrant
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.theme.HoscoreTokens

private val DeepIndigo   = Color(0xFF1E1B4B)
private val Indigo       = Color(0xFF4F46E5)
private val IndigoSoft   = Color(0xFFEEF2FF)
private val Emerald      = Color(0xFF10B981)
private val EmeraldSoft  = Color(0xFFD1FAE5)
private val RoseRed      = Color(0xFFE11D48)
private val RoseSoft     = Color(0xFFFFE4E6)
private val Slate800     = Color(0xFF1E293B)
private val Slate100     = Color(0xFFF1F5F9)
private val SlateText    = Color(0xFF0F172A)
private val SlateMuted   = Color(0xFF64748B)

@Composable
fun MyPrivacyScreen(onBack: (() -> Unit)? = null) {
    val t = HoscoreTokens.current
    val vm: AccessGrantsVM = viewModel()

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Sovereign Privacy", "Access control & audit trail", onBack = onBack)

        DataScreen(vm) { grants ->
            val active  = grants.count { it.status == "ACTIVE" }
            val revoked = grants.count { it.status == "REVOKED" }

            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 24.dp),
            ) {
                // ── Privacy hero banner ────────────────────────────────────
                item {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(
                                Brush.linearGradient(listOf(DeepIndigo, Color(0xFF312E81), Slate800))
                            )
                            .padding(20.dp),
                    ) {
                        Column {
                            // DPDP badge
                            Surface(
                                shape = CircleShape,
                                color = Emerald.copy(alpha = 0.18f),
                                modifier = Modifier.border(1.dp, Emerald.copy(0.35f), CircleShape),
                            ) {
                                Row(
                                    Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                ) {
                                    Icon(Icons.Rounded.Shield, null, tint = Emerald, modifier = Modifier.size(14.dp))
                                    Text("Sovereign Privacy Panel", fontSize = 10.sp, color = Emerald, fontWeight = FontWeight.ExtraBold, letterSpacing = 0.5.sp)
                                }
                            }

                            Spacer(Modifier.height(12.dp))
                            Text("Access Control", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                            Text("& Real-time Audit Trail", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "HOSCORE enforces HIPAA & DPDP Act 2023 compliance. Revoke a physician's access instantly. Every read on your file is logged.",
                                fontSize = 12.sp, color = Color.White.copy(0.7f), lineHeight = 18.sp,
                            )

                            Spacer(Modifier.height(16.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                PrivacyStat("$active", "Active", Emerald)
                                PrivacyStat("$revoked", "Revoked", RoseRed)
                                PrivacyStat("${grants.size}", "Total Doctors", Indigo)
                            }
                        }
                    }
                }

                // ── Section header ─────────────────────────────────────────
                item {
                    Row(
                        Modifier.padding(horizontal = 20.dp, vertical = 8.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Rounded.Person, null, tint = Indigo, modifier = Modifier.size(20.dp))
                            Text("Physician Access Controls", fontWeight = FontWeight.Black, color = SlateText, fontSize = 15.sp)
                        }
                        Surface(shape = RoundedCornerShape(8.dp), color = Slate100) {
                            Text(
                                "${grants.size} Doctors",
                                Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                fontSize = 11.sp, fontWeight = FontWeight.Bold, color = SlateMuted,
                            )
                        }
                    }
                }

                // ── Empty state ────────────────────────────────────────────
                if (grants.isEmpty()) {
                    item {
                        EmptyState(
                            "No doctors registered",
                            "Doctors who have accessed your file will appear here.",
                            Icons.Rounded.Shield,
                        )
                    }
                }

                // ── Doctor access cards ────────────────────────────────────
                items(grants, key = { it.id }) { grant ->
                    DoctorAccessCard(
                        grant = grant,
                        onToggle = {
                            if (grant.status == "ACTIVE") vm.revoke(grant.id)
                            else vm.restore(grant.id)
                        },
                    )
                }

                // ── ABDM compliance footer ─────────────────────────────────
                item {
                    Spacer(Modifier.height(8.dp))
                    Column(
                        Modifier
                            .padding(horizontal = 16.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(IndigoSoft)
                            .border(1.dp, Indigo.copy(0.15f), RoundedCornerShape(16.dp))
                            .padding(16.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Rounded.Lock, null, tint = Indigo, modifier = Modifier.size(16.dp))
                            Text("ABDM Consent Manager", fontWeight = FontWeight.Black, color = Indigo, fontSize = 13.sp)
                            Spacer(Modifier.weight(1f))
                            Surface(shape = CircleShape, color = EmeraldSoft) {
                                Text("ACTIVE", Modifier.padding(horizontal = 8.dp, vertical = 2.dp), fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, color = Emerald)
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Your health records are end-to-end encrypted. Only authorized clinical staff with active consent tokens can view your consultations. Data shared under the DPDP Act 2023 framework.",
                            fontSize = 11.sp, color = Indigo.copy(0.75f), lineHeight = 16.sp,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PrivacyStat(value: String, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 22.sp, fontWeight = FontWeight.Black, color = color)
        Text(label, fontSize = 10.sp, color = Color.White.copy(0.65f), fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun DoctorAccessCard(grant: AccessGrant, onToggle: () -> Unit) {
    val isActive = grant.status == "ACTIVE"
    val cardBorder by animateColorAsState(
        if (isActive) Emerald.copy(0.2f) else RoseRed.copy(0.15f),
        animationSpec = tween(300),
        label = "cardBorder",
    )
    val badgeBg by animateColorAsState(
        if (isActive) EmeraldSoft else RoseSoft,
        animationSpec = tween(300),
        label = "badgeBg",
    )
    val badgeColor by animateColorAsState(
        if (isActive) Emerald else RoseRed,
        animationSpec = tween(300),
        label = "badgeColor",
    )

    val initials = grant.name.split(" ").filter { it.isNotEmpty() }.take(2)
        .joinToString("") { it.first().uppercase() }.ifEmpty { "DR" }

    Column(
        Modifier
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, cardBorder, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Avatar
            Box(
                Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (isActive) IndigoSoft else Slate100),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    initials,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isActive) Indigo else SlateMuted,
                )
            }

            Spacer(Modifier.width(12.dp))

            Column(Modifier.weight(1f)) {
                Text(grant.name, fontWeight = FontWeight.Bold, color = SlateText, fontSize = 14.sp)
                Text(
                    listOfNotNull(grant.specialty, grant.hospitalName).joinToString(" · ").ifEmpty { "General Practitioner" },
                    color = SlateMuted, fontSize = 11.sp,
                )
            }

            // Status badge
            Surface(shape = RoundedCornerShape(8.dp), color = badgeBg) {
                Text(
                    grant.status,
                    Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                    fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = badgeColor,
                )
            }
        }

        Spacer(Modifier.height(10.dp))

        // Revoke / Restore button
        OutlinedButton(
            onClick = onToggle,
            modifier = Modifier.fillMaxWidth().height(36.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = if (isActive) RoseRed else Emerald,
            ),
            border = androidx.compose.foundation.BorderStroke(1.dp, if (isActive) RoseRed.copy(0.4f) else Emerald.copy(0.4f)),
        ) {
            Icon(
                if (isActive) Icons.Rounded.RemoveCircle else Icons.Rounded.AddCircle,
                null,
                modifier = Modifier.size(15.dp),
            )
            Spacer(Modifier.width(6.dp))
            Text(
                if (isActive) "Revoke Access" else "Restore Access",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}
