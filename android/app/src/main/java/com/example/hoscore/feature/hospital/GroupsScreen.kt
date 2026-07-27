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
import com.example.hoscore.core.network.GroupItem
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.ListViewModel
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.theme.HoscoreTokens

class GroupsVM : ListViewModel<List<GroupItem>>({ getGroups() })

@Composable
fun GroupsScreen(onBack: () -> Unit, vm: GroupsVM = viewModel()) {
    val t = HoscoreTokens.current
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Department Groups", "Team messaging & department channels", onBack = onBack)
        DataScreen(vm) { list ->
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(list, key = { it.id }) { item ->
                    HoscoreCard(Modifier.fillMaxWidth()) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(item.name, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                                if (!item.description.isNullOrEmpty()) {
                                    Text(item.description, color = t.textMuted, fontSize = 12.sp)
                                }
                            }
                            Text("${item.memberCount} Members", fontWeight = FontWeight.Bold, color = t.primary, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
