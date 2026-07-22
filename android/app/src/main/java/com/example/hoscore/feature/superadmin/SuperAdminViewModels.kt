package com.example.hoscore.feature.superadmin

import com.example.hoscore.core.network.AdminHospital
import com.example.hoscore.core.network.AdminUser
import com.example.hoscore.core.network.Subscription
import com.example.hoscore.core.network.SuperAdminStats
import com.example.hoscore.core.ui.ListViewModel

class SuperAdminStatsVM : ListViewModel<SuperAdminStats>({ getSuperAdminStats() })

class AdminHospitalsVM : ListViewModel<List<AdminHospital>>({ getAdminHospitals() }) {
    fun toggle(id: String) = mutate { toggleHospital(id) }
}

class AdminUsersVM : ListViewModel<List<AdminUser>>({ getAdminUsers() }) {
    fun toggle(id: String) = mutate { toggleUser(id) }
}

class SubscriptionsVM : ListViewModel<List<Subscription>>({ getSubscriptions() })
