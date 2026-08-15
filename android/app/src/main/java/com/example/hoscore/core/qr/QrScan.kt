package com.example.hoscore.core.qr

import android.app.Activity
import android.view.WindowManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalView
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

@Composable
fun rememberHoscoreQrScanner(onResult: (HoscoreQr) -> Unit, onInvalid: (() -> Unit)? = null): () -> Unit {
    val launcher = rememberLauncherForActivityResult(ScanContract()) { result ->
        val parsed = HoscoreQrCodec.parse(result.contents)
        if (parsed != null) onResult(parsed) else onInvalid?.invoke()
    }
    return remember(launcher) {
        {
            launcher.launch(
                ScanOptions().apply {
                    setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                    setPrompt("Scan a Hoscore pass, visit token, or hospital QR")
                    setBeepEnabled(false)
                    setOrientationLocked(false)
                }
            )
        }
    }
}

/** Blocks screenshots while a health pass is on screen. */
@Composable
fun SecurePassWindow() {
    val view = LocalView.current
    DisposableEffect(Unit) {
        val window = (view.context as? Activity)?.window
        window?.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        onDispose { window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE) }
    }
}
