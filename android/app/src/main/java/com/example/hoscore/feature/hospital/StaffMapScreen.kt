package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.Bed
import com.example.hoscore.core.network.HospitalMap
import com.example.hoscore.core.network.HoscoreSocket
import com.example.hoscore.core.network.LivePosition
import com.example.hoscore.core.network.MapCell
import com.example.hoscore.core.network.MapFloor
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.MapCanvas
import com.example.hoscore.core.ui.components.MapMarker
import com.example.hoscore.core.ui.components.MarkerKind
import com.example.hoscore.core.ui.components.entranceCell
import com.example.hoscore.core.ui.components.findPath
import com.example.hoscore.core.ui.components.pathToDirections
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class StaffMapData(
    val map: HospitalMap,
    val positions: List<LivePosition> = emptyList(),
    val beds: List<Bed> = emptyList(),
)

class StaffMapVM : ViewModel() {
    private val _state = MutableStateFlow<Resource<StaffMapData>>(Resource.Loading)
    val state: StateFlow<Resource<StaffMapData>> = _state.asStateFlow()
    private var started = false

    fun start() {
        if (started) {
            load()
            return
        }
        started = true
        load()
        viewModelScope.launch { HoscoreSocket.events.collect { load() } }
    }

    fun load() {
        _state.value = Resource.Loading
        viewModelScope.launch {
            when (val mapRes = apiCall { getMap() }) {
                is Resource.Error -> _state.value = mapRes
                is Resource.Loading -> Unit
                is Resource.Success -> {
                    val positions = when (val p = apiCall { getLivePositions() }) {
                        is Resource.Success -> p.data
                        else -> emptyList()
                    }
                    val beds = when (val b = apiCall { getBeds() }) {
                        is Resource.Success -> b.data
                        else -> emptyList()
                    }
                    _state.value = Resource.Success(StaffMapData(mapRes.data, positions, beds))
                }
            }
        }
    }
}

@Composable
fun StaffMapScreen() {
    val t = HoscoreTokens.current
    val vm: StaffMapVM = viewModel()
    LaunchedEffect(Unit) { vm.start() }
    val state by vm.state.collectAsState()

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Indoor map", "Occupancy & wayfinding")
        when (val s = state) {
            is Resource.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
                CircularProgressIndicator(color = t.primary)
            }
            is Resource.Error -> EmptyState("Couldn't load the map", s.message, Icons.Rounded.Map)
            is Resource.Success -> StaffMapContent(s.data)
        }
    }
}

