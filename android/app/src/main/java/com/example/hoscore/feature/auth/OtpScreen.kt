package com.example.hoscore.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.delay

@Composable
fun OtpScreen(vm: AuthViewModel, onLoggedIn: () -> Unit) {
    val state by vm.state.collectAsState()
    val t = HoscoreTokens.current
    var code by remember { mutableStateOf("") }
    val focus = remember { FocusRequester() }
    var resendIn by remember { mutableIntStateOf(30) }

    if (state.loggedIn) { onLoggedIn(); return }

    LaunchedEffect(Unit) { focus.requestFocus() }
    LaunchedEffect(resendIn) {
        if (resendIn > 0) { delay(1000); resendIn -= 1 }
    }

    Column(
        Modifier.fillMaxSize().background(t.screenBg).padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(60.dp))
        Text("Verify it's you", fontSize = 24.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
        Spacer(Modifier.height(8.dp))
        Text(
            "Enter the 6-digit code sent to your ${if (state.otpChannel == "phone") "phone" else "email"}.",
            fontSize = 13.sp, color = t.textSecondary, textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(28.dp))

        // Hidden field drives the 6 visible boxes.
        Box {
            BasicTextField(
                value = code,
                onValueChange = { if (it.length <= 6 && it.all(Char::isDigit)) { code = it; vm.clearError() } },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                modifier = Modifier.size(1.dp).focusRequester(focus),
                textStyle = TextStyle(color = Color.Transparent),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                repeat(6) { i ->
                    val char = code.getOrNull(i)?.toString() ?: ""
                    val filled = char.isNotEmpty()
                    Box(
                        Modifier
                            .size(width = 46.dp, height = 56.dp)
                            .background(t.card, RoundedCornerShape(12.dp))
                            .border(
                                width = if (filled) 2.dp else 1.dp,
                                color = if (filled) t.primary else t.cardBorder,
                                shape = RoundedCornerShape(12.dp),
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(char, fontSize = 22.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
                    }
                }
            }
        }

        if (state.challenge?.required?.email == true && state.challenge?.required?.phone == true) {
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("phone", "email").forEach { ch ->
                    val active = state.otpChannel == ch
                    TextButton(onClick = { vm.switchOtpChannel(ch) }) {
                        Text(
                            if (ch == "phone") "Use phone" else "Use email",
                            color = if (active) t.primary else t.textMuted,
                            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 12.sp,
                        )
                    }
                }
            }
        }

        if (state.error != null) {
            Spacer(Modifier.height(14.dp))
            Text(state.error!!, color = t.clinical, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.height(24.dp))
        Button(
            onClick = { vm.verifyOtp(code) },
            enabled = !state.loading && code.length >= 4,
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = t.primary),
            modifier = Modifier.fillMaxWidth().height(52.dp),
        ) {
            if (state.loading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
            else Text("Verify", fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (resendIn > 0) {
                Text("Resend code in ${resendIn}s", fontSize = 12.sp, color = t.textMuted)
            } else {
                TextButton(onClick = { vm.resendOtp(); resendIn = 30 }) {
                    Text("Resend code", fontSize = 12.sp, color = t.primary, fontWeight = FontWeight.Bold)
                }
            }
        }
        TextButton(onClick = { vm.cancelOtp() }) {
            Text("Back to sign in", fontSize = 12.sp, color = t.textMuted)
        }
    }
}
