package com.example.hoscore.core.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.network.ServiceLocator

data class NavTab(val label: String, val icon: ImageVector)

/** Portal accent colour — derived from the active context type. */
private val activePortalColor: Color
    @Composable get() {
        val ctx = ServiceLocator.sessionStore.activeContext
        return when (ctx?.type) {
            "hospital"   -> Color(0xFF0D9488)   // teal
            "superadmin" -> Color(0xFF7C3AED)   // purple
            else         -> Color(0xFF3B5BDB)   // blue (patient)
        }
    }

/** Standard edge-to-edge bottom navigation bar. */
@Composable
fun PillBottomBar(
    tabs: List<NavTab>,
    selected: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = activePortalColor

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 8.dp,
        tonalElevation = 0.dp,
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .height(64.dp)
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            tabs.forEachIndexed { i, tab ->
                val active = i == selected
                val iconColor by animateColorAsState(
                    if (active) accent else Color(0xFF94A3B8),
                    label = "tabColor$i",
                )
                val textColor by animateColorAsState(
                    if (active) accent else Color(0xFF94A3B8),
                    label = "textColor$i",
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (active) accent.copy(alpha = 0.10f) else Color.Transparent)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                        ) { onSelect(i) }
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.label,
                            tint = iconColor,
                            modifier = Modifier.size(22.dp),
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            text = tab.label,
                            fontSize = 11.sp,
                            fontWeight = if (active) FontWeight.Black else FontWeight.Bold,
                            color = textColor,
                            maxLines = 1,
                        )
                    }
                }
            }
        }
    }
}
