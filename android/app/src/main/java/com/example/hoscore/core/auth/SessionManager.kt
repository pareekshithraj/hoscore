package com.example.hoscore.core.auth

import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.model.ContextItem
import com.example.hoscore.core.model.Session
import com.example.hoscore.core.network.HoscoreSocket
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.SwitchContextRequest
import com.example.hoscore.core.network.apiCall

/**
 * Central authority for auth state transitions: persisting a session, switching
 * the active context (which mints a new JWT), and logging out. Keeps the socket
 * lifecycle in lockstep with the token.
 */
object SessionManager {

    private val store: SessionStore get() = ServiceLocator.sessionStore

    fun onLoggedIn(session: Session) {
        store.save(session)
        session.token?.let { HoscoreSocket.connect(it) }
    }

    fun reconnectSocketIfLoggedIn() {
        store.token?.let { HoscoreSocket.connect(it) }
    }

    suspend fun switchContext(ctx: ContextItem): Resource<Unit> {
        val result = apiCall {
            switchContext(SwitchContextRequest(contextType = ctx.type, hospitalId = ctx.hospitalId))
        }
        return when (result) {
            is Resource.Success -> {
                val newToken = result.data.token
                if (newToken.isNullOrEmpty()) {
                    Resource.Error("Could not switch context.")
                } else {
                    store.updateActiveContext(newToken, ctx)
                    HoscoreSocket.disconnect()
                    HoscoreSocket.connect(newToken)
                    Resource.Success(Unit)
                }
            }
            is Resource.Error -> result
            Resource.Loading -> Resource.Loading
        }
    }

    fun logout() {
        HoscoreSocket.disconnect()
        store.clear()
    }
}
