package com.example.hoscore.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.HealthAndSafety
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.ui.theme.HoscoreTokens



@Composable
fun LoginScreen(
    onLoggedIn: () -> Unit,
    vm: AuthViewModel = viewModel(),
) {
    val state by vm.state.collectAsState()

    if (state.loggedIn) {
        onLoggedIn()
        return
    }

    if (state.challenge != null) {
        OtpScreen(vm = vm, onLoggedIn = onLoggedIn)
        return
    }

    val t = HoscoreTokens.current
    val context = LocalContext.current
    var isOtpTab by remember { mutableStateOf(false) }
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Box(
        Modifier
            .fillMaxSize()
            .background(t.screenBg)
            .imePadding(),
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Top Bar
            Row(
                Modifier.fillMaxWidth().padding(top = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(t.primary.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.LocalHospital, "HOSCORE", tint = t.primary, modifier = Modifier.size(22.dp))
                }
                Box(
                    Modifier
                        .clip(CircleShape)
                        .clickable { /* Skip to guest mode if applicable */ }
                        .padding(horizontal = 14.dp, vertical = 6.dp),
                ) {
                    Text("HOSCORE v2.0", fontSize = 12.sp, fontWeight = FontWeight.Black, color = t.primary)
                }
            }

            Spacer(Modifier.height(24.dp))

            // Modern Hero Graphic Box (Matching Image 3)
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(
                                t.primary,
                                Color(0xFF2563EB),
                                Color(0xFF1D4ED8),
                            )
                        )
                    )
                    .padding(20.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.HealthAndSafety, "Health", tint = Color.White, modifier = Modifier.size(36.dp))
                    }
                    Spacer(Modifier.height(12.dp))
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.25f))
                            .padding(horizontal = 14.dp, vertical = 4.dp),
                    ) {
                        Text("PATIENTS & HOSPITALS", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color.White)
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Headline matching Image 3
            Text(
                "Level Up Your\nHealth Game",
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = t.textPrimary,
                textAlign = TextAlign.Center,
                lineHeight = 34.sp,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Balanced clinical care. Real-time patient queues.\nInstant records & seamless hospital context.",
                fontSize = 13.sp,
                color = t.textMuted,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Medium,
            )

            Spacer(Modifier.height(24.dp))

            // Auth Mode Switcher Chips
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(t.card)
                    .border(1.dp, t.cardBorder, RoundedCornerShape(16.dp))
                    .padding(4.dp),
            ) {
                Box(
                    Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (!isOtpTab) t.primary else Color.Transparent)
                        .clickable { isOtpTab = false }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "Password Login",
                        fontWeight = FontWeight.Black,
                        fontSize = 13.sp,
                        color = if (!isOtpTab) Color.White else t.textMuted,
                    )
                }
                Box(
                    Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isOtpTab) t.primary else Color.Transparent)
                        .clickable { isOtpTab = true }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "OTP Access",
                        fontWeight = FontWeight.Black,
                        fontSize = 13.sp,
                        color = if (isOtpTab) Color.White else t.textMuted,
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            val fieldColors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = t.primary,
                unfocusedBorderColor = t.cardBorder,
                focusedTextColor = t.textPrimary,
                unfocusedTextColor = t.textPrimary,
                cursorColor = t.primary,
                focusedContainerColor = t.card,
                unfocusedContainerColor = t.card,
            )

            OutlinedTextField(
                value = identifier,
                onValueChange = { identifier = it; vm.clearError() },
                label = { Text(if (isOtpTab) "Phone number" else "Email or phone", color = t.textMuted) },
                singleLine = true,
                leadingIcon = { Icon(if (isOtpTab) Icons.Rounded.Phone else Icons.Rounded.LocalHospital, null, tint = t.primary) },
                shape = RoundedCornerShape(18.dp),
                colors = fieldColors,
                modifier = Modifier.fillMaxWidth(),
            )

            if (!isOtpTab) {
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; vm.clearError() },
                    label = { Text("Password", color = t.textMuted) },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Rounded.Lock, null, tint = t.primary) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    shape = RoundedCornerShape(18.dp),
                    colors = fieldColors,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Spacer(Modifier.height(14.dp))

            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Development Server", fontSize = 12.sp, color = t.textMuted, fontWeight = FontWeight.Bold)
                Switch(
                    checked = state.useDev,
                    onCheckedChange = { vm.setDev(context, it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = t.primary,
                        checkedTrackColor = t.primary.copy(alpha = 0.4f),
                    ),
                )
            }

            if (state.error != null) {
                Spacer(Modifier.height(10.dp))
                Text(state.error!!, color = t.clinical, fontSize = 13.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
            }

            Spacer(Modifier.height(22.dp))

            // Prominent Full-Width Pill Buttons (Matching Image 3)
            Button(
                onClick = {
                    if (isOtpTab) vm.startOtp(identifier) else vm.login(identifier, password)
                },
                enabled = !state.loading,
                shape = RoundedCornerShape(24.dp),
                colors = ButtonDefaults.buttonColors(containerColor = t.primary),
                modifier = Modifier.fillMaxWidth().height(56.dp),
            ) {
                if (state.loading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                } else {
                    Text(if (isOtpTab) "Send Verification Code" else "Sign In to Account", fontWeight = FontWeight.Black, fontSize = 16.sp)
                }
            }

            Spacer(Modifier.height(12.dp))

            OutlinedButton(
                onClick = { isOtpTab = !isOtpTab },
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.fillMaxWidth().height(52.dp),
                border = ButtonDefaults.outlinedButtonBorder.copy(brush = Brush.linearGradient(listOf(t.cardBorder, t.cardBorder))),
            ) {
                Text(if (isOtpTab) "Use Password Instead" else "Log In with Phone OTP", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = t.textPrimary)
            }

            Spacer(Modifier.height(28.dp))
        }
    }
}
