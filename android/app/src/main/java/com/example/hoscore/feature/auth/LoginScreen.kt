package com.example.hoscore.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Box(
        Modifier
            .fillMaxSize()
            .background(t.screenBg)
            .imePadding(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(Brush.linearGradient(listOf(t.heroStart, t.heroEnd))),
                contentAlignment = Alignment.Center,
            ) { Icon(Icons.Rounded.LocalHospital, "HOSCORE", tint = Color.White, modifier = Modifier.size(38.dp)) }

            Spacer(Modifier.height(20.dp))
            Text("HOSCORE", fontSize = 30.sp, fontWeight = FontWeight.Black, color = t.textPrimary, letterSpacing = (-1).sp)
            Text("Hospital Operations System", fontSize = 13.sp, color = t.textSecondary, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(28.dp))

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
                label = { Text("Email or phone", color = t.textSecondary) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                colors = fieldColors,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(14.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it; vm.clearError() },
                label = { Text("Password", color = t.textSecondary) },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                shape = RoundedCornerShape(14.dp),
                colors = fieldColors,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(14.dp))
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Local dev environment", fontSize = 12.sp, color = t.textSecondary, fontWeight = FontWeight.SemiBold)
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
                Spacer(Modifier.height(12.dp))
                Text(state.error!!, color = t.clinical, fontSize = 12.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            }

            Spacer(Modifier.height(20.dp))
            Button(
                onClick = { vm.login(identifier, password) },
                enabled = !state.loading,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = t.primary),
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                if (state.loading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                else Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }

            Spacer(Modifier.height(8.dp))
            TextButton(onClick = { /* passwordless start could be added here */ }) {
                Text("Having trouble signing in?", fontSize = 12.sp, color = t.textMuted)
            }
        }
    }
}
