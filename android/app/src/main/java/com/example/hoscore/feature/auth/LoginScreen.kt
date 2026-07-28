package com.example.hoscore.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

private val Blue       = Color(0xFF3B5BDB)
private val BlueSoft   = Color(0xFFEEF2FF)
private val Teal       = Color(0xFF0D9488)
private val Purple     = Color(0xFF7C3AED)
private val Orange     = Color(0xFFF59E0B)
private val Pink       = Color(0xFFEC4899)
private val Green      = Color(0xFF10B981)
private val BGLight    = Color(0xFFF0F4FF)
private val TextDark   = Color(0xFF0F172A)
private val TextMid    = Color(0xFF64748B)

@Composable
fun LoginScreen(onLoggedIn: (() -> Unit)? = null) {
    val vm: AuthViewModel = viewModel()
    val state by vm.state.collectAsState()

    // mode: 0 = Password Login, 1 = OTP Login, 2 = Sign Up
    var mode by remember { mutableIntStateOf(0) }
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPwd by remember { mutableStateOf(false) }

    // Sign Up additional fields
    var signupName by remember { mutableStateOf("") }
    var signupEmail by remember { mutableStateOf("") }
    var signupPhone by remember { mutableStateOf("") }

    val challenge = state.challenge

    if (challenge != null) {
        OtpScreen(vm = vm, onLoggedIn = {})
        return
    }

    val submitForm = {
        when (mode) {
            0 -> vm.login(identifier, password)
            1 -> vm.startOtp(identifier)
            2 -> vm.register(signupName, signupEmail, password, signupPhone)
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(BGLight)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {

            // ── Hero card ────────────────────────────────────────────────────
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFF5C7CFA), Blue, Color(0xFF4C6EF5)))),
            ) {
                Box(Modifier.fillMaxSize()) {
                    // Floating icon bubbles
                    BubbleIcon(Icons.Rounded.HealthAndSafety, Teal,   TopStart(16.dp, 20.dp))
                    BubbleIcon(Icons.Rounded.Favorite,        Pink,   TopEnd(20.dp, 16.dp))
                    BubbleIcon(Icons.Rounded.LocalHospital,   Orange, BottomStart(20.dp, 24.dp))
                    BubbleIcon(Icons.Rounded.Shield,          Green,  BottomEnd(16.dp, 20.dp))

                    // Center shield icon
                    Box(
                        Modifier
                            .size(72.dp)
                            .align(Alignment.Center)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.25f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.HealthAndSafety, null, tint = Color.White, modifier = Modifier.size(38.dp))
                    }

                    // Badge pill
                    Box(
                        Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 16.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.22f))
                            .padding(horizontal = 14.dp, vertical = 5.dp),
                    ) {
                        Text("PATIENTS & HOSPITALS", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = 1.sp)
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // ── Title ───────────────────────────────────────────────────────
            Text(
                if (mode == 2) "Create Your\nAccount" else "Level Up Your\nHealth Game",
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = TextDark,
                textAlign = TextAlign.Center,
                lineHeight = 34.sp,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                if (mode == 2) "Join HOSCORE to manage healthcare seamlessly." else "Balanced nutrition. Tracked vitals. One platform.",
                fontSize = 13.sp,
                color = TextMid,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Medium,
            )

            Spacer(Modifier.height(20.dp))

            // ── 3-Tab switcher ────────────────────────────────────────────────
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.White)
                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(14.dp))
                    .padding(4.dp),
            ) {
                TabChip("Login", mode == 0) { mode = 0; vm.clearError() }
                TabChip("OTP Login", mode == 1) { mode = 1; vm.clearError() }
                TabChip("Sign Up", mode == 2) { mode = 2; vm.clearError() }
            }

            Spacer(Modifier.height(18.dp))

            // ── Input fields ────────────────────────────────────────────────
            if (mode == 2) {
                // Sign Up form
                AuthField(
                    value = signupName,
                    onChange = { signupName = it },
                    placeholder = "Full name",
                    icon = Icons.Rounded.Person,
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next,
                )
                Spacer(Modifier.height(12.dp))
                AuthField(
                    value = signupEmail,
                    onChange = { signupEmail = it },
                    placeholder = "Email address",
                    icon = Icons.Rounded.Email,
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next,
                )
                Spacer(Modifier.height(12.dp))
                AuthField(
                    value = signupPhone,
                    onChange = { signupPhone = it },
                    placeholder = "Phone number (optional)",
                    icon = Icons.Rounded.Phone,
                    keyboardType = KeyboardType.Phone,
                    imeAction = ImeAction.Next,
                )
                Spacer(Modifier.height(12.dp))
                AuthField(
                    value = password,
                    onChange = { password = it },
                    placeholder = "Password (min 6 chars)",
                    icon = Icons.Rounded.Lock,
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                    keyboardActions = KeyboardActions(onDone = { submitForm() }),
                    visualTransformation = if (showPwd) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        Icon(
                            if (showPwd) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                            null,
                            tint = TextMid,
                            modifier = Modifier
                                .size(20.dp)
                                .clickable { showPwd = !showPwd },
                        )
                    },
                )
            } else {
                // Login form
                AuthField(
                    value = identifier,
                    onChange = { identifier = it },
                    placeholder = if (mode == 1) "Phone number or email" else "Email or phone",
                    icon = if (mode == 1) Icons.Rounded.Phone else Icons.Rounded.Person,
                    keyboardType = if (mode == 1) KeyboardType.Phone else KeyboardType.Email,
                    imeAction = if (mode == 1) ImeAction.Done else ImeAction.Next,
                    keyboardActions = if (mode == 1) KeyboardActions(onDone = { submitForm() }) else KeyboardActions.Default,
                )

                if (mode == 0) {
                    Spacer(Modifier.height(12.dp))
                    AuthField(
                        value = password,
                        onChange = { password = it },
                        placeholder = "Password",
                        icon = Icons.Rounded.Lock,
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                        keyboardActions = KeyboardActions(onDone = { submitForm() }),
                        visualTransformation = if (showPwd) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            Icon(
                                if (showPwd) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                                null,
                                tint = TextMid,
                                modifier = Modifier
                                    .size(20.dp)
                                    .clickable { showPwd = !showPwd },
                            )
                        },
                    )
                }
            }

            // Error message
            if (!state.error.isNullOrEmpty()) {
                Spacer(Modifier.height(10.dp))
                Box(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFFF1F2))
                        .border(1.dp, Color(0xFFFFCDD2), RoundedCornerShape(12.dp))
                        .padding(12.dp),
                ) {
                    Text(state.error ?: "", color = Color(0xFFE11D48), fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }
            }

            Spacer(Modifier.height(22.dp))

            // ── Primary CTA ─────────────────────────────────────────────────
            val isLoading = state.loading
            Button(
                onClick = { submitForm() },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Blue),
                enabled = !isLoading,
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text(
                        when (mode) {
                            1 -> "Send OTP"
                            2 -> "Create Account"
                            else -> "Log In"
                        },
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        color = Color.White,
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // ── Secondary link ───────────────────────────────────────────────
            Row(horizontalArrangement = Arrangement.Center, modifier = Modifier.fillMaxWidth()) {
                if (mode == 2) {
                    Text("Already have an account? ", fontSize = 13.sp, color = TextMid)
                    Text(
                        "Log In",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = Blue,
                        modifier = Modifier.clickable { mode = 0; vm.clearError() },
                    )
                } else {
                    Text("Don't have an account? ", fontSize = 13.sp, color = TextMid)
                    Text(
                        "Sign Up",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = Blue,
                        modifier = Modifier.clickable { mode = 2; vm.clearError() },
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

@Composable
private fun RowScope.TabChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .weight(1f)
            .clip(RoundedCornerShape(10.dp))
            .background(if (selected) Blue else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            label,
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            color = if (selected) Color.White else TextMid,
        )
    }
}

@Composable
private fun AuthField(
    value: String,
    onChange: (String) -> Unit,
    placeholder: String,
    icon: ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailingIcon: @Composable (() -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        modifier = Modifier.fillMaxWidth(),
        textStyle = TextStyle(color = TextDark, fontSize = 15.sp, fontWeight = FontWeight.Medium),
        placeholder = { Text(placeholder, color = Color(0xFF94A3B8), fontSize = 14.sp) },
        leadingIcon = { Icon(icon, null, tint = Blue, modifier = Modifier.size(20.dp)) },
        trailingIcon = trailingIcon,
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
        keyboardActions = keyboardActions,
        visualTransformation = visualTransformation,
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Blue,
            unfocusedBorderColor = Color(0xFFE2E8F0),
            focusedContainerColor = Color.White,
            unfocusedContainerColor = Color.White,
            focusedTextColor = TextDark,
            unfocusedTextColor = TextDark,
            cursorColor = Blue,
        ),
    )
}

@Composable
private fun BoxScope.BubbleIcon(icon: ImageVector, tint: Color, alignModifier: Modifier) {
    Box(
        alignModifier
            .size(40.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.22f)),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, null, tint = Color.White, modifier = Modifier.size(20.dp))
    }
}

private fun BoxScope.TopStart(x: androidx.compose.ui.unit.Dp, y: androidx.compose.ui.unit.Dp) =
    Modifier.align(Alignment.TopStart).padding(start = x, top = y)

private fun BoxScope.TopEnd(x: androidx.compose.ui.unit.Dp, y: androidx.compose.ui.unit.Dp) =
    Modifier.align(Alignment.TopEnd).padding(end = x, top = y)

private fun BoxScope.BottomStart(x: androidx.compose.ui.unit.Dp, y: androidx.compose.ui.unit.Dp) =
    Modifier.align(Alignment.BottomStart).padding(start = x, bottom = y)

private fun BoxScope.BottomEnd(x: androidx.compose.ui.unit.Dp, y: androidx.compose.ui.unit.Dp) =
    Modifier.align(Alignment.BottomEnd).padding(end = x, bottom = y)
