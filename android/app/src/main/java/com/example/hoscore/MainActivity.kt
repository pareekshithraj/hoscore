package com.example.hoscore

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.example.hoscore.theme.HoscoreTheme
import com.example.hoscore.ui.splash.SplashScreen

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    enableEdgeToEdge()
    setContent {
      HoscoreTheme { 
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { 
          var showSplash by remember { mutableStateOf(true) }
          if (showSplash) {
            SplashScreen(onSplashComplete = { showSplash = false })
          } else {
            MainNavigation() 
          }
        } 
      }
    }
  }
}
