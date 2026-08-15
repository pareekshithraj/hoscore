package com.example.hoscore.core.payments

import android.app.Activity
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.VerifyPaymentRequest
import com.example.hoscore.core.network.apiCall
import com.razorpay.Checkout
import com.razorpay.PaymentData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.json.JSONObject
import kotlin.coroutines.resume

object RazorpayBridge {
    @Volatile
    var pending: ((success: Boolean, paymentId: String?, orderId: String?, signature: String?, error: String?) -> Unit)? = null

    fun onSuccess(paymentId: String?, data: PaymentData?) {
        pending?.invoke(true, paymentId, data?.orderId, data?.signature, null)
        pending = null
    }

    fun onError(message: String?) {
        pending?.invoke(false, null, null, null, message ?: "Payment failed")
        pending = null
    }
}

suspend fun payPatientBill(activity: Activity, billId: String): Resource<Unit> {
    val orderRes = apiCall { createPatientBillOrder(billId) }
    if (orderRes is Resource.Error) return orderRes
    val order = (orderRes as Resource.Success).data
    val mock = order.mockMode || order.orderId.startsWith("order_mock_")
    if (mock) {
        return when (
            val verify = apiCall {
                verifyPatientBillPayment(
                    VerifyPaymentRequest(
                        razorpay_order_id = order.orderId,
                        razorpay_payment_id = "pay_mock_${System.currentTimeMillis()}",
                        razorpay_signature = "mock",
                    )
                )
            }
        ) {
            is Resource.Success -> Resource.Success(Unit)
            is Resource.Error -> verify
            Resource.Loading -> Resource.Error("Payment pending")
        }
    }
    val key = order.keyId
    if (key.isNullOrBlank()) return Resource.Error("Online payments are not configured.")

    val checkout = withContext(Dispatchers.Main) {
        suspendCancellableCoroutine { cont ->
            RazorpayBridge.pending = { success, paymentId, orderId, signature, error ->
                if (!cont.isActive) return@pending
                if (success && !paymentId.isNullOrBlank() && !orderId.isNullOrBlank() && !signature.isNullOrBlank()) {
                    cont.resume(Resource.Success(Triple(paymentId, orderId, signature)))
                } else {
                    cont.resume(Resource.Error(error ?: "Payment cancelled"))
                }
            }
            try {
                val options = JSONObject().apply {
                    put("name", "Hoscore")
                    put("description", "Medical bill")
                    put("currency", order.currency)
                    put("amount", order.amount.toLong())
                    put("order_id", order.orderId)
                    put("theme", JSONObject().put("color", "#e11d48"))
                }
                Checkout().apply { setKeyID(key) }.open(activity, options)
            } catch (e: Exception) {
                RazorpayBridge.pending = null
                if (cont.isActive) cont.resume(Resource.Error(e.message ?: "Could not open checkout"))
            }
            cont.invokeOnCancellation { RazorpayBridge.pending = null }
        }
    }
    if (checkout is Resource.Error) return checkout
    val (paymentId, orderId, signature) = (checkout as Resource.Success).data
    return when (
        val verify = apiCall {
            verifyPatientBillPayment(
                VerifyPaymentRequest(
                    razorpay_order_id = orderId,
                    razorpay_payment_id = paymentId,
                    razorpay_signature = signature,
                )
            )
        }
    ) {
        is Resource.Success -> Resource.Success(Unit)
        is Resource.Error -> verify
        Resource.Loading -> Resource.Error("Payment pending")
    }
}
