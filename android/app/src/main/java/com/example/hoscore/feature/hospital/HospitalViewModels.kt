package com.example.hoscore.feature.hospital

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.Admission
import com.example.hoscore.core.network.HoscoreSocket
import com.example.hoscore.core.network.Patient
import com.example.hoscore.core.network.QueueItem
import com.example.hoscore.core.network.Room
import com.example.hoscore.core.network.Stats
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.ui.ListViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PatientsVM : ListViewModel<List<Patient>>({ getPatients() })
class RoomsVM : ListViewModel<List<Room>>({ getRooms() })

/** Dashboard stats + live socket refresh. */
class HospitalDashboardVM : ViewModel() {
    private val _state = MutableStateFlow<Resource<Stats>>(Resource.Loading)
    val state: StateFlow<Resource<Stats>> = _state.asStateFlow()
    private var started = false

    fun start() {
        if (started) return
        started = true
        refresh()
        viewModelScope.launch {
            HoscoreSocket.events.collect { refresh() }
        }
    }

    fun refresh() {
        viewModelScope.launch { _state.value = apiCall { getStats() } }
    }
}

/** OPD queue with live refresh + status mutations. */
class QueueVM : ViewModel() {
    private val _state = MutableStateFlow<Resource<List<QueueItem>>>(Resource.Loading)
    val state: StateFlow<Resource<List<QueueItem>>> = _state.asStateFlow()
    private var started = false

    fun start() {
        if (started) return
        started = true
        refresh()
        viewModelScope.launch { HoscoreSocket.events.collect { refresh() } }
    }

    fun refresh() {
        viewModelScope.launch { _state.value = apiCall { getQueue() } }
    }

    fun advance(item: QueueItem) {
        val next = when (item.status.uppercase()) {
            "WAITING" -> "IN_CONSULTATION"
            "IN_CONSULTATION" -> "COMPLETED"
            else -> return
        }
        viewModelScope.launch {
            apiCall { updateQueueStatus(item.id, mapOf("status" to next)) }
            refresh()
        }
    }
}

class AdmissionsVM : ListViewModel<List<Admission>>({ getAdmissions() }) {
    fun discharge(id: String) = mutate { dischargeAdmission(id) }
}
