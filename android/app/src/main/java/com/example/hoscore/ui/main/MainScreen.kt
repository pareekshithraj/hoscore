package com.example.hoscore.ui.main

import android.annotation.SuppressLint
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation3.runtime.NavKey
import androidx.compose.ui.layout.layout
import android.webkit.JavascriptInterface

private const val LOCAL_CLIENT_URL = "http://10.0.2.2:5173"

data class AppTheme(
    val name: String,
    val primary: Color,
    val dark: Color,
    val light: Color,
    val gradientStart: Color,
    val gradientEnd: Color
)

/**
 * Surface palette that mirrors the web client's light/dark tokens (index.css)
 * so the native dashboard stays in visual sync with the web dashboards.
 */
data class DashboardPalette(
    val screenBg: Color,
    val card: Color,
    val cardBorder: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val gridLine: Color,
    val innerBg: Color,
    val isDark: Boolean
)

private val LightDashboardPalette = DashboardPalette(
    screenBg = Color(0xFFF8FAFC),
    card = Color.White,
    cardBorder = Color(0xFFE2E8F0),
    textPrimary = Color(0xFF0F172A),
    textSecondary = Color(0xFF64748B),
    textMuted = Color(0xFF94A3B8),
    gridLine = Color(0xFFF1F5F9),
    innerBg = Color(0xFFF8FAFC),
    isDark = false
)

