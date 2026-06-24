package com.example.hoscore.ui.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.R
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onSplashComplete: () -> Unit
) {
    // Fades and transitions configuration
    LaunchedEffect(key1 = true) {
        delay(2000)
        onSplashComplete()
    }

    // Colors
    val hoscoreRed = Color(0xFFEF4444)
    val textDark = Color(0xFF0A0A0A)
    val textGray = Color(0xFF64748B)

    // Infinite heartbeat pulse animation for the logo
    val infiniteTransition = rememberInfiniteTransition(label = "HeartbeatTransition")
    val scaleFactor by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "PulseScale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            // Pulse Logo Image
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .padding(bottom = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = "HOSCORE Logo",
                    modifier = Modifier.size(130.dp * scaleFactor)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Brand Text
            Text(
                text = "HOSCORE",
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                color = textDark,
                letterSpacing = 2.sp
            )

            Text(
                text = "Hospital Operating System Network",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = textGray,
                letterSpacing = 0.5.sp,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Loader
            CircularProgressIndicator(
                color = hoscoreRed,
                strokeWidth = 3.dp,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}
