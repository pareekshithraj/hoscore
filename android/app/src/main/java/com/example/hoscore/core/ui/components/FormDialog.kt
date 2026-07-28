package com.example.hoscore.core.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun FormDialog(
    title: String,
    onDismiss: () -> Unit,
    onSubmit: () -> Unit,
    submitLabel: String = "Save",
    submitEnabled: Boolean = true,
    content: @Composable () -> Unit,
) {
    val t = HoscoreTokens.current
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Black, color = t.textPrimary) },
        text = {
            Column(
                Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) { content() }
        },
        confirmButton = {
            Button(
                onClick = onSubmit,
                enabled = submitEnabled,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = t.primary),
            ) { Text(submitLabel, fontWeight = FontWeight.Bold) }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss, shape = RoundedCornerShape(12.dp)) {
                Text("Cancel", color = t.textSecondary)
            }
        },
        containerColor = t.card,
        shape = RoundedCornerShape(20.dp),
    )
}

@Composable
fun FormField(
    value: String,
    onChange: (String) -> Unit,
    label: String,
    singleLine: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val t = HoscoreTokens.current
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        singleLine = singleLine,
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = t.primary,
            unfocusedBorderColor = t.cardBorder,
            focusedTextColor = t.textPrimary,
            unfocusedTextColor = t.textPrimary,
            focusedLabelColor = t.primary,
            unfocusedLabelColor = t.textMuted,
            focusedContainerColor = t.card,
            unfocusedContainerColor = t.card,
        ),
        modifier = modifier.fillMaxWidth(),
    )
}

@Composable
fun ActionRow(vararg actions: Pair<String, () -> Unit>) {
    val t = HoscoreTokens.current
    Row(
        Modifier.fillMaxWidth().padding(top = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        actions.forEach { (label, onClick) ->
            OutlinedButton(
                onClick = onClick,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.weight(1f).height(38.dp),
            ) {
                Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.primary)
            }
        }
    }
}

@Composable
fun Spacer8() = Spacer(Modifier.height(8.dp))