@Composable
private fun StaffMapContent(data: StaffMapData) {
    val t = HoscoreTokens.current
    val map = data.map
    if (map.floors.isEmpty()) {
        EmptyState(
            "No floors published yet",
            "Build and save the plan in the web Map Builder, then publish so staff and patients see the same layout.",
            Icons.Rounded.Map,
        )
        return
    }

    var floorId by remember { mutableStateOf(map.floors.first().id) }
    var destAnchorId by remember { mutableStateOf<String?>(null) }
    val floor = map.floors.firstOrNull { it.id == floorId } ?: map.floors.first()

    val occupiedBeds = data.beds.filter { it.status.equals("OCCUPIED", ignoreCase = true) }
    val occupancy = occupancyMarkers(floor, data.positions, occupiedBeds)
    val heat = occupancy.groupingBy { "${it.cell.r},${it.cell.c}" }
        .eachCount()
        .mapValues { (_, n) -> (n * 0.45f).coerceAtMost(1f) }

    val destAnchor = floor.anchors.firstOrNull { it.id == destAnchorId }
    val start = entranceCell(floor, map.cols, map.rows)
    val path = if (destAnchor != null) findPath(floor.cells, start, destAnchor.cell) else emptyList()
    val markers = buildList {
        addAll(occupancy)
        add(MapMarker(start, MarkerKind.YOU))
        if (destAnchor != null) add(MapMarker(destAnchor.cell, MarkerKind.DESTINATION, pulse = true))
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column {
                Text(map.name.ifBlank { "Main Building" }, color = t.textPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(4.dp))
                Text(
                    if (map.isPublished) "Published for patients" else "Staff-only draft — publish from the web builder",
                    color = if (map.isPublished) t.emerald else t.textMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    CountChip("${occupiedBeds.size}", "Occupied beds", t.clinical)
                    CountChip("${data.positions.size}", "Live pins", t.primary)
                }
            }
        }

        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            map.floors.forEach { f ->
                val selected = f.id == floor.id
                Box(
                    Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selected) t.primary else t.card)
                        .clickable {
                            floorId = f.id
                            destAnchorId = null
                        }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                ) {
                    Text(
                        f.label.ifBlank { "Floor ${f.index + 1}" },
                        color = if (selected) t.onBrand else t.textPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }

        HoscoreCard(Modifier.fillMaxWidth()) {
            Column {
                Text(floor.label.ifBlank { "Floor" }, color = t.textSecondary, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                Spacer(Modifier.height(10.dp))
                MapCanvas(
                    floor = floor,
                    cols = map.cols,
                    rows = map.rows,
                    path = path,
                    markers = markers,
                    heat = heat,
                )
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    LegendDot(Color(0xFF10B981), "Occupied / patient")
                    LegendDot(Color(0xFFA855F7), "Staff pin")
                    LegendDot(Color(0xFF38BDF8), "Entrance")
                }
            }
        }

        val destinations = floor.anchors.filter { it.kind == "room" || it.kind == "bed" || it.kind == "poi" }
        if (destinations.isNotEmpty()) {
            HoscoreCard(Modifier.fillMaxWidth()) {
                Column {
                    Text("WAYFINDING", color = t.textSecondary, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Tap a room or bed to route from the entrance.", color = t.textMuted, fontSize = 12.sp)
                    Spacer(Modifier.height(10.dp))
                    destinations.forEach { a ->
                        val selected = a.id == destAnchorId
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (selected) t.primary.copy(alpha = 0.12f) else Color.Transparent)
                                .clickable { destAnchorId = if (selected) null else a.id }
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(a.label.ifBlank { a.kind }, color = t.textPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }

        if (path.size >= 2 && destAnchor != null) {
            HoscoreCard(Modifier.fillMaxWidth()) {
                Column {
                    Text("DIRECTIONS", color = t.textSecondary, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
                    Spacer(Modifier.height(10.dp))
                    pathToDirections(path, destAnchor.label.ifBlank { "destination" }).forEachIndexed { i, step ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.Top) {
                            Box(
                                Modifier.size(22.dp).clip(RoundedCornerShape(7.dp)).background(t.primary.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center,
                            ) { Text("${i + 1}", color = t.primary, fontSize = 10.sp, fontWeight = FontWeight.Black) }
                            Text(step, color = t.textSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 10.dp))
                        }
                    }
                }
            }
        }
    }
}

private fun occupancyMarkers(
    floor: MapFloor,
    positions: List<LivePosition>,
    occupiedBeds: List<Bed>,
): List<MapMarker> {
    val markers = mutableListOf<MapMarker>()
    positions.filter { it.floorId == floor.id }.forEach { p ->
        markers.add(
            MapMarker(
                MapCell(p.cellR, p.cellC),
                if (p.subjectType.equals("STAFF", true)) MarkerKind.STAFF else MarkerKind.PATIENT,
                pulse = true,
            )
        )
    }
    occupiedBeds.forEach { bed ->
        val anchor = floor.anchors.firstOrNull { it.bedId == bed.id }
        if (anchor != null) {
            markers.add(MapMarker(anchor.cell, MarkerKind.PATIENT))
            return@forEach
        }
        val room = floor.rooms.firstOrNull { it.roomId != null && it.roomId == bed.roomId }
        if (room != null) {
            markers.add(MapMarker(MapCell(room.y + room.h / 2, room.x + room.w / 2), MarkerKind.PATIENT))
        }
    }
    return markers
}

@Composable
private fun CountChip(value: String, label: String, color: Color) {
    Column {
        Text(value, color = color, fontSize = 20.sp, fontWeight = FontWeight.Black)
        Text(label, color = color.copy(alpha = 0.8f), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    val t = HoscoreTokens.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(color))
        Text("  $label", color = t.textMuted, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
    }
}
