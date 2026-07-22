package com.example.hoscore.core.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.theme.HoscoreTokens

/** Rounded vertical bar chart fed by live values. */
@Composable
fun BarChart(
    values: List<Float>,
    labels: List<String>,
    barColor: Color,
    modifier: Modifier = Modifier,
) {
    val t = HoscoreTokens.current
    Column(modifier) {
        Canvas(Modifier.fillMaxWidth().height(140.dp).padding(top = 8.dp)) {
            val w = size.width
            val h = size.height
            val maxVal = (values.maxOrNull() ?: 1f).coerceAtLeast(1f)
            for (i in 0..4) {
                val y = h * (i / 4f)
                drawLine(t.gridLine, Offset(0f, y), Offset(w, y), strokeWidth = 1f)
            }
            if (values.isEmpty()) return@Canvas
            val slot = w / values.size
            val gap = slot * 0.35f
            val barW = slot - gap
            values.forEachIndexed { i, v ->
                val barH = h * (v / maxVal) * 0.88f
                val x = i * slot + gap / 2
                drawRoundRect(
                    brush = Brush.verticalGradient(listOf(barColor, barColor.copy(alpha = 0.55f))),
                    topLeft = Offset(x, h - barH),
                    size = Size(barW, barH),
                    cornerRadius = CornerRadius(6.dp.toPx(), 6.dp.toPx()),
                )
            }
        }
        if (labels.isNotEmpty()) {
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                labels.forEach { Text(it, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textMuted) }
            }
        }
    }
}

/** Smooth line/area chart (e.g. vitals trend, revenue). */
@Composable
fun LineChart(
    values: List<Float>,
    lineColor: Color,
    modifier: Modifier = Modifier,
) {
    val t = HoscoreTokens.current
    Canvas(modifier.fillMaxWidth().height(140.dp)) {
        if (values.size < 2) return@Canvas
        val w = size.width
        val h = size.height
        val maxVal = (values.maxOrNull() ?: 1f)
        val minVal = (values.minOrNull() ?: 0f)
        val range = (maxVal - minVal).coerceAtLeast(1f)
        for (i in 0..4) {
            val y = h * (i / 4f)
            drawLine(t.gridLine, Offset(0f, y), Offset(w, y), strokeWidth = 1f)
        }
        val stepX = w / (values.size - 1)
        fun pt(i: Int): Offset {
            val norm = (values[i] - minVal) / range
            return Offset(i * stepX, h - norm * h * 0.85f - h * 0.05f)
        }
        val line = Path().apply {
            moveTo(pt(0).x, pt(0).y)
            for (i in 1 until values.size) lineTo(pt(i).x, pt(i).y)
        }
        val fill = Path().apply {
            addPath(line)
            lineTo(w, h); lineTo(0f, h); close()
        }
        drawPath(fill, Brush.verticalGradient(listOf(lineColor.copy(alpha = 0.28f), Color.Transparent)))
        drawPath(line, color = lineColor, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round))
    }
}

/** Donut chart for occupancy / distribution. `segments` = value to color. */
@Composable
fun DonutChart(
    segments: List<Pair<Float, Color>>,
    centerLabel: String,
    centerValue: String,
    modifier: Modifier = Modifier,
) {
    val t = HoscoreTokens.current
    androidx.compose.foundation.layout.Box(modifier.height(160.dp), contentAlignment = androidx.compose.ui.Alignment.Center) {
        Canvas(Modifier.fillMaxWidth().height(160.dp)) {
            val total = segments.sumOf { it.first.toDouble() }.toFloat().coerceAtLeast(1f)
            val stroke = 26.dp.toPx()
            val diameter = minOf(size.width, size.height) - stroke
            val topLeft = Offset((size.width - diameter) / 2, (size.height - diameter) / 2)
            drawArc(t.gridLine, 0f, 360f, false, topLeft, Size(diameter, diameter), style = Stroke(stroke))
            var start = -90f
            segments.forEach { (value, color) ->
                val sweep = value / total * 360f
                drawArc(color, start, sweep, false, topLeft, Size(diameter, diameter), style = Stroke(stroke, cap = StrokeCap.Round))
                start += sweep
            }
        }
        Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
            Text(centerValue, fontSize = 26.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
            Text(centerLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textMuted)
        }
    }
}
