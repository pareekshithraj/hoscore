package com.example.hoscore.core.qr

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun HoscorePassDialog(
    title: String,
    name: String,
    idLabel: String,
    payload: String,
    caption: String,
    accent: Color,
    onDismiss: () -> Unit,
) {
    SecurePassWindow()
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF0F172A),
        title = {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(title, fontWeight = FontWeight.Black, fontSize = 13.sp, color = accent, letterSpacing = 1.5.sp)
            }
        },
        text = {
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.verticalGradient(listOf(Color(0xFF0B1220), Color(0xFF020617))))
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(name, fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color.White, textAlign = TextAlign.Center)
                Spacer(Modifier.height(6.dp))
                Text(
                    idLabel,
                    fontWeight = FontWeight.Black,
                    fontSize = 13.sp,
                    color = accent,
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(accent.copy(0.15f))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                )
                Spacer(Modifier.height(16.dp))
                HoscoreQrImage(payload = payload, size = 188.dp)
                Spacer(Modifier.height(14.dp))
                Text(caption, fontSize = 11.sp, color = Color(0xFF94A3B8), textAlign = TextAlign.Center, fontWeight = FontWeight.Medium)
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = accent),
            ) { Text("Close pass", fontWeight = FontWeight.Bold) }
        },
    )
}
