package com.example.hoscore.feature.onboarding

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material.icons.rounded.Biotech
import androidx.compose.material.icons.rounded.MonitorHeart
import androidx.compose.material.icons.rounded.MedicalServices
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─────────────────────────────────────────────────────────────────────────────
// Per-page content model
// ─────────────────────────────────────────────────────────────────────────────
private data class OnboardPage(
    val tag: String,
    val title: String,
    val subtitle: String,
    val gradientStart: Color,
    val gradientEnd: Color,
    val accentColor: Color,
    val icons: List<Pair<ImageVector, Color>>,
)

private val PAGES = listOf(
    OnboardPage(
        tag = "SMART HOSPITAL",
        title = "Smarter Hospital\nManagement",
        subtitle = "Real-time OPD queues, bed tracking, doctor scheduling & complete ward visibility — all in one powerful dashboard.",
        gradientStart = Color(0xFF0EA5E9),
        gradientEnd = Color(0xFF2563EB),
        accentColor = Color(0xFF38BDF8),
        icons = listOf(
            Icons.Rounded.LocalHospital to Color(0xFF38BDF8),
            Icons.Rounded.MonitorHeart to Color(0xFFA78BFA),
            Icons.Rounded.MedicalServices to Color(0xFF34D399),
            Icons.Rounded.Biotech to Color(0xFFFBBF24),
        ),
    ),
    OnboardPage(
        tag = "YOUR HEALTH",
        title = "Your Complete\nHealth Story",
        subtitle = "Track vitals, appointments, prescriptions, vaccinations & bills — your entire health record, always at your fingertips.",
        gradientStart = Color(0xFF8B5CF6),
        gradientEnd = Color(0xFFEC4899),
        accentColor = Color(0xFFA78BFA),
        icons = listOf(
            Icons.Rounded.Favorite to Color(0xFFF87171),
            Icons.Rounded.VerifiedUser to Color(0xFF34D399),
            Icons.Rounded.Star to Color(0xFFFBBF24),
            Icons.Rounded.Person to Color(0xFF60A5FA),
        ),
    ),
    OnboardPage(
        tag = "LEVEL UP",
        title = "Level Up Your\nHealth Game",
        subtitle = "Join thousands managing their health smarter. Create an account or log in to get started with HOSCORE.",
        gradientStart = Color(0xFF10B981),
        gradientEnd = Color(0xFF0EA5E9),
        accentColor = Color(0xFF34D399),
        icons = listOf(
            Icons.Rounded.MonitorHeart to Color(0xFF34D399),
            Icons.Rounded.Star to Color(0xFFFBBF24),
            Icons.Rounded.Favorite to Color(0xFFF87171),
            Icons.Rounded.VerifiedUser to Color(0xFF60A5FA),
        ),
    ),
)

// ─────────────────────────────────────────────────────────────────────────────
// Main Onboarding Screen
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun OnboardingScreen(
    onFinish: () -> Unit,      // Called with "create" or "login" intent
) {
    var page by remember { mutableStateOf(0) }
    val current = PAGES[page]

    Box(
        Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FE))
    ) {
        // Animated page content
        AnimatedContent(
            targetState = page,
            transitionSpec = {
                (slideInHorizontally(tween(400)) { it } + fadeIn(tween(300))) togetherWith
                    (slideOutHorizontally(tween(400)) { -it } + fadeOut(tween(200)))
            },
            label = "onboard"
        ) { idx ->
            val p = PAGES[idx]
            OnboardPageContent(p)
        }

        // Bottom controls — always on top
        Column(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 28.dp, vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Dot indicators
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                PAGES.forEachIndexed { i, _ ->
                    val w by animateDpAsState(if (i == page) 24.dp else 8.dp, tween(250), label = "dot$i")
                    Box(
                        Modifier
                            .height(8.dp)
                            .width(w)
                            .clip(CircleShape)
                            .background(if (i == page) current.gradientStart else Color(0xFFCBD5E1)),
                    )
                }
            }

            Spacer(Modifier.height(28.dp))

            if (page < PAGES.lastIndex) {
                // Next button
                Button(
                    onClick = { page++ },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = current.gradientStart),
                ) {
                    Text("Next", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
                }
                Spacer(Modifier.height(14.dp))
                Text(
                    "Skip",
                    modifier = Modifier
                        .clickable { onFinish() }
                        .padding(vertical = 8.dp),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                )
            } else {
                // Last page: Create Account + Log In
                Button(
                    onClick = { onFinish() },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = current.gradientStart),
                ) {
                    Text("Create Account", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
                }
                Spacer(Modifier.height(12.dp))
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color.White)
                        .clickable { onFinish() },
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "Log In",
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        color = current.gradientStart,
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Page Layout
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun OnboardPageContent(page: OnboardPage) {
    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(24.dp))

        // Hero illustration box
        Box(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp)
                .height(340.dp)
                .clip(RoundedCornerShape(32.dp))
                .background(
                    Brush.linearGradient(
                        listOf(page.gradientStart, page.gradientEnd)
                    )
                ),
            contentAlignment = Alignment.Center,
        ) {
            // Floating icon bubbles
            Box(Modifier.fillMaxSize()) {
                FloatingIconBubble(page.icons[0], Alignment.TopStart, Modifier.padding(24.dp))
                FloatingIconBubble(page.icons[1], Alignment.TopEnd, Modifier.padding(24.dp))
                FloatingIconBubble(page.icons[2], Alignment.BottomStart, Modifier.padding(24.dp))
                FloatingIconBubble(page.icons[3], Alignment.BottomEnd, Modifier.padding(24.dp))

                // Central large icon
                Box(
                    Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f))
                        .align(Alignment.Center),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        page.icons[0].first,
                        null,
                        tint = Color.White,
                        modifier = Modifier.size(52.dp),
                    )
                }

                // Tag pill at bottom
                Box(
                    Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 20.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.25f))
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                ) {
                    Text(
                        page.tag,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = 1.5.sp,
                    )
                }
            }
        }

        Spacer(Modifier.height(36.dp))

        // Title
        Text(
            page.title,
            fontSize = 28.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF0F172A),
            textAlign = TextAlign.Center,
            lineHeight = 34.sp,
            modifier = Modifier.padding(horizontal = 28.dp),
        )

        Spacer(Modifier.height(14.dp))

        // Subtitle
        Text(
            page.subtitle,
            fontSize = 14.sp,
            fontWeight = FontWeight.Normal,
            color = Color(0xFF64748B),
            textAlign = TextAlign.Center,
            lineHeight = 21.sp,
            modifier = Modifier.padding(horizontal = 32.dp),
        )
    }
}

@Composable
private fun FloatingIconBubble(
    pair: Pair<ImageVector, Color>,
    alignment: Alignment,
    modifier: Modifier = Modifier,
) {
    Box(
        Modifier.fillMaxSize(),
        contentAlignment = alignment,
    ) {
        Box(
            modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.22f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(pair.first, null, tint = pair.second, modifier = Modifier.size(24.dp))
        }
    }
}
