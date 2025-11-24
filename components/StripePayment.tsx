"use client";

import { useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StripePaymentProps {
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onProcessingStart?: () => void;
  onValidateBeforePayment?: () => boolean;
}

export default function StripePayment({
  amount,
  currency,
  onSuccess,
  onError,
  onProcessingStart,
  onValidateBeforePayment,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e?: FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("🔵 StripePayment: handleSubmit called");

    // Validate form BEFORE starting payment
    if (onValidateBeforePayment) {
      const isValid = onValidateBeforePayment();
      if (!isValid) {
        console.warn("⚠️ Form validation failed - cannot proceed with payment");
        // Error message should already be shown by validateForm
        return; // Don't proceed with payment if validation fails
      }
      console.log("✅ Form validation passed");
    }

    // CRITICAL: Notify parent FIRST, before any async operations
    // This must happen synchronously to prevent redirect
    if (onProcessingStart) {
      console.log("🔵 StripePayment: Calling onProcessingStart IMMEDIATELY");
      onProcessingStart();
    } else {
      console.warn("⚠️ StripePayment: onProcessingStart not provided!");
    }

    if (!stripe || !elements) {
      onError("Stripe chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }

    console.log("🔵 StripePayment: Starting payment confirmation...");
    setIsProcessing(true);

    // Set timeout to prevent hanging (declare outside try block)
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Set timeout to prevent hanging
      timeoutId = setTimeout(() => {
        console.error("⏱️ Payment timeout after 60 seconds");
        onError("Thanh toán quá thời gian chờ. Vui lòng thử lại.");
        setIsProcessing(false);
      }, 60000); // 60 seconds timeout

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // No return_url needed since we handle success in onSuccess callback
        },
        redirect: "if_required",
      });

      // Clear timeout if payment completes
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      console.log("🔵 StripePayment: Payment response received", {
        error: error?.message,
        paymentIntentStatus: paymentIntent?.status,
        paymentIntentId: paymentIntent?.id,
      });

      if (error) {
        console.error("❌ Payment error:", error);
        onError(error.message || "Có lỗi xảy ra khi thanh toán");
        setIsProcessing(false);
        return;
      }

      if (!paymentIntent) {
        console.error("❌ No payment intent returned");
        onError("Không nhận được phản hồi từ hệ thống thanh toán");
        setIsProcessing(false);
        return;
      }

      // Handle different payment intent statuses
      if (paymentIntent.status === "succeeded") {
        console.log("✅ Payment succeeded:", paymentIntent.id);
        onSuccess(paymentIntent.id);
        // Don't set isProcessing to false here, let parent handle it
      } else if (paymentIntent.status === "processing") {
        console.log("⏳ Payment is processing:", paymentIntent.id);
        // Payment is still processing, wait a bit and check again
        setTimeout(async () => {
          try {
            const updatedPaymentIntent = await stripe.retrievePaymentIntent(
              paymentIntent.client_secret!
            );
            if (updatedPaymentIntent.paymentIntent?.status === "succeeded") {
              console.log("✅ Payment succeeded after processing:", updatedPaymentIntent.paymentIntent.id);
              onSuccess(updatedPaymentIntent.paymentIntent.id);
            } else {
              onError("Thanh toán đang được xử lý. Vui lòng kiểm tra lại sau.");
              setIsProcessing(false);
            }
          } catch (err) {
            console.error("Error retrieving payment intent:", err);
            onError("Không thể kiểm tra trạng thái thanh toán");
            setIsProcessing(false);
          }
        }, 2000);
      } else if (paymentIntent.status === "requires_action") {
        console.log("⚠️ Payment requires action (3D Secure)");
        // Stripe will handle 3D Secure automatically with redirect: "if_required"
        // The payment will be confirmed after user completes the action
        // Wait a bit and check status again
        setTimeout(async () => {
          try {
            const updatedPaymentIntent = await stripe.retrievePaymentIntent(
              paymentIntent.client_secret!
            );
            if (updatedPaymentIntent.paymentIntent?.status === "succeeded") {
              console.log("✅ Payment succeeded after action:", updatedPaymentIntent.paymentIntent.id);
              onSuccess(updatedPaymentIntent.paymentIntent.id);
            } else if (updatedPaymentIntent.paymentIntent?.status === "requires_action") {
              // Still requires action, might need user interaction
              onError("Vui lòng hoàn tất xác thực thanh toán (3D Secure)");
              setIsProcessing(false);
            } else {
              onError(`Thanh toán không thành công. Trạng thái: ${updatedPaymentIntent.paymentIntent?.status}`);
              setIsProcessing(false);
            }
          } catch (err) {
            console.error("Error retrieving payment intent after action:", err);
            onError("Không thể kiểm tra trạng thái thanh toán sau xác thực");
            setIsProcessing(false);
          }
        }, 3000);
      } else {
        console.error("❌ Payment failed with status:", paymentIntent.status);
        onError(`Thanh toán không thành công. Trạng thái: ${paymentIntent.status}`);
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      console.error("❌ Payment exception:", err);
      
      // Clear timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Check if error is due to blocked request (ad blocker)
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : (err as { name?: string })?.name || "";
      const isBlocked = 
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ERR_BLOCKED_BY_CLIENT") ||
        errorMessage.includes("network") ||
        errorName === "FetchError";
      
      if (isBlocked) {
        onError("Không thể kết nối đến Stripe. Vui lòng tắt Ad Blocker và thử lại.");
      } else if (errorMessage.includes("thời gian chờ")) {
        onError(errorMessage);
      } else {
        onError("Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.");
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang xử lý thanh toán...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Thanh toán {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: currency.toUpperCase(),
            }).format(amount)}</span>
          </>
        )}
      </button>
    </div>
  );
}

