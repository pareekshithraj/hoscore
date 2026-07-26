package com.example.hoscore.feature.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bed
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.MapCell
import com.example.hoscore.core.network.MyLocation
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.ShareLocationRequest
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.MapCanvas
import com.example.hoscore.core.ui.components.MapMarker
import com.example.hoscore.core.ui.components.MarkerKind
import com.example.hoscore.core.ui.components.anchorForPatient
import com.example.hoscore.core.ui.components.entranceCell
import com.example.hoscore.core.ui.components.findPath
import com.example.hoscore.core.ui.components.pathToDirections
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MyLocationVM : ViewModel() {
    private val _state = MutableStateFlow<Resource<MyLocation>>(Resource.Loading)
    val state: StateFlow<Resource<MyLocation>> = _state.asStateFlow()

    private val _shareUrl = MutableStateFlow<String?>(null)
    val shareUrl: StateFlow<String?> = _shareUrl.asStateFlow()

    private val _sharing = MutableStateFlow(false)
    val sharing: StateFlow<Boolean> = _sharing.asStateFlow()

    fun load() {
        _state.value = Resource.Loading
        viewModelScope.launch { _state.value = apiCall { getMyLocation() } }
    }

    fun share() {
        if (_sharing.value) return
        _sharing.value = true
        viewModelScope.launch {
            when (val res = apiCall { shareMyLocation(ShareLocationRequest(expiresHours = 24)) }) {
                is Resource.Success -> res.data.shareToken?.let {
                    _shareUrl.value = "${ServiceLocator.webOrigin()}/shared-location/$it"
                }
                else -> {}
            }
            _sharing.value = false
        }
    }
}

@Composable
fun MyLocationScreen() {
    val t = HoscoreTokens.current
    val vm: MyLocationVM = viewModel()
    LaunchedEffect(Unit) { vm.load() }
    val state by vm.state.collectAsState()
    val shareUrl by vm.shareUrl.collectAsState()
    val sharing by vm.sharing.collectAsState()

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("My Location", "Find your ward & share it with family")
        when (val s = state) {
            is Resource.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(color = t.primary) }
            is Resource.Error -> EmptyState("Couldn't load location", s.message, Icons.Rounded.Bed)
            is Resource.Success -> {
                val data = s.data
                if (!data.admitted) {
                    EmptyState(
                        "Not currently admitted",
                        "Indoor wayfinding activates when you're admitted to a hospital with a published map.",
                        Icons.Rounded.Bed,
                    )
                } else {
                    LocationContent(data, shareUrl, sharing, onShare = vm::share)
                }
            }
        }
    }
}

@Composable
private fun LocationContent(
    data: MyLocation,
    shareUrl: String?,
    sharing: Boolean,
    onShare: () -> Unit,
) {
    val t = HoscoreTokens.current
    val map = data.map
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column {
                Text("YOU ARE IN", color = t.clinical, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
                Spacer(Modifier.height(4.dp))
                Text(
                    buildString {
                        append(data.room?.name ?: "Ward")
                        data.bed?.name?.takeIf { it.isNotBlank() }?.let { append(" · Bed $it") }
                    },
                    color = t.textPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black,
                )
                data.hospital?.name?.let {
                    Spacer(Modifier.height(2.dp))
                    Text(it, color = t.textMuted, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }
            }
        }

        if (map != null && map.floors.isNotEmpty()) {
            // Resolve destination cell + route.
            val posFloorId = data.position?.floorId
            val destPair = when {
                data.position != null && posFloorId != null ->
                    map.floors.firstOrNull { it.id == posFloorId }?.let { it to MapCell(data.position.cellR, data.position.cellC) }
                else -> anchorForPatient(map, data.room?.id, data.bed?.id)?.let { (f, a) -> f to a.cell }
            }
            val floor = destPair?.first ?: map.floors.first()
            val dest = destPair?.second
            val start = entranceCell(floor, map.cols, map.rows)
            val path = if (dest != null) findPath(floor.cells, start, dest) else emptyList()
            val markers = buildList {
                add(MapMarker(start, MarkerKind.YOU))
                if (dest != null) add(MapMarker(dest, MarkerKind.DESTINATION, pulse = true))
            }

            HoscoreCard(Modifier.fillMaxWidth()) {
                Column {
                    Text(floor.label.ifBlank { "Floor" }, color = t.textSecondary, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                    Spacer(Modifier.height(10.dp))
                    MapCanvas(floor = floor, cols = map.cols, rows = map.rows, path = path, markers = markers)
                }
            }

            if (path.size >= 2) {
                HoscoreCard(Modifier.fillMaxWidth()) {
                    Column {
                        Text("DIRECTIONS", color = t.textSecondary, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
                        Spacer(Modifier.height(10.dp))
                        pathToDirections(path, data.room?.name ?: "your room").forEachIndexed { i, step ->
                            Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.Top) {
                                Box(
                                    Modifier.size(22.dp).clip(RoundedCornerShape(7.dp)).background(t.primary.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center,
                                ) { Text("${i + 1}", color = t.primary, fontSize = 10.sp, fontWeight = FontWeight.Black) }
                                Spacer(Modifier.height(0.dp))
                                Text(step, color = t.textSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 10.dp))
                            }
                        }
                    }
                }
            }
        } else {
            HoscoreCard(Modifier.fillMaxWidth()) {
                Text("This hospital hasn't published a map yet.", color = t.textMuted, fontSize = 13.sp, modifier = Modifier.padding(4.dp))
            }
        }

        // Share with family
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column {
                if (shareUrl == null) {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(t.primary)
                            .padding(vertical = 14.dp)
                            .clickableIf(!sharing, onShare),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (sharing) {
                            CircularProgressIndicator(color = t.onBrand, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.Share, null, tint = t.onBrand, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.height(0.dp))
                                Text("  Share my location with family", color = t.onBrand, fontWeight = FontWeight.Black, fontSize = 14.sp)
                            }
                        }
                    }
                } else {
                    Text("SHARE LINK (VALID 24H)", color = t.emerald, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                    Spacer(Modifier.height(8.dp))
                    Box(
                        Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(t.innerBg).padding(10.dp),
                    ) { Text(shareUrl, color = t.textSecondary, fontSize = 11.sp) }
                    Spacer(Modifier.height(6.dp))
                    Text("Anyone with this link can see your ward on the map. It expires automatically.", color = t.textMuted, fontSize = 10.sp)
                }
            }
        }
    }
}

private fun Modifier.clickableIf(enabled: Boolean, onClick: () -> Unit): Modifier =
    if (enabled) this.clickable(onClick = onClick) else this