private val DarkDashboardPalette = DashboardPalette(
    screenBg = Color(0xFF0F172A),
    card = Color(0xFF1E293B),
    cardBorder = Color(0xFF334155),
    textPrimary = Color(0xFFF8FAFC),
    textSecondary = Color(0xFFCBD5E1),
    textMuted = Color(0xFF94A3B8),
    gridLine = Color(0x14FFFFFF),
    innerBg = Color(0xFF0F172A),
    isDark = true
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier,
) {
    var selectedTab by remember { mutableStateOf(0) }
    var currentWebUrl by remember { mutableStateOf("$LOCAL_CLIENT_URL/") }
    var syncUser by remember { mutableStateOf<SyncUserState?>(null) }
    var showTelemetryDialog by remember { mutableStateOf(false) }
    var darkMode by remember { mutableStateOf(false) }
    val palette = if (darkMode) DarkDashboardPalette else LightDashboardPalette

    val AppThemes = remember {
        listOf(
            AppTheme("Red", Color(0xFFE11D48), Color(0xFF9F1239), Color(0xFFFFF1F2), Color(0xFFE11D48), Color(0xFFBE123C)),
            AppTheme("Blue", Color(0xFF4F46E5), Color(0xFF3730A3), Color(0xFFEEF2FF), Color(0xFF4F46E5), Color(0xFF3730A3)),
            AppTheme("Teal", Color(0xFF0D9488), Color(0xFF115E59), Color(0xFFF0FDFA), Color(0xFF0D9488), Color(0xFF115E59)),
            AppTheme("Purple", Color(0xFF7C3AED), Color(0xFF5B21B6), Color(0xFFF5F3FF), Color(0xFF7C3AED), Color(0xFF5B21B6))
        )
    }
    var currentTheme by remember { mutableStateOf(AppThemes[0]) }

    Scaffold(
        floatingActionButton = {
            Box(
                modifier = Modifier
                    .offset(y = 44.dp) // Offset to overlap the floating bottom bar
                    .size(56.dp)
                    .shadow(8.dp, CircleShape)
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(currentTheme.primary, currentTheme.gradientEnd)
                        ),
                        shape = CircleShape
                    )
                    .clickable { 
                        currentWebUrl = "$LOCAL_CLIENT_URL/"
                        selectedTab = 2
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = "Quick Stats",
                    tint = Color.White,
                    modifier = Modifier.size(26.dp)
                )
            }
        },
        floatingActionButtonPosition = FabPosition.Center,
        bottomBar = {
            NavigationBar(
                containerColor = palette.card,
                tonalElevation = 0.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp) // Floating pill nav
                    .height(72.dp)
                    .shadow(16.dp, RoundedCornerShape(24.dp))
                    .border(1.dp, palette.cardBorder, RoundedCornerShape(24.dp))
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    label = { Text("Dashboard", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold) },
                    icon = { Icon(imageVector = Icons.Default.Home, contentDescription = "Home", modifier = Modifier.size(22.dp)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = currentTheme.primary,
                        unselectedIconColor = Color(0xFF94A3B8),
                        selectedTextColor = currentTheme.primary,
                        unselectedTextColor = Color(0xFF94A3B8),
                        indicatorColor = currentTheme.primary.copy(alpha = 0.08f)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    label = { Text("Find Hospital", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold) },
                    icon = { Icon(imageVector = Icons.Default.Search, contentDescription = "Search", modifier = Modifier.size(22.dp)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = currentTheme.primary,
                        unselectedIconColor = Color(0xFF94A3B8),
                        selectedTextColor = currentTheme.primary,
                        unselectedTextColor = Color(0xFF94A3B8),
                        indicatorColor = currentTheme.primary.copy(alpha = 0.08f)
                    )
                )
                
                // Spacer for center overlapping FAB
                Spacer(modifier = Modifier.weight(0.7f))

                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    label = { Text("Web Console", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold) },
                    icon = { Icon(imageVector = Icons.Default.Person, contentDescription = "Console", modifier = Modifier.size(22.dp)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = currentTheme.primary,
                        unselectedIconColor = Color(0xFF94A3B8),
                        selectedTextColor = currentTheme.primary,
                        unselectedTextColor = Color(0xFF94A3B8),
                        indicatorColor = currentTheme.primary.copy(alpha = 0.08f)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { showTelemetryDialog = true },
                    label = { Text("Telemetry", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold) },
                    icon = { Icon(imageVector = Icons.Default.Warning, contentDescription = "Telemetry", modifier = Modifier.size(22.dp)) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = currentTheme.primary,
                        unselectedIconColor = Color(0xFF94A3B8),
                        selectedTextColor = currentTheme.primary,
                        unselectedTextColor = Color(0xFF94A3B8),
                        indicatorColor = currentTheme.primary.copy(alpha = 0.08f)
                    )
                )
            }
        }
    ) { paddingValues ->
        Crossfade(
            targetState = selectedTab,
            modifier = modifier.padding(paddingValues),
            label = "TabTransition"
        ) { tab ->
            when (tab) {
                0 -> NativeDashboard(
                    syncUser = syncUser,
                    theme = currentTheme,
                    themes = AppThemes,
                    palette = palette,
                    darkMode = darkMode,
                    onToggleDarkMode = { darkMode = !darkMode },
                    onThemeChange = { currentTheme = it },
                    onSearchClick = { selectedTab = 1 },
                    onPortalClick = { url ->
                        currentWebUrl = url
                        selectedTab = 2
                    }
                )
                1 -> WebViewContainer(
                    url = "$LOCAL_CLIENT_URL/hospitals",
                    onUserSync = { name, role, type ->
                        syncUser = SyncUserState(name, role, type)
                    },
                    onUserClear = {
                        syncUser = null
                    }
                )
                2 -> WebViewContainer(
                    url = currentWebUrl,
                    onUserSync = { name, role, type ->
                        syncUser = SyncUserState(name, role, type)
                    },
                    onUserClear = {
                        syncUser = null
                    }
                )
            }
        }
    }

    if (showTelemetryDialog) {
        AlertDialog(
            onDismissRequest = { showTelemetryDialog = false },
            confirmButton = {
                Button(
                    onClick = { showTelemetryDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = currentTheme.primary)
                ) {
                    Text("Close Console")
                }
            },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Warning, contentDescription = "Telemetry", tint = currentTheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Command Center Telemetry", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Real-time telemetry and network socket statuses for the local Android client link.", fontSize = 12.sp, color = Color.Gray)
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                    TelemetryStatusRow(label = "HOSCORE Web Service", status = "Online (Port 5173)", success = true)
                    TelemetryStatusRow(label = "Clinical Websocket Protocol", status = "Connected & Active", success = true)
                    TelemetryStatusRow(label = "Ward Saturation Limit", status = "Normal Status (84%)", success = true)
                    TelemetryStatusRow(label = "ICU Backlog Queue", status = "0 Emergencies Pending", success = true)
                    TelemetryStatusRow(label = "EMR Encryption Scheme", status = "AES-256 GCM Secure", success = true)
                }
            },
            shape = RoundedCornerShape(16.dp),
            containerColor = Color.White
        )
    }
}

@Composable
fun TelemetryStatusRow(label: String, status: String, success: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(text = label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
            Text(text = status, fontSize = 11.sp, color = Color(0xFF64748B))
        }
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(if (success) Color(0xFF22C55E) else Color(0xFFEF4444), CircleShape)
        )
    }
}

