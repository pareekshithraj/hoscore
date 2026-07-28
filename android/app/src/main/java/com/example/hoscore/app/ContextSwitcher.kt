package com.example.hoscore.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Apartment
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.model.ContextItem

// Portal accent colours — light theme
private val patientGradient  = listOf(Color(0xFF3B5BDB), Color(0xFF5C7CFA))
private val hospitalGradient = listOf(Color(0xFF0D9488), Color(0xFF2DD4BF))
private val adminGradient    = listOf(Color(0xFF7C3AED), Color(0xFFA855F7))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContextSwitcherSheet(
    contexts: List<ContextItem>,
    activeContext: ContextItem?,
    isSwitching: Boolean = false,
    onPick: (ContextItem) -> Unit,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFFF8F9FE),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 36.dp),
        ) {
            // Handle
            Box(
                Modifier
                    .width(40.dp)
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFCBD5E1))
                    .align(Alignment.CenterHorizontally),
            )
            Spacer(Modifier.height(20.dp))

            Text(
                "Switch Workspace",
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF0F172A),
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Tap a workspace to switch your active dashboard.",
                fontSize = 13.sp,
                color = Color(0xFF64748B),
                fontWeight = FontWeight.Medium,
            )
            Spacer(Modifier.height(20.dp))

            if (isSwitching) {
                Box(Modifier.fillMaxWidth().padding(vertical = 24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF3B5BDB))
                }
            } else {
                contexts.forEach { ctx ->
                    val isActive = ctx.type == activeContext?.type && ctx.hospitalId == activeContext?.hospitalId
                    val (gradient, icon, label, sub) = when (ctx.type) {
                        "hospital"   -> Quad(hospitalGradient, Icons.Rounded.Apartment,  ctx.hospitalName ?: "Hospital", "Staff · ${ctx.role ?: ""}")
                        "superadmin" -> Quad(adminGradient,    Icons.Rounded.Shield,      "Super Admin",                  "Platform Control")
                        else         -> Quad(patientGradient,  Icons.Rounded.Person,      "Patient Portal",              "Personal Health Profile")
                    }

                    Box(
                        Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (isActive) Color.White else Color.White.copy(alpha = 0.7f))
                            .clickable(enabled = !isActive) { onPick(ctx) }
                            .padding(16.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Gradient icon bubble
                            Box(
                                Modifier
                                    .size(50.dp)
                                    .clip(CircleShape)
                                    .background(Brush.linearGradient(gradient)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(icon, label, tint = Color.White, modifier = Modifier.size(24.dp))
                            }

                            Spacer(Modifier.size(14.dp))

                            Column(Modifier.weight(1f)) {
                                Text(label, fontWeight = FontWeight.Black, color = Color(0xFF0F172A), fontSize = 15.sp)
                                Text(sub, color = Color(0xFF64748B), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            }

                            if (isActive) {
                                Icon(
                                    Icons.Rounded.CheckCircle,
                                    "Active",
                                    tint = gradient.first(),
                                    modifier = Modifier.size(22.dp),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/** Simple 4-tuple to avoid Destructured Triple for 4 elements */
private data class Quad<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)
private operator fun <A, B, C, D> Quad<A, B, C, D>.component1() = a
private operator fun <A, B, C, D> Quad<A, B, C, D>.component2() = b
private operator fun <A, B, C, D> Quad<A, B, C, D>.component3() = c
private operator fun <A, B, C, D> Quad<A, B, C, D>.component4() = d
