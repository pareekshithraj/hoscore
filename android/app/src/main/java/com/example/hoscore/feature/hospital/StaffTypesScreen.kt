package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.network.StaffType
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.ListViewModel
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.theme.HoscoreTokens

class StaffTypesVM : ListViewModel<List<StaffType>>({ getStaffTypes() })

@Composable
fun StaffTypesScreen(onBack: () -> Unit, vm: StaffTypesVM = viewModel()) {
    val t = HoscoreTokens.current
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Staff Types & Roles", "Custom staff privileges & roles", onBack = onBack)
        DataScreen(vm) { list ->
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(list, key = { it.id }) { item ->
                    HoscoreCard(Modifier.fillMaxWidth()) {
                        Column {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text(item.name, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                                Text("${item.permissions.size} Privileges", fontSize = 11.sp, color = t.primary, fontWeight = FontWeight.Bold)
                            }
                            if (!item.description.isNullOrEmpty()) {
                                Spacer(Modifier.height(4.dp))
                                Text(item.description, color = t.textMuted, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
