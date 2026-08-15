package com.example.hoscore

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.hoscore.core.notifications.CallAlerts
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
import com.example.hoscore.core.payments.RazorpayBridge
import com.example.hoscore.core.ui.theme.HoscoreTheme
import com.example.hoscore.ui.splash.SplashScreen
import com.razorpay.Checkout
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener

class MainActivity : ComponentActivity(), PaymentResultWithDataListener {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Checkout.preload(applicationContext)

        // Wire the manual DI container and force-logout on any 401.
        ServiceLocator.init(this)
        ServiceLocator.onUnauthorized = { SessionManager.logout() }
        CallAlerts.start(this)
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
        }

        val appState = AppState(this)

        setContent {
            HoscoreTheme(darkTheme = false) {
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

    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        RazorpayBridge.onSuccess(razorpayPaymentId, paymentData)
    }

    override fun onPaymentError(code: Int, response: String?, paymentData: PaymentData?) {
        RazorpayBridge.onError(response)
    }
}
