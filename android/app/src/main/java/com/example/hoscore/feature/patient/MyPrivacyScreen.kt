package com.example.hoscore.feature.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun MyPrivacyScreen(onBack: (() -> Unit)? = null) {
    val t = HoscoreTokens.current
    Column(Modifier.fillMaxSize().background(t.screenBg).verticalScroll(rememberScrollState())) {
        HoscoreTopBar("Sovereign Privacy", "Data access consent & controls", onBack = onBack)
        Column(Modifier.padding(20.dp)) {
            HoscoreCard(Modifier.fillMaxWidth()) {
                Column {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("ABDM Consent Manager", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                        StatusBadge("ACTIVE", t.emerald)
                    }
                    Spacer(Modifier.height(6.dp))
                    Text("Your health records are encrypted. Only authorized clinical staff with active consent tokens can view your consultations.", color = t.textMuted, fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(16.dp))

            HoscoreCard(Modifier.fillMaxWidth()) {
                Column {
                    Text("Doctor Data Access", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Spacer(Modifier.height(4.dp))
                    Text("Revoke or grant instant 24-hour access to attending doctors during inpatient visits.", color = t.textMuted, fontSize = 12.sp)
                }
            }
        }
    }
}
