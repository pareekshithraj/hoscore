package com.example.hoscore.core.model

import kotlinx.serialization.Serializable

/**
 * Mirrors the HOSCORE backend session payload returned by /auth/login and
 * /auth/verify-otp. One identity can hold several [ContextItem]s; the JWT is
 * scoped to exactly one active context.
 */
@Serializable
data class Session(
    val token: String? = null,
    val user: User? = null,
    val contexts: List<ContextItem> = emptyList(),
    val activeContext: ContextItem? = null,
    // OTP challenge flow
    val requiresOtp: Boolean = false,
    val challenge: Challenge? = null,
    val error: String? = null,
)

@Serializable
data class User(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String? = null,
    val isSuperAdmin: Boolean = false,
)

@Serializable
data class ContextItem(
    val type: String = "patient", // hospital | patient | superadmin
    val hospitalId: String? = null,
    val hospitalName: String? = null,
    val role: String? = null,
    val department: String? = null,
    val permissions: List<String> = emptyList(),
    val staffTypeId: String? = null,
    val staffTypeName: String? = null,
)

@Serializable
data class Challenge(
    val challengeId: String = "",
    val purpose: String? = null,
    val required: ChannelFlags? = null,
    val verified: ChannelFlags? = null,
    val expiresAt: String? = null,
    val warnings: List<String> = emptyList(),
)

@Serializable
data class ChannelFlags(
    val email: Boolean = false,
    val phone: Boolean = false,
)
