package com.example.hoscore.core.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.theme.HoscoreTokens

data class NavTab(val label: String, val icon: ImageVector)

/** Floating rounded pill bottom navigation. */
@Composable
fun PillBottomBar(
    tabs: List<NavTab>,
    selected: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = HoscoreTokens.current
    Box(
        modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .shadow(16.dp, RoundedCornerShape(26.dp))
            .clip(RoundedCornerShape(26.dp))
            .background(t.card)
            .border(BorderStroke(1.dp, t.cardBorder), RoundedCornerShape(26.dp))
            .height(66.dp),
    ) {
        Row(
            Modifier.fillMaxSize().padding(horizontal = 6.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            tabs.forEachIndexed { i, tab ->
                val active = i == selected
                val color by animateColorAsState(if (active) t.primary else t.textMuted, label = "tabColor")
                Column(
                    Modifier
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                        ) { onSelect(i) }
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    if (active) {
                        Box(
                            Modifier
                                .size(width = 34.dp, height = 4.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(t.primary),
                        )
                        Spacer(Modifier.height(6.dp))
                    } else {
                        Spacer(Modifier.height(10.dp))
                    }
                    Icon(tab.icon, tab.label, tint = color, modifier = Modifier.size(22.dp))
                    Spacer(Modifier.height(3.dp))
                    Text(tab.label, fontSize = 9.5.sp, fontWeight = FontWeight.ExtraBold, color = color, maxLines = 1)
                }
            }
        }
    }
}
