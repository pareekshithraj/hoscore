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

private const val LOCAL_CLIENT_URL = "http://10.0.2.2:5173"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier,
) {
    var selectedTab by remember { mutableStateOf(0) }
    var onDuty by remember { mutableStateOf(true) }
    var showTelemetryDialog by remember { mutableStateOf(false) }

    val brandRed = Color(0xFFEF4444)
    val brandBlue = Color(0xFF2563EB)
    val brandTeal = Color(0xFF0D9488)
    val brandPurple = Color(0xFF7C3AED)

    Scaffold(
        bottomBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .shadow(12.dp, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)),
                contentAlignment = Alignment.BottomCenter
            ) {
                NavigationBar(
                    containerColor = Color.White,
                    tonalElevation = 0.dp,
                    modifier = Modifier.height(76.dp)
                ) {
                    NavigationBarItem(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        label = { Text("Dashboard", fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(imageVector = Icons.Default.Home, contentDescription = "Home", modifier = Modifier.size(22.dp)) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = brandBlue,
                            unselectedIconColor = Color(0xFF94A3B8),
                            selectedTextColor = brandBlue,
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = brandBlue.copy(alpha = 0.08f)
                        )
                    )
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        label = { Text("Find Hospital", fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(imageVector = Icons.Default.Search, contentDescription = "Search", modifier = Modifier.size(22.dp)) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = brandBlue,
                            unselectedIconColor = Color(0xFF94A3B8),
                            selectedTextColor = brandBlue,
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = brandBlue.copy(alpha = 0.08f)
                        )
                    )
                    
                    // Spacer for center overlapping FAB
                    Spacer(modifier = Modifier.weight(0.8f))

                    NavigationBarItem(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        label = { Text("Web Console", fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(imageVector = Icons.Default.Person, contentDescription = "Console", modifier = Modifier.size(22.dp)) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = brandBlue,
                            unselectedIconColor = Color(0xFF94A3B8),
                            selectedTextColor = brandBlue,
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = brandBlue.copy(alpha = 0.08f)
                        )
                    )
                    NavigationBarItem(
                        selected = selectedTab == 3,
                        onClick = { showTelemetryDialog = true },
                        label = { Text("Telemetry", fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(imageVector = Icons.Default.Warning, contentDescription = "Telemetry", modifier = Modifier.size(22.dp)) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = brandRed,
                            unselectedIconColor = Color(0xFF94A3B8),
                            selectedTextColor = brandRed,
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = brandRed.copy(alpha = 0.08f)
                        )
                    )
                }

                // Overlapping Center FAB (Quick Diagnostics Action)
                Box(
                    modifier = Modifier
                        .offset(y = (-24).dp)
                        .size(58.dp)
                        .shadow(6.dp, CircleShape)
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(brandBlue, Color(0xFF1D4ED8))
                            ),
                            shape = CircleShape
                        )
                        .clickable { showTelemetryDialog = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Quick Stats",
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }
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
                    onDuty = onDuty,
                    onDutyChanged = { onDuty = it },
                    brandBlue = brandBlue,
                    brandRed = brandRed,
                    brandTeal = brandTeal,
                    brandPurple = brandPurple,
                    onSearchClick = { selectedTab = 1 },
                    onPortalClick = { selectedTab = 2 }
                )
                1 -> WebViewContainer(url = "$LOCAL_CLIENT_URL/hospitals")
                2 -> WebViewContainer(url = "$LOCAL_CLIENT_URL/")
            }
        }
    }

    if (showTelemetryDialog) {
        AlertDialog(
            onDismissRequest = { showTelemetryDialog = false },
            confirmButton = {
                Button(
                    onClick = { showTelemetryDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = brandBlue)
                ) {
                    Text("Close Console")
                }
            },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Warning, contentDescription = "Telemetry", tint = brandRed)
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
    onDuty: Boolean,
    onDutyChanged: (Boolean) -> Unit,
    brandBlue: Color,
    brandRed: Color,
    brandTeal: Color,
    brandPurple: Color,
    onSearchClick: () -> Unit,
    onPortalClick: () -> Unit
) {
    val scrollState = rememberScrollState()
    val horizontalScrollState = rememberScrollState()

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
            .background(Color(0xFFF8FAFC)) // Premium soft slate background
            .verticalScroll(scrollState)
    ) {
        // 1. Sleek Top Profile Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.White, Color(0xFFF8FAFC))
                    )
                )
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Doctor Profile Detail
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .background(brandBlue.copy(alpha = 0.1f), CircleShape)
                            .border(1.5.dp, brandBlue, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "PR",
                            color = brandBlue,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Dr. Pareekshith Raj",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF0F172A)
                        )
                        Text(
                            text = "Command Coordinator",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF64748B)
                        )
                    }
                }

                // Custom Pulsing On-Duty Controller
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (onDuty) Color(0xFFECFDF5) else Color(0xFFF1F5F9))
                        .border(1.dp, if (onDuty) Color(0xFFA7F3D0) else Color(0xFFE2E8F0), RoundedCornerShape(14.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    // Pulsing dot
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(
                                color = (if (onDuty) Color(0xFF10B981) else Color(0xFF64748B)).copy(alpha = dotAlpha),
                                shape = CircleShape
                            )
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (onDuty) "ON DUTY" else "OFF DUTY",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (onDuty) Color(0xFF065F46) else Color(0xFF475569)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Switch(
                        checked = onDuty,
                        onCheckedChange = onDutyChanged,
                        modifier = Modifier.scale(0.55f),
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = Color(0xFF10B981),
                            uncheckedThumbColor = Color.White,
                            uncheckedTrackColor = Color(0xFF94A3B8)
                        )
                    )
                }
            }
        }

        // 2. Horizontal Overview Cards (Swipable Carousel)
        Column(modifier = Modifier.padding(bottom = 20.dp)) {
            Text(
                text = "Live Triage Command Overview",
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1E293B),
                modifier = Modifier
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 10.dp)
            )
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(horizontalScrollState)
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Card 1: Critical Alerts (Emergency)
                OverviewCard(
                    title = "EMERGENCY TRIAGE",
                    subtitle = "3 RED ALERTS STANDING",
                    value = "92%",
                    metricLabel = "ICU Bed Capacity",
                    gradient = Brush.linearGradient(colors = listOf(brandRed, Color(0xFFB91C1C))),
                    bullets = listOf("• Code Red in Ward 4A (Admitted)", "• 2 ICU Beds currently available", "• Telemetry alerts: Syncing active")
                )

                // Card 2: OPD Traffic wait
                OverviewCard(
                    title = "OPD WAITING LOG",
                    subtitle = "18 ACTIVE APPOINTMENTS",
                    value = "14m",
                    metricLabel = "Avg Delay Time",
                    gradient = Brush.linearGradient(colors = listOf(brandPurple, Color(0xFF5B21B6))),
                    bullets = listOf("• OPD Saturation level: 84%", "• Next slot: Token #104 (11:30 AM)", "• Lab Orders: 4 pending reports")
                )

                // Card 3: Ward Occupancy
                OverviewCard(
                    title = "WARD OCCUPANCY",
                    subtitle = "42 BEDS ENGAGED",
                    value = "84%",
                    metricLabel = "Total Ward Load",
                    gradient = Brush.linearGradient(colors = listOf(brandTeal, Color(0xFF0F766E))),
                    bullets = listOf("• General Ward beds occupied: 38/44", "• Discharge status: 6 planned today", "• Staff coverage index: 98% (Optimal)")
                )
            }
        }

        // 3. Operational Analytics Graph (Canvas Line Area Chart)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 20.dp)
                .shadow(2.dp, RoundedCornerShape(16.dp)),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "WEEKLY PATIENT INFLOW",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = brandBlue,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Patient Registrations",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF0F172A)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(brandBlue.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "+14.2% Growth",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = brandBlue
                        )
                    }
                }
                
                // Draw Canvas Patient Volume Line Chart
                Spacer(modifier = Modifier.height(8.dp))
                PatientVolumeChart(
                    points = listOf(28f, 45f, 32f, 68f, 54f, 85f, 72f),
                    days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
                    lineColor = brandBlue,
                    fillColor = brandBlue
                )
            }
        }

        // 4. Live High-Density Metrics Grid (2x2)
        Column(
            modifier = Modifier
                .padding(horizontal = 20.dp)
                .padding(bottom = 20.dp)
        ) {
            Text(
                text = "Clinical Resource Saturation",
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1E293B),
                modifier = Modifier.padding(bottom = 12.dp)
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                DetailedStatCard(
                    label = "Total Rooms",
                    value = "12 Wards",
                    subtext = "2 Isolation Units",
                    icon = Icons.Default.Home,
                    iconTint = brandBlue,
                    borderColor = brandBlue.copy(alpha = 0.2f),
                    modifier = Modifier.weight(1f)
                )
                DetailedStatCard(
                    label = "Total Beds",
                    value = "50 Slots",
                    subtext = "8 Open ICU Units",
                    icon = Icons.Default.Add,
                    iconTint = brandTeal,
                    borderColor = brandTeal.copy(alpha = 0.2f),
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                DetailedStatCard(
                    label = "Lab Backlog",
                    value = "4 Orders",
                    subtext = "Critical delays: None",
                    icon = Icons.Default.Warning,
                    iconTint = brandRed,
                    borderColor = brandRed.copy(alpha = 0.2f),
                    modifier = Modifier.weight(1f)
                )
                DetailedStatCard(
                    label = "Queue Load",
                    value = "18 Active",
                    subtext = "Avg 12m delay wait",
                    icon = Icons.Default.Star,
                    iconTint = brandPurple,
                    borderColor = brandPurple.copy(alpha = 0.2f),
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 5. Explore & Quick Actions (Blueprint Console style)
        Column(
            modifier = Modifier
                .padding(horizontal = 20.dp)
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = "Quick Command Console",
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1E293B),
                modifier = Modifier.padding(bottom = 12.dp)
            )

            val quickAccessItems = listOf(
                QuickAccessItem("Search Wards", Icons.Default.Search, brandBlue, onSearchClick),
                QuickAccessItem("Patient Portal", Icons.Default.Person, brandBlue, onPortalClick),
                QuickAccessItem("Doctor Desk", Icons.Default.Star, brandPurple, onPortalClick),
                QuickAccessItem("Add Hospital", Icons.Default.AddCircle, brandTeal, onPortalClick),
                QuickAccessItem("Telemetry Logs", Icons.Default.Warning, brandRed, onPortalClick),
                QuickAccessItem("System Help", Icons.Default.Info, Color(0xFF64748B), onPortalClick)
            )

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                for (i in quickAccessItems.indices step 2) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuickAccessButton(
                            item = quickAccessItems[i],
                            modifier = Modifier.weight(1f)
                        )
                        if (i + 1 < quickAccessItems.size) {
                            QuickAccessButton(
                                item = quickAccessItems[i + 1],
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
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
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { item.action() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(item.color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = item.icon,
                    contentDescription = item.title,
                    tint = item.color,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = item.title,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1E293B)
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
            .width(280.dp)
            .height(200.dp)
            .shadow(4.dp, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(gradient)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = title,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White.copy(alpha = 0.8f),
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = subtitle,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            Column(verticalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.weight(1f)) {
                bullets.forEach { bullet ->
                    Text(
                        text = bullet,
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.9f),
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            HorizontalDivider(color = Color.White.copy(alpha = 0.2f), modifier = Modifier.padding(vertical = 8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = metricLabel,
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.7f),
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = value,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFFCD34D) // Amber accent color for value highlight
                )
            }
        }
    }
}

@Composable
fun DetailedStatCard(
    label: String,
    value: String,
    subtext: String,
    icon: ImageVector,
    iconTint: Color,
    borderColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .shadow(1.dp, RoundedCornerShape(14.dp)),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, borderColor)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    fontSize = 11.sp,
                    color = Color(0xFF64748B),
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = iconTint,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                fontSize = 18.sp,
                color = Color(0xFF0F172A),
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtext,
                fontSize = 10.sp,
                color = Color(0xFF94A3B8),
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
    fillColor: Color
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
                color = Color(0xFFF1F5F9),
                start = Offset(0f, yPos),
                end = Offset(w, yPos),
                strokeWidth = 1f
            )
        }

        // Compute coordinates
        val pointsCoords = points.mapIndexed { index, value ->
            val x = w * (index.toFloat() / (points.size - 1))
            val y = h - (h * (value / maxVal) * 0.75f) - 10f // leave 25% spacing and offset
            Offset(x, y)
        }

        // Draw lines connecting points
        val path = Path().apply {
            if (pointsCoords.isNotEmpty()) {
                moveTo(pointsCoords[0].x, pointsCoords[0].y)
                for (i in 1 until pointsCoords.size) {
                    val p1 = pointsCoords[i - 1]
                    val p2 = pointsCoords[i]
                    val controlX1 = (p1.x + p2.x) / 2
                    val controlY1 = p1.y
                    val controlX2 = (p1.x + p2.x) / 2
                    val controlY2 = p2.y
                    cubicTo(controlX1, controlY1, controlX2, controlY2, p2.x, p2.y)
                }
            }
        }

        // Build shaded area path under the line
        val fillPath = Path().apply {
            addPath(path)
            lineTo(w, h)
            lineTo(0f, h)
            close()
        }

        // Fill path with gradient
        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(fillColor.copy(alpha = 0.35f), Color.Transparent)
            )
        )

        // Draw path line
        drawPath(
            path = path,
            color = lineColor,
            style = Stroke(
                width = 3.dp.toPx(),
                cap = StrokeCap.Round
            )
        )

        // Draw dots and glow on points
        pointsCoords.forEach { pt ->
            drawCircle(
                color = Color.White,
                radius = 5.dp.toPx(),
                center = pt
            )
            drawCircle(
                color = lineColor,
                radius = 3.dp.toPx(),
                center = pt
            )
        }
    }
    
    // Bottom labels row
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        days.forEach { day ->
            Text(
                text = day,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8)
            )
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(url: String) {
    var errorState by remember { mutableStateOf(false) }
    val appBlue = Color(0xFF2563EB)

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
                if (!errorState) {
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
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    Text(
                        text = "Ensure your local Hoscore client is running on port 5173.\n\nLocal WebView requires a live backend & client connection.",
                        fontSize = 13.sp,
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
