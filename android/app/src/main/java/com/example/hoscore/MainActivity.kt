package com.example.hoscore

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.example.hoscore.app.AppState
import com.example.hoscore.app.HoscoreApp
import com.example.hoscore.core.auth.SessionManager
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.ui.theme.HoscoreTheme
import com.example.hoscore.ui.splash.SplashScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Wire the manual DI container and force-logout on any 401.
        ServiceLocator.init(this)
        ServiceLocator.onUnauthorized = { SessionManager.logout() }

        val appState = AppState(this)

        enableEdgeToEdge()
        setContent {
            HoscoreTheme(darkTheme = appState.darkMode) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var showSplash by remember { mutableStateOf(true) }
                    if (showSplash) {
                        SplashScreen(onSplashComplete = { showSplash = false })
                    } else {
                        HoscoreApp(appState)
                    }
                }
            }
        }
    }
}