@Composable
fun NativeDashboard(
    syncUser: SyncUserState?,
    theme: AppTheme,
    themes: List<AppTheme>,
    palette: DashboardPalette,
    darkMode: Boolean,
    onToggleDarkMode: () -> Unit,
    onThemeChange: (AppTheme) -> Unit,
    onSearchClick: () -> Unit,
    onPortalClick: (String) -> Unit
) {
    val scrollState = rememberScrollState()
    val horizontalScrollState = rememberScrollState()
    var onDuty by remember { mutableStateOf(true) }

    // Pulse animation for the Live indicator dot
    val infiniteTransition = rememberInfiniteTransition(label = "DotTransition")
    val dotAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "DotAlpha"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(palette.screenBg) // Premium soft slate background (light/dark aware)
            .verticalScroll(scrollState)
    ) {
        // 1. Sleek Top Profile Header (Screen 1 Overlapping Pill Card layout)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(palette.card)
        ) {
            Column {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(theme.gradientStart, theme.dark)
                            ),
                            shape = RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp)
                        )
                        .padding(horizontal = 20.dp, vertical = 24.dp)
                        .padding(bottom = 36.dp) // Extra padding for the overlapping pill
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                modifier = Modifier.weight(1f, fill = false),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val initials = if (syncUser != null) {
                                    syncUser.name.split(" ").filter { it.isNotEmpty() }.take(2).map { it[0] }.joinToString("").uppercase()
                                } else {
                                    "GU"
                                }
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                        .border(1.5.dp, Color.White, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = initials,
                                        color = Color.White,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    val displayName = syncUser?.name ?: "Guest User"
                                    val displaySub = when (syncUser?.contextType) {
                                        "patient" -> "Patient Portal"
                                        "superadmin" -> "Super Admin"
                                        "hospital" -> "Hospital Staff (${syncUser.role})"
                                        else -> "Access HOSCORE Services"
                                    }
                                    Text(
                                        text = displayName,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = displaySub,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Color.White.copy(alpha = 0.8f)
                                    )
                                }
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                themes.forEach { appTheme ->
                                    Box(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .background(appTheme.primary, CircleShape)
                                            .border(
                                                width = if (theme.name == appTheme.name) 2.dp else 0.dp,
                                                color = Color.White,
                                                shape = CircleShape
                                            )
                                            .clickable { onThemeChange(appTheme) }
                                    )
                                }
                                Spacer(modifier = Modifier.width(4.dp))
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .background(Color.White.copy(alpha = 0.15f), CircleShape)
                                        .clickable { onToggleDarkMode() },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (darkMode) Icons.Default.Star else Icons.Default.Settings,
                                        contentDescription = "Toggle theme",
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        Text(
                            text = "AVAILABLE SATURATION INDEX",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White.copy(alpha = 0.7f),
                            letterSpacing = 1.sp
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            val balanceVal = when (syncUser?.contextType) {
                                "patient" -> "Stable Vitals"
                                "superadmin" -> "99.9% Uptime"
                                "hospital" -> "84% Saturation"
                                else -> "Sign In to Console"
                            }
                            Text(
                                text = balanceVal,
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )

                            if (syncUser?.contextType == "hospital") {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color.White.copy(alpha = 0.2f))
                                        .clickable { onDuty = !onDuty }
                                        .padding(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .background(
                                                color = (if (onDuty) Color(0xFF22C55E) else Color.White).copy(alpha = dotAlpha),
                                                shape = CircleShape
                                            )
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (onDuty) "ON DUTY" else "OFF DUTY",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                    }
                }
                
                // Slate empty space to allow overlap
                Spacer(modifier = Modifier.height(28.dp).fillMaxWidth().background(palette.screenBg))
            }

            // Overlapping Card with quick actions (Screen 1 Pill Actions layout)
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .offset(y = (-8).dp)
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .shadow(8.dp, RoundedCornerShape(18.dp)),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = palette.card),
                border = BorderStroke(1.dp, palette.cardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp, horizontal = 8.dp),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val headerActions = when (syncUser?.contextType) {
                        "patient" -> listOf(
                            HeaderActionItem("Records", Icons.Default.Person, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/patient/records") },
                            HeaderActionItem("Rx", Icons.Default.Add, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/patient/prescriptions") },
                            HeaderActionItem("Visits", Icons.Default.Star, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/patient/appointments") },
                            HeaderActionItem("History", Icons.Default.Info, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/patient/bills") }
                        )
                        "superadmin" -> listOf(
                            HeaderActionItem("Hospitals", Icons.Default.Home, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/hospitals") },
                            HeaderActionItem("Licenses", Icons.Default.Check, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/subscriptions") },
                            HeaderActionItem("Billing", Icons.Default.Warning, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/usage") },
                            HeaderActionItem("Logs", Icons.Default.Search, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/users") }
                        )
                        else -> listOf(
                            HeaderActionItem("Queue", Icons.Default.Search, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/queue") },
                            HeaderActionItem("Admit", Icons.Default.Add, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/admissions") },
                            HeaderActionItem("Beds", Icons.Default.Home, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/rooms") },
                            HeaderActionItem("Shifts", Icons.Default.DateRange, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/shifts") }
                        )
                    }

                    headerActions.forEach { act ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clickable { act.action() }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(act.color.copy(alpha = 0.08f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = act.icon,
                                    contentDescription = act.title,
                                    tint = act.color,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = act.title,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = palette.textSecondary
                            )
                        }
                    }
                }
            }
        }

        // 2. Horizontal Overview Cards Carousel
        Column(modifier = Modifier.padding(top = 8.dp, bottom = 24.dp)) {
            val sectionTitle = when (syncUser?.contextType) {
                "patient" -> "Your Health Summary"
                "superadmin" -> "Global System Overview"
                "hospital" -> "Live Triage Command Overview"
                else -> "Explore HOSCORE Services"
            }
            Text(
                text = sectionTitle,
                fontSize = 16.sp, // Dream app design font size
                fontWeight = FontWeight.Black,
                color = palette.textPrimary,
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 12.dp)
            )
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(horizontalScrollState)
                    .padding(horizontal = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (syncUser == null) {
                    OverviewCard(
                        title = "HOSCORE WEB VERSION SYNC",
                        subtitle = "ACCOUNT NOT CONNECTED",
                        value = "Offline",
                        metricLabel = "Connection State",
                        gradient = Brush.linearGradient(colors = listOf(theme.gradientStart, theme.gradientEnd)),
                        bullets = listOf(
                            "• Tap Web Console below to log in or register",
                            "• Sync user credentials & roles automatically",
                            "• Access custom native analytics panels"
                        )
                    )
                    OverviewCard(
                        title = "PUBLIC DIRECTORY",
                        subtitle = "FIND REGISTERED HOSPITALS",
                        value = "Live",
                        metricLabel = "Resource Search",
                        gradient = Brush.linearGradient(colors = listOf(theme.dark, theme.gradientStart)),
                        bullets = listOf(
                            "• Search local clinical centers & wards",
                            "• Book appointments online directly",
                            "• No account required to search listings"
                        )
                    )
                } else if (syncUser.contextType == "patient") {
                    OverviewCard(
                        title = "APPOINTMENTS",
                        subtitle = "1 UPCOMING VISIT",
                        value = "Active",
                        metricLabel = "Booking Status",
                        gradient = Brush.linearGradient(colors = listOf(theme.gradientStart, theme.gradientEnd)),
                        bullets = listOf(
                            "• Dr. Pareekshith Raj - Cardiology",
                            "• Scheduled for tomorrow at 10:30 AM",
                            "• Location: Ward 3, General Hospital"
                        )
                    )
                    OverviewCard(
                        title = "PRESCRIPTIONS",
                        subtitle = "3 ACTIVE MEDICATIONS",
                        value = "Refills",
                        metricLabel = "Rx Management",
                        gradient = Brush.linearGradient(colors = listOf(theme.dark, theme.gradientStart)),
                        bullets = listOf(
                            "• Atorvastatin - Once daily before bed",
                            "• Lisinopril - Morning with breakfast",
                            "• 2 refills remaining on both prescriptions"
                        )
                    )
                    OverviewCard(
                        title = "BILLING DETAILS",
                        subtitle = "1 PENDING STATEMENT",
                        value = "$85.00",
                        metricLabel = "Co-pay Due",
                        gradient = Brush.linearGradient(colors = listOf(theme.gradientStart, theme.dark)),
                        bullets = listOf(
                            "• Outpatient consultation service fee",
                            "• Insurance claim submitted: Processing",
                            "• Due date: July 15, 2026"
                        )
                    )
                } else if (syncUser.contextType == "superadmin") {
                    OverviewCard(
                        title = "SYSTEM STATUS",
                        subtitle = "GLOBAL RESOURCES ONLINE",
                        value = "99.9%",
                        metricLabel = "API Uptime",
                        gradient = Brush.linearGradient(colors = listOf(theme.gradientStart, theme.gradientEnd)),
                        bullets = listOf(
                            "• Global Saturation level: 84% average",
                            "• Active database node connections: Stable",
                            "• All 12 clinical wards online & pinging"
                        )
                    )
                    OverviewCard(
                        title = "SUBSCRIPTIONS",
                        subtitle = "14 LICENSED HOSPITALS",
                        value = "+2 New",
                        metricLabel = "Monthly Signups",
                        gradient = Brush.linearGradient(colors = listOf(theme.dark, theme.gradientStart)),
                        bullets = listOf(
                            "• 12 active subscriptions, 2 pending review",
                            "• Renewal date for client nodes: July 1st",
                            "• Usage telemetry sync: AES-256 secure"
                        )
                    )
                } else {
                    OverviewCard(
                        title = "EMERGENCY TRIAGE",
                        subtitle = "3 RED ALERTS STANDING",
                        value = "92%",
                        metricLabel = "ICU Bed Capacity",
                        gradient = Brush.linearGradient(colors = listOf(theme.gradientStart, theme.gradientEnd)),
                        bullets = listOf(
                            "• Code Red in Ward 4A (Admitted)",
                            "• 2 ICU Beds currently available",
                            "• Telemetry alerts: Syncing active"
                        )
                    )
                    OverviewCard(
                        title = "OPD WAITING LOG",
                        subtitle = "18 ACTIVE APPOINTMENTS",
                        value = "14m",
                        metricLabel = "Avg Delay Time",
                        gradient = Brush.linearGradient(colors = listOf(theme.dark, theme.gradientStart)),
                        bullets = listOf(
                            "• OPD Saturation level: 84%",
                            "• Next slot: Token #104 (11:30 AM)",
                            "• Lab Orders: 4 pending reports"
                        )
                    )
                    OverviewCard(
                        title = "WARD OCCUPANCY",
                        subtitle = "42 BEDS ENGAGED",
                        value = "84%",
                        metricLabel = "Total Ward Load",
                        gradient = Brush.linearGradient(colors = listOf(theme.gradientStart, theme.dark)),
                        bullets = listOf(
                            "• General Ward beds occupied: 38/44",
                            "• Discharge status: 6 planned today",
                            "• Staff coverage index: 98% (Optimal)"
                        )
                    )
                }
            }
        }

        // 3. Operational Analytics Graph (Screen 2 Vertical Rounded Bar Chart)
        if (syncUser != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 20.dp)
                    .shadow(4.dp, RoundedCornerShape(16.dp)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = palette.card),
                border = BorderStroke(1.dp, palette.cardBorder)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    val chartLabel = when (syncUser.contextType) {
                        "patient" -> "HEART RATE ACTIVITY"
                        "superadmin" -> "SYSTEM REGISTERED ACCOUNTS"
                        else -> "WEEKLY PATIENT TRAFFIC"
                    }
                    val chartTitle = when (syncUser.contextType) {
                        "patient" -> "Vital Metrics (Last 7 Days)"
                        "superadmin" -> "Hospital Growth Index"
                        else -> "Overview Statistics"
                    }
                    val points = when (syncUser.contextType) {
                        "patient" -> listOf(72f, 65f, 78f, 68f, 70f, 62f, 66f)
                        else -> listOf(28f, 45f, 32f, 68f, 54f, 85f, 72f)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = chartLabel,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = theme.primary,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = chartTitle,
                                fontSize = 18.sp, // Dream app design font size
                                fontWeight = FontWeight.Black,
                                color = palette.textPrimary
                            )
                        }
                        Box(
                            modifier = Modifier
                                .background(theme.primary.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "Weekly",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = theme.primary
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    PatientVolumeChart(
                        points = points,
                        days = listOf("Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug"),
                        lineColor = theme.primary,
                        fillColor = theme.primary,
                        gridColor = palette.gridLine,
                        labelColor = palette.textMuted
                    )
                }
            }

            // 4. Side-by-Side Inflow/Outflow Cards (Screen 2 Side-by-Side widgets)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TrackerCard(
                    title = "Inflow / Admissions",
                    value = "42 Patients",
                    isPositive = true,
                    theme = theme,
                    modifier = Modifier.weight(1f)
                )
                TrackerCard(
                    title = "Outflow / Discharges",
                    value = "6 Patients",
                    isPositive = false,
                    theme = theme,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 5. Live High-Density Metrics Grid (2x2)
        val gridTitle = when (syncUser?.contextType) {
            "patient" -> "My Medical Dashboard"
            "superadmin" -> "Global System Parameters"
            "hospital" -> "Clinical Resource Saturation"
            else -> "System Quick Info"
        }
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = gridTitle,
                fontSize = 16.sp, // Dream app design font size
                fontWeight = FontWeight.Black,
                color = palette.textPrimary,
                modifier = Modifier.padding(bottom = 14.dp)
            )

            val gridItems = when (syncUser?.contextType) {
                "patient" -> listOf(
                    DetailedStatCardData("Active Rx", "3 Meds", "2 refills remaining", Icons.Default.Add, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Pending Visits", "1 Visit", "Cardiology Unit", Icons.Default.Home, theme.dark, theme.dark.copy(alpha = 0.2f)),
                    DetailedStatCardData("Vaccinations", "5 Received", "Up-to-date", Icons.Default.Star, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Bills Status", "Paid", "No pending statements", Icons.Default.Check, theme.dark, theme.dark.copy(alpha = 0.2f))
                )
                "superadmin" -> listOf(
                    DetailedStatCardData("Total Hospitals", "14 Active", "2 pending signups", Icons.Default.Home, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Average Saturation", "84% Load", "Near capacity warning", Icons.Default.Warning, theme.dark, theme.dark.copy(alpha = 0.2f)),
                    DetailedStatCardData("Global Users", "2,481 Registered", "Patients and doctors", Icons.Default.Person, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Billing Uptime", "99.9%", "Payment gateways normal", Icons.Default.Check, theme.dark, theme.dark.copy(alpha = 0.2f))
                )
                "hospital" -> listOf(
                    DetailedStatCardData("Total Wards", "12 Wards", "2 Isolation units", Icons.Default.Home, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Total Beds", "50 Slots", "8 Open ICU units", Icons.Default.Add, theme.dark, theme.dark.copy(alpha = 0.2f)),
                    DetailedStatCardData("Lab Backlog", "4 Orders", "Critical delays: None", Icons.Default.Warning, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Queue Load", "18 Active", "Avg 12m delay wait", Icons.Default.Star, theme.dark, theme.dark.copy(alpha = 0.2f))
                )
                else -> listOf(
                    DetailedStatCardData("Public Wards", "Open", "View listings now", Icons.Default.Home, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Availability", "Real-time", "Live bed check", Icons.Default.Star, theme.dark, theme.dark.copy(alpha = 0.2f)),
                    DetailedStatCardData("Public Search", "Integrated", "Lookup anywhere", Icons.Default.Search, theme.primary, theme.primary.copy(alpha = 0.2f)),
                    DetailedStatCardData("Console Status", "Awaiting Sync", "Login to proceed", Icons.Default.Info, theme.dark, theme.dark.copy(alpha = 0.2f))
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                DetailedStatCard(gridItems[0], palette, modifier = Modifier.weight(1f))
                DetailedStatCard(gridItems[1], palette, modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                DetailedStatCard(gridItems[2], palette, modifier = Modifier.weight(1f))
                DetailedStatCard(gridItems[3], palette, modifier = Modifier.weight(1f))
            }
        }

        // 6. Explore & Quick Actions (Blueprint Console style)
        val consoleTitle = when (syncUser?.contextType) {
            "patient" -> "Patient Command Console"
            "superadmin" -> "Super Admin Controls"
            "hospital" -> "Clinical Operations Console"
            else -> "Quick Command Console"
        }
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp) // Premium spacing at the bottom
        ) {
            Text(
                text = consoleTitle,
                fontSize = 16.sp, // Dream app design font size
                fontWeight = FontWeight.Black,
                color = palette.textPrimary,
                modifier = Modifier.padding(bottom = 14.dp)
            )

            val quickAccessItems = when (syncUser?.contextType) {
                "patient" -> listOf(
                    QuickAccessItem("My Appointments", Icons.Default.Star, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/patient/appointments") },
                    QuickAccessItem("Prescriptions", Icons.Default.Add, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/patient/prescriptions") },
                    QuickAccessItem("My Records", Icons.Default.Person, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/patient/records") },
                    QuickAccessItem("Vaccinations", Icons.Default.Check, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/patient/vaccinations") },
                    QuickAccessItem("Bills & Co-pay", Icons.Default.Info, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/patient/bills") },
                    QuickAccessItem("Find Hospitals", Icons.Default.Search, theme.dark) { onSearchClick() }
                )
                "superadmin" -> listOf(
                    QuickAccessItem("Manage Wards", Icons.Default.Home, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/hospitals") },
                    QuickAccessItem("Manage Users", Icons.Default.Person, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/users") },
                    QuickAccessItem("Subscriptions", Icons.Default.Check, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/subscriptions") },
                    QuickAccessItem("Usage & Billing", Icons.Default.Info, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/usage") },
                    QuickAccessItem("Global Staff", Icons.Default.Star, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/super-admin/staff-types") },
                    QuickAccessItem("Web Home", Icons.Default.Search, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/") }
                )
                "hospital" -> listOf(
                    QuickAccessItem("OPD Queue", Icons.Default.Search, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/queue") },
                    QuickAccessItem("Patient Records", Icons.Default.Person, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/patients") },
                    QuickAccessItem("Write Rx", Icons.Default.Star, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/prescriptions") },
                    QuickAccessItem("Manage Rooms", Icons.Default.AddCircle, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/rooms") },
                    QuickAccessItem("Lab Orders", Icons.Default.Warning, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/labs") },
                    QuickAccessItem("Staff Shifts", Icons.Default.DateRange, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/dashboard/shifts") }
                )
                else -> listOf(
                    QuickAccessItem("Find Hospital", Icons.Default.Search, theme.primary) { onSearchClick() },
                    QuickAccessItem("Web Console", Icons.Default.Person, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/") },
                    QuickAccessItem("Join HOSCORE", Icons.Default.Add, theme.primary) { onPortalClick("$LOCAL_CLIENT_URL/register-hospital") },
                    QuickAccessItem("Portal Info", Icons.Default.Info, theme.dark) { onPortalClick("$LOCAL_CLIENT_URL/for-hospitals") }
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                for (i in quickAccessItems.indices step 2) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        QuickAccessButton(
                            item = quickAccessItems[i],
                            palette = palette,
                            modifier = Modifier.weight(1f)
                        )
                        if (i + 1 < quickAccessItems.size) {
                            QuickAccessButton(
                                item = quickAccessItems[i + 1],
                                palette = palette,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

data class HeaderActionItem(
    val title: String,
    val icon: ImageVector,
    val color: Color,
    val action: () -> Unit
)

@Composable
fun TrackerCard(
    title: String,
    value: String,
    isPositive: Boolean,
    theme: AppTheme,
    modifier: Modifier = Modifier
) {
    val gradient = if (isPositive) {
        Brush.verticalGradient(colors = listOf(theme.dark, theme.dark.copy(alpha = 0.8f)))
    } else {
        Brush.verticalGradient(colors = listOf(theme.gradientStart, theme.gradientEnd))
    }
    
    Card(
        modifier = modifier.shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Column(
            modifier = Modifier
                .background(gradient)
                .padding(18.dp)
                .fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(Color.White.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isPositive) Icons.Default.ArrowDropDown else Icons.Default.KeyboardArrowUp,
                    contentDescription = title,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = title,
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.7f),
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 18.sp,
                color = Color.White,
                fontWeight = FontWeight.Black
            )
        }
    }
}

data class QuickAccessItem(
    val title: String,
    val icon: ImageVector,
    val color: Color,
    val action: () -> Unit
)

@Composable
fun QuickAccessButton(
    item: QuickAccessItem,
    palette: DashboardPalette,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { item.action() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = palette.card),
        border = BorderStroke(1.dp, palette.cardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp), // Premium increased padding
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp) // Premium increased size
                    .clip(CircleShape)
                    .background(item.color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = item.icon,
                    contentDescription = item.title,
                    tint = item.color,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = item.title,
                fontSize = 13.sp, // Dream app design font size
                fontWeight = FontWeight.Bold,
                color = palette.textPrimary
            )
        }
    }
}

@Composable
fun OverviewCard(
    title: String,
    subtitle: String,
    value: String,
    metricLabel: String,
    gradient: Brush,
    bullets: List<String>
) {
    Card(
        modifier = Modifier
            .width(300.dp) // Premium wider card
            .height(210.dp) // Premium taller card
            .shadow(6.dp, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(gradient)
                .padding(20.dp) // Premium padding
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = title,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White.copy(alpha = 0.8f),
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = subtitle,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.weight(1f)) {
                bullets.forEach { bullet ->
                    Text(
                        text = bullet,
                        fontSize = 12.sp, // Premium font size
                        color = Color.White.copy(alpha = 0.9f),
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            HorizontalDivider(color = Color.White.copy(alpha = 0.2f), modifier = Modifier.padding(vertical = 10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = metricLabel,
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.7f),
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = value,
                    fontSize = 22.sp, // Premium font size
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFFCD34D) // Amber accent color
                )
            }
        }
    }
}

data class DetailedStatCardData(
    val label: String,
    val value: String,
    val subtext: String,
    val icon: ImageVector,
    val iconTint: Color,
    val borderColor: Color
)

@Composable
fun DetailedStatCard(
    data: DetailedStatCardData,
    palette: DashboardPalette,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.shadow(2.dp, RoundedCornerShape(14.dp)),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = palette.card),
        border = BorderStroke(1.dp, palette.cardBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) { // Premium increased padding
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = data.label,
                    fontSize = 12.sp, // Dream app design font size
                    color = palette.textSecondary,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = data.icon,
                    contentDescription = data.label,
                    tint = data.iconTint,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = data.value,
                fontSize = 20.sp, // Dream app design font size
                color = palette.textPrimary,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = data.subtext,
                fontSize = 11.sp, // Dream app design font size
                color = palette.textMuted,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun PatientVolumeChart(
    points: List<Float>,
    days: List<String>,
    lineColor: Color,
    fillColor: Color,
    gridColor: Color = Color(0xFFF1F5F9),
    labelColor: Color = Color(0xFF94A3B8)
) {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp)
            .padding(top = 10.dp)
    ) {
        val w = size.width
        val h = size.height
        val maxVal = points.maxOrNull() ?: 1f

        // Draw horizontal grid lines
        val gridLines = 4
        for (i in 0..gridLines) {
            val yPos = h * (i.toFloat() / gridLines)
            drawLine(
                color = gridColor,
                start = Offset(0f, yPos),
                end = Offset(w, yPos),
                strokeWidth = 1f
            )
        }

        // Draw vertical bars with rounded tops (matching Screen 2)
        val barCount = points.size
        val gapRatio = 0.35f
        val totalBarWidth = w / barCount
        val barWidth = totalBarWidth * (1f - gapRatio)
        val barSpacing = totalBarWidth * gapRatio

        points.forEachIndexed { index, value ->
            val barHeight = h * (value / maxVal) * 0.85f
            val x = index * totalBarWidth + barSpacing / 2
            val y = h - barHeight

            drawRoundRect(
                color = lineColor,
                topLeft = Offset(x, y),
                size = androidx.compose.ui.geometry.Size(barWidth, barHeight),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(6.dp.toPx(), 6.dp.toPx())
            )
        }
    }
    
    // Bottom labels row
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        days.forEach { day ->
            Text(
                text = day,
                fontSize = 11.sp, // Premium font size
                fontWeight = FontWeight.Bold,
                color = labelColor
            )
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(
    url: String,
    onUserSync: (String, String, String) -> Unit,
    onUserClear: () -> Unit
) {
    var errorState by remember { mutableStateOf(false) }
    val appBlue = Color(0xFF2563EB)
    val webAppInterface = remember(onUserSync, onUserClear) {
        WebAppInterface(onUserSync, onUserClear)
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView(context).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        cacheMode = WebSettings.LOAD_DEFAULT
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    }

                    addJavascriptInterface(webAppInterface, "AndroidBridge")

                    webViewClient = object : WebViewClient() {
                        override fun onReceivedError(
                            view: WebView?,
                            errorCode: Int,
                            description: String?,
                            failingUrl: String?
                        ) {
                            if (url.contains("10.0.2.2")) {
                                errorState = true
                            }
                        }
                    }

                    webChromeClient = WebChromeClient()
                    loadUrl(url)
                }
            },
            update = { webView ->
                if (!errorState && webView.url != url) {
                    webView.loadUrl(url)
                }
            }
        )

        if (errorState) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Connection Offline",
                        fontSize = 22.sp, // Dream app design font size
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    Text(
                        text = "Ensure your local Hoscore client is running on port 5173.\n\nLocal WebView requires a live backend & client connection.",
                        fontSize = 14.sp, // Dream app design font size
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                        modifier = Modifier.padding(bottom = 24.dp)
                    )
                    Button(
                        onClick = { errorState = false },
                        colors = ButtonDefaults.buttonColors(containerColor = appBlue)
                    ) {
                        Text("Retry Connection")
                    }
                }
            }
        }
    }
}

data class SyncUserState(
    val name: String,
    val role: String,
    val contextType: String
)

class WebAppInterface(
    private val onUserSync: (name: String, role: String, contextType: String) -> Unit,
    private val onUserClear: () -> Unit
) {
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())

    @JavascriptInterface
    fun syncUser(name: String, role: String, contextType: String) {
        handler.post {
            onUserSync(name, role, contextType)
        }
    }

    @JavascriptInterface
    fun clearUser() {
        handler.post {
            onUserClear()
        }
    }
}

// Modifier scale utility extension
private fun Modifier.scale(scale: Float): Modifier = this.then(
    Modifier.layout { measurable, constraints ->
        val placeable = measurable.measure(constraints)
        layout((placeable.width * scale).toInt(), (placeable.height * scale).toInt()) {
            placeable.placeWithLayer(0, 0, layerBlock = {
                scaleX = scale
                scaleY = scale
            })
        }
    }
)
