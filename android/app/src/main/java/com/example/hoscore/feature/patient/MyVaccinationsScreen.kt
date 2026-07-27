package com.example.hoscore.feature.patient

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
import com.example.hoscore.core.network.Vaccination
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.ListViewModel
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.theme.HoscoreTokens

class MyVaccinationsVM : ListViewModel<List<Vaccination>>({ getMyVaccinations() })

@Composable
fun MyVaccinationsScreen(onBack: (() -> Unit)? = null, vm: MyVaccinationsVM = viewModel()) {
    val t = HoscoreTokens.current
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("My Vaccinations", "Digital immunisation record & passport", onBack = onBack)
        DataScreen(vm) { list ->
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (list.isEmpty()) {
                    item {
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Text("No vaccination records found.", color = t.textMuted, fontSize = 13.sp)
                        }
                    }
                } else {
                    items(list, key = { it.id }) { v ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(v.name, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                                    if (v.provider != null) Text("Provider: ${v.provider}", color = t.textMuted, fontSize = 12.sp)
                                    if (v.date != null) Text("Dose Date: ${v.date}", color = t.textSecondary, fontSize = 12.sp)
                                }
                                StatusBadge("VERIFIED", t.emerald)
                            }
                        }
                    }
                }
            }
        }
    }
}
