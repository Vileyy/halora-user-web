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
}

export default function StripePayment({
  amount,
  currency,
  onSuccess,
  onError,
  onProcessingStart,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Notify parent that we're starting payment processing (to prevent redirect)
    if (onProcessingStart) {
      onProcessingStart();
    }

    if (!stripe || !elements) {
      onError("Stripe chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // No return_url needed since we handle success in onSuccess callback
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment error:", error);
        onError(error.message || "Có lỗi xảy ra khi thanh toán");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else {
        onError("Thanh toán không thành công");
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      console.error("Payment exception:", err);
      
      // Check if error is due to blocked request (ad blocker)
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : (err as { name?: string })?.name || "";
      const isBlocked = 
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ERR_BLOCKED_BY_CLIENT") ||
        errorMessage.includes("network") ||
        errorName === "FetchError";
      
      if (isBlocked) {
        onError("Failed to fetch");
      } else {
        onError("Có lỗi xảy ra khi xử lý thanh toán");
      }
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <button
        type="submit"
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
    </form>
  );
}

