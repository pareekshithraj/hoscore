package com.example.hoscore.core.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import com.example.hoscore.core.network.HospitalMap
import com.example.hoscore.core.network.MapAnchor
import com.example.hoscore.core.network.MapCell
import com.example.hoscore.core.network.MapFloor
import kotlin.math.abs

// AreaType -> colour, mirroring client/src/utils/mapModel.ts so web & app match.
private val AREA_COLORS: Map<String, Color> = mapOf(
    "wall" to Color(0xFF334155),
    "corridor" to Color(0xFF475569),
    "lobby" to Color(0xFF64748B),
    "reception" to Color(0xFF3B82F6),
    "ward-a" to Color(0xFF10B981),
    "ward-b" to Color(0xFF22C55E),
    "icu" to Color(0xFFA855F7),
    "emergency" to Color(0xFFEF4444),
    "pharmacy" to Color(0xFF06B6D4),
    "lab" to Color(0xFFF59E0B),
    "radiology" to Color(0xFFEC4899),
    "ot" to Color(0xFFF43F5E),
    "cafeteria" to Color(0xFF84CC16),
    "admin" to Color(0xFF8B5CF6),
    "toilet" to Color(0xFF0EA5E9),
    "elevator" to Color(0xFFEAB308),
    "stairs" to Color(0xFFF97316),
)

private val WALKABLE = setOf(
    "corridor", "lobby", "reception", "ward-a", "ward-b", "icu", "emergency",
    "pharmacy", "lab", "radiology", "ot", "cafeteria", "admin", "toilet", "elevator", "stairs",
)

enum class MarkerKind { YOU, DESTINATION, PATIENT, STAFF }

data class MapMarker(val cell: MapCell, val kind: MarkerKind, val pulse: Boolean = false)

private fun markerColor(kind: MarkerKind) = when (kind) {
    MarkerKind.YOU -> Color(0xFF38BDF8)
    MarkerKind.DESTINATION -> Color(0xFFF43F5E)
    MarkerKind.PATIENT -> Color(0xFF10B981)
    MarkerKind.STAFF -> Color(0xFFA855F7)
}

/**
 * Canvas grid renderer shared by every map surface in the app. Draws zone cells,
 * an optional route path, a heatmap tint, and live markers. Pure drawing — no
 * interaction — so it scales from a phone card to full screen.
 */
@Composable
fun MapCanvas(
    floor: MapFloor,
    cols: Int,
    rows: Int,
    modifier: Modifier = Modifier,
    path: List<MapCell> = emptyList(),
    markers: List<MapMarker> = emptyList(),
    heat: Map<String, Float> = emptyMap(),
) {
    Canvas(
        modifier
            .fillMaxWidth()
            .aspectRatio(cols.toFloat() / rows.toFloat().coerceAtLeast(1f)),
    ) {
        val cw = size.width / cols
        val ch = size.height / rows
        val gridLine = Color.White.copy(alpha = 0.06f)

        // Cells
        for (r in 0 until rows) {
            for (c in 0 until cols) {
                val type = floor.cells.getOrNull(r)?.getOrNull(c) ?: "empty"
                val topLeft = Offset(c * cw, r * ch)
                val cellSize = Size(cw, ch)
                if (type != "empty") {
                    val base = AREA_COLORS[type] ?: Color(0xFF475569)
                    drawRect(base.copy(alpha = 0.13f), topLeft, cellSize)
                }
                val heatVal = heat["$r,$c"] ?: 0f
                if (heatVal > 0f) {
                    drawRect(Color(0xFFEF4444).copy(alpha = (heatVal.coerceIn(0f, 1f)) * 0.55f), topLeft, cellSize)
                }
                drawRect(gridLine, topLeft, cellSize, style = Stroke(width = 0.5f))
            }
        }

        // Path highlight + dashed line
        if (path.size >= 2) {
            for (p in path) {
                drawRect(
                    Color(0xFF38BDF8).copy(alpha = 0.18f),
                    Offset(p.c * cw, p.r * ch),
                    Size(cw, ch),
                )
            }
            val linePath = Path().apply {
                path.forEachIndexed { i, p ->
                    val x = (p.c + 0.5f) * cw
                    val y = (p.r + 0.5f) * ch
                    if (i == 0) moveTo(x, y) else lineTo(x, y)
                }
            }
            drawPath(linePath, Color(0xFF0EA5E9).copy(alpha = 0.3f), style = Stroke(width = cw * 0.28f))
            drawPath(
                linePath,
                Color(0xFF38BDF8),
                style = Stroke(
                    width = cw * 0.14f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(cw * 0.4f, cw * 0.4f)),
                ),
            )
        }

        // Markers
        markers.forEach { m ->
            val cx = (m.cell.c + 0.5f) * cw
            val cy = (m.cell.r + 0.5f) * ch
            val col = markerColor(m.kind)
            if (m.pulse) drawCircle(col.copy(alpha = 0.25f), radius = cw * 0.9f, center = Offset(cx, cy))
            drawCircle(col, radius = cw * 0.42f, center = Offset(cx, cy))
            drawCircle(Color.White, radius = cw * 0.16f, center = Offset(cx, cy))
        }
    }
}

