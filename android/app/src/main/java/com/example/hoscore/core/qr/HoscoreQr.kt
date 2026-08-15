package com.example.hoscore.core.qr

/**
 * Canonical Hoscore QR payloads — must stay in sync with `client/src/utils/hoscoreQr.ts`.
 *
 *   HOSCORE:PATIENT:<sixDigitId>
 *   HOSCORE:VISIT:<sixDigitId>:<appointmentId>:<token>
 *   HOSCORE:HOSPITAL:<hospitalId>
 *   HOSCORE:STAFF:<staffId>
 *
 * Legacy payloads from earlier builds are still accepted.
 */
sealed class HoscoreQr {
    data class Patient(val sixDigitId: String) : HoscoreQr()
    data class Visit(val sixDigitId: String, val appointmentId: String, val token: String) : HoscoreQr()
    data class Hospital(val hospitalId: String) : HoscoreQr()
    data class Staff(val staffId: String) : HoscoreQr()
}

object HoscoreQrCodec {
    fun encodePatient(sixDigitId: String): String = "HOSCORE:PATIENT:${digits(sixDigitId)}"

    fun encodeVisit(sixDigitId: String, appointmentId: String, token: Any): String =
        "HOSCORE:VISIT:${digits(sixDigitId)}:$appointmentId:$token"

    fun encodeHospital(hospitalId: String): String = "HOSCORE:HOSPITAL:$hospitalId"

    fun encodeStaff(staffId: String): String = "HOSCORE:STAFF:$staffId"

    fun parse(raw: String?): HoscoreQr? {
        val text = raw?.trim().orEmpty()
        if (text.isEmpty()) return null

        Regex("^(?:HSC-)?(\\d{6})$", RegexOption.IGNORE_CASE).matchEntire(text)?.let {
            return HoscoreQr.Patient(it.groupValues[1])
        }

        val parts = text.split(':')
        if (parts.firstOrNull() != "HOSCORE" || parts.size < 2) return null

        val a = parts.getOrNull(1).orEmpty()
        val b = parts.getOrNull(2).orEmpty()

        when (a) {
            "PATIENT" -> {
                val six = digits(b)
                return if (six.length == 6) HoscoreQr.Patient(six) else null
            }
            "VISIT" -> {
                val six = digits(b)
                if (six.length != 6) return null
                return HoscoreQr.Visit(
                    sixDigitId = six,
                    appointmentId = parts.getOrNull(3).orEmpty(),
                    token = parts.getOrNull(4).orEmpty().replace(Regex("^TOKEN-", RegexOption.IGNORE_CASE), ""),
                )
            }
            "HOSPITAL" -> if (b.isNotBlank()) return HoscoreQr.Hospital(b)
            "STAFF" -> if (b.isNotBlank()) return HoscoreQr.Staff(b)
        }

        if (b == "HOSPITAL") return HoscoreQr.Hospital(a)
        if (b == "STAFF") return HoscoreQr.Staff(a)

        val six = digits(a)
        if (six.length != 6) return null
        return if (parts.size >= 4) {
            HoscoreQr.Visit(
                sixDigitId = six,
                appointmentId = parts[2],
                token = parts[3].replace(Regex("^TOKEN-", RegexOption.IGNORE_CASE), ""),
            )
        } else {
            HoscoreQr.Patient(six)
        }
    }

    fun patientIdFrom(raw: String?): String? = when (val parsed = parse(raw)) {
        is HoscoreQr.Patient -> parsed.sixDigitId
        is HoscoreQr.Visit -> parsed.sixDigitId
        else -> null
    }

    private fun digits(value: String): String = value.filter { it.isDigit() }
}
