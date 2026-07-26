package com.example.hoscore.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Apartment
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.model.ContextItem
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.theme.HoscoreTokens

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContextSwitcherSheet(
    contexts: List<ContextItem>,
    activeContext: ContextItem?,
    onPick: (ContextItem) -> Unit,
    onDismiss: () -> Unit,
) {
    val t = HoscoreTokens.current
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = t.card) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(bottom = 28.dp)) {
            Text("Switch Workspace", fontSize = 18.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
            Spacer(Modifier.size(4.dp))
            Text("Select an environment to switch active permissions and data.", fontSize = 12.sp, color = t.textMuted)
            Spacer(Modifier.size(16.dp))
            contexts.forEach { ctx ->
                val (icon, label, sub) = when (ctx.type) {
                    "hospital" -> Triple(Icons.Rounded.Apartment, ctx.hospitalName ?: "Hospital", "Staff · ${ctx.role ?: ""}")
                    "superadmin" -> Triple(Icons.Rounded.Shield, "Super Admin", "Platform Control")
                    else -> Triple(Icons.Rounded.Person, "Patient Portal", "Personal Health Profile")
                }
                val active = ctx.type == activeContext?.type && ctx.hospitalId == activeContext?.hospitalId
                HoscoreCard(
                    Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    onClick = { onPick(ctx) },
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(44.dp).clip(CircleShape)
                                .background((if (active) t.primary else t.textMuted).copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center,
                        ) { Icon(icon, label, tint = if (active) t.primary else t.textSecondary, modifier = Modifier.size(22.dp)) }
                        Spacer(Modifier.size(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(label, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                            Text(sub, color = t.textMuted, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        }
                        if (active) {
                            Box(
                                Modifier.clip(CircleShape).background(t.primary.copy(alpha = 0.15f)).padding(horizontal = 10.dp, vertical = 4.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text("Active", color = t.primary, fontWeight = FontWeight.Black, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