// ---- A* pathfinding (mirrors mapModel.ts) ----

fun findPath(cells: List<List<String>>, startIn: MapCell, goalIn: MapCell): List<MapCell> {
    val rows = cells.size
    val cols = cells.firstOrNull()?.size ?: 0
    fun walkable(r: Int, c: Int) =
        r in 0 until rows && c in 0 until cols && (cells[r][c] in WALKABLE)

    fun nearestWalkable(cell: MapCell): MapCell? {
        val maxR = maxOf(rows, cols)
        for (radius in 0..maxR) {
            for (dr in -radius..radius) for (dc in -radius..radius) {
                val r = cell.r + dr; val c = cell.c + dc
                if (walkable(r, c)) return MapCell(r, c)
            }
        }
        return null
    }

    var start = startIn
    var goal = goalIn
    if (!walkable(goal.r, goal.c)) goal = nearestWalkable(goal) ?: return emptyList()
    if (!walkable(start.r, start.c)) start = nearestWalkable(start) ?: return emptyList()

    fun key(r: Int, c: Int) = r * cols + c
    val open = mutableListOf(start)
    val cameFrom = HashMap<Int, MapCell>()
    val g = HashMap<Int, Int>().apply { put(key(start.r, start.c), 0) }
    fun h(r: Int, c: Int) = abs(r - goal.r) + abs(c - goal.c)
    val f = HashMap<Int, Int>().apply { put(key(start.r, start.c), h(start.r, start.c)) }

    while (open.isNotEmpty()) {
        var bi = 0
        for (i in 1 until open.size) {
            if ((f[key(open[i].r, open[i].c)] ?: Int.MAX_VALUE) < (f[key(open[bi].r, open[bi].c)] ?: Int.MAX_VALUE)) bi = i
        }
        val cur = open.removeAt(bi)
        if (cur.r == goal.r && cur.c == goal.c) {
            val pathList = mutableListOf(cur)
            var k = key(cur.r, cur.c)
            while (cameFrom.containsKey(k)) {
                val p = cameFrom[k]!!
                pathList.add(0, p)
                k = key(p.r, p.c)
            }
            return pathList
        }
        val neighbours = listOf(
            MapCell(cur.r - 1, cur.c), MapCell(cur.r + 1, cur.c),
            MapCell(cur.r, cur.c - 1), MapCell(cur.r, cur.c + 1),
        )
        for (n in neighbours) {
            if (!walkable(n.r, n.c)) continue
            val tentative = (g[key(cur.r, cur.c)] ?: Int.MAX_VALUE) + 1
            val nk = key(n.r, n.c)
            if (tentative < (g[nk] ?: Int.MAX_VALUE)) {
                cameFrom[nk] = cur
                g[nk] = tentative
                f[nk] = tentative + h(n.r, n.c)
                if (open.none { it.r == n.r && it.c == n.c }) open.add(n)
            }
        }
    }
    return emptyList()
}

// Turn a path into short directions for the step list.
fun pathToDirections(path: List<MapCell>, destination: String): List<String> {
    if (path.size < 2) return listOf("Arrive at $destination.")
    fun dir(a: MapCell, b: MapCell) = when {
        b.r < a.r -> "up"
        b.r > a.r -> "down"
        b.c > a.c -> "right"
        else -> "left"
    }
    val steps = mutableListOf("Start at the entrance / lobby.")
    var run = 1
    var d = dir(path[0], path[1])
    for (i in 1 until path.size - 1) {
        val nd = dir(path[i], path[i + 1])
        if (nd == d) run++ else { steps.add("Head $d for $run step${if (run > 1) "s" else ""}, then turn."); d = nd; run = 1 }
    }
    steps.add("Continue $d for $run step${if (run > 1) "s" else ""}.")
    steps.add("Arrive at $destination.")
    return steps
}

// Find the entrance anchor for a floor, else default to bottom-centre.
fun entranceCell(floor: MapFloor, cols: Int, rows: Int): MapCell =
    floor.anchors.firstOrNull { it.kind == "entrance" }?.cell ?: MapCell(rows - 1, cols / 2)

fun anchorForPatient(map: HospitalMap, roomId: String?, bedId: String?): Pair<MapFloor, MapAnchor>? {
    for (floor in map.floors) {
        val a = floor.anchors.firstOrNull { (bedId != null && it.bedId == bedId) || (roomId != null && it.roomId == roomId) }
        if (a != null) return floor to a
    }
    return null
}
