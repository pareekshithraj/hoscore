package com.example.hoscore.feature.auth

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.hoscore.core.auth.SessionManager
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.model.Challenge
import com.example.hoscore.core.model.Session
import com.example.hoscore.core.network.Environment
import com.example.hoscore.core.network.LoginRequest
import com.example.hoscore.core.network.OtpStartRequest
import com.example.hoscore.core.network.OtpResendRequest
import com.example.hoscore.core.network.OtpVerifyRequest
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.apiCall
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val useDev: Boolean = Environment.useDev,
    // OTP challenge state
    val challenge: Challenge? = null,
    val otpChannel: String = "phone",
    val loggedIn: Boolean = false,
)

class AuthViewModel : ViewModel() {
    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    fun setDev(context: Context, value: Boolean) {
        Environment.setUseDev(context, value)
        ServiceLocator.rebuild()
        _state.value = _state.value.copy(useDev = value)
    }

    fun login(identifier: String, password: String) {
        if (identifier.isBlank() || password.isBlank()) {
            _state.value = _state.value.copy(error = "Enter your email/phone and password.")
            return
        }
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val res = apiCall { login(LoginRequest(identifier.trim(), password)) }) {
                is Resource.Success -> handleAuthResponse(res.data)
                is Resource.Error -> _state.value = _state.value.copy(loading = false, error = res.message)
                Resource.Loading -> Unit
            }
        }
    }

    fun startOtp(identifier: String) {
        if (identifier.isBlank()) {
            _state.value = _state.value.copy(error = "Enter your phone number.")
            return
        }
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val res = apiCall { startOtpLogin(OtpStartRequest(identifier.trim())) }) {
                is Resource.Success -> handleAuthResponse(res.data)
                is Resource.Error -> _state.value = _state.value.copy(loading = false, error = res.message)
                Resource.Loading -> Unit
            }
        }
    }

    fun verifyOtp(code: String) {
        val challengeId = _state.value.challenge?.challengeId ?: return
        if (code.length < 4) {
            _state.value = _state.value.copy(error = "Enter the full code.")
            return
        }
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            val res = apiCall {
                verifyOtp(OtpVerifyRequest(challengeId, _state.value.otpChannel, code.trim()))
            }
            when (res) {
                is Resource.Success -> handleAuthResponse(res.data)
                is Resource.Error -> _state.value = _state.value.copy(loading = false, error = res.message)
                Resource.Loading -> Unit
            }
        }
    }

    fun resendOtp() {
        val challengeId = _state.value.challenge?.challengeId ?: return
        viewModelScope.launch {
            apiCall { resendOtp(OtpResendRequest(challengeId, _state.value.otpChannel)) }
        }
    }

    fun switchOtpChannel(channel: String) {
        _state.value = _state.value.copy(otpChannel = channel)
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    fun cancelOtp() {
        _state.value = _state.value.copy(challenge = null, error = null)
    }

    private fun handleAuthResponse(session: Session) {
        // OTP required → move to the verify step.
        if (session.requiresOtp && session.challenge != null) {
            val ch = session.challenge
            val channel = when {
                ch.required?.phone == true -> "phone"
                ch.required?.email == true -> "email"
                else -> "phone"
            }
            _state.value = _state.value.copy(loading = false, challenge = ch, otpChannel = channel, error = null)
            return
        }
        // Full session → logged in.
        if (!session.token.isNullOrEmpty()) {
            SessionManager.onLoggedIn(session)
            _state.value = _state.value.copy(loading = false, loggedIn = true, error = null)
        } else {
            _state.value = _state.value.copy(loading = false, error = session.error ?: "Unexpected response.")
        }
    }
}
