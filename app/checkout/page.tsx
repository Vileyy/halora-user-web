"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAppSelector } from "@/store/hooks";
import { CartItem } from "@/types";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Mail,
  ChevronDown,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  addressService,
  Province,
  District,
  Ward,
} from "@/services/addressService";
import { orderService } from "@/services/orderService";
import { useAppDispatch } from "@/store/hooks";
import {
  removeFromCart,
  deselectAllItems,
  syncCartToDatabase,
} from "@/store/cartSlice";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePayment from "@/components/StripePayment";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    items,
    selectedItems,
    appliedProductVoucher,
    appliedShippingVoucher,
  } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const [selectedItemsData, setSelectedItemsData] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPaymentIntent, setIsLoadingPaymentIntent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);

  // Address data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    provinceCode: "",
    districtCode: "",
    wardCode: "",
    note: "",
    paymentMethod: "cod", // cod = cash on delivery
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate totals (moved up to be available for useEffect)
  const subtotal = selectedItemsData.reduce((sum, item) => {
    const price = item.product?.minPrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const productDiscount = appliedProductVoucher?.discountAmount || 0;
  const shippingDiscount = appliedShippingVoucher?.discountAmount || 0;
  const totalDiscount = productDiscount + shippingDiscount;
  const shippingFee = 30000;
  const finalAmount = subtotal - totalDiscount + shippingFee;

  // Initialize Stripe
  useEffect(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey) {
      const stripe = loadStripe(publishableKey);
      setStripePromise(stripe);
    }
  }, []);

  // Create payment intent when Stripe payment method is selected
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (
        formData.paymentMethod !== "stripe" ||
        !user ||
        selectedItemsData.length === 0
      ) {
        setClientSecret(null);
        return;
      }

      setIsLoadingPaymentIntent(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_STRIPE_BACKEND_URL;
        if (!backendUrl) {
          toast.error("Cấu hình Stripe chưa đầy đủ!");
          return;
        }

        const response = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(finalAmount), // Amount in smallest currency unit (VND)
            currency: process.env.NEXT_PUBLIC_STRIPE_CURRENCY || "vnd",
            metadata: {
              userId: user.id,
              email: formData.email || user.email || "",
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to create payment intent: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: unknown) {
        console.error("Error creating payment intent:", error);

        // Check if error is due to network/blocked request
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorName =
          error instanceof Error
            ? error.name
            : (error as { name?: string })?.name || "";
        const isNetworkError =
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("ERR_BLOCKED_BY_CLIENT") ||
          errorMessage.includes("network") ||
          errorName === "FetchError" ||
          errorName === "TypeError";

        if (isNetworkError) {
          toast.error(
            "Không thể kết nối đến server thanh toán. Vui lòng kiểm tra kết nối internet hoặc tắt Ad Blocker và thử lại.",
            { duration: 5000 }
          );
        } else {
          toast.error("Không thể khởi tạo thanh toán. Vui lòng thử lại!");
        }
        setFormData((prev) => ({ ...prev, paymentMethod: "cod" }));
      } finally {
        setIsLoadingPaymentIntent(false);
      }
    };

    createPaymentIntent();
  }, [
    formData.paymentMethod,
    formData.email,
    finalAmount,
    user,
    selectedItemsData.length,
  ]);

  // Initial load - only run once when component mounts or when auth state changes
  useEffect(() => {
    // Don't redirect if we're processing Stripe payment or showing success modal
    if (
      isProcessingStripe ||
      showSuccessModal ||
      isSubmitting ||
      isOrderCompleted
    ) {
      return;
    }

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Get selected items or all items if none selected
    const itemsToCheckout =
      selectedItems.length > 0
        ? items.filter((item) => selectedItems.includes(item.id))
        : items;

    if (itemsToCheckout.length === 0) {
      toast.error("Không có sản phẩm nào để thanh toán!");
      router.push("/cart");
      return;
    }

    setSelectedItemsData(itemsToCheckout);

    // Pre-fill form with user data if available
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    router,
    user,
    isProcessingStripe,
    showSuccessModal,
    isSubmitting,
    isOrderCompleted,
  ]);

  // Update selectedItemsData when items or selectedItems change (but not if order is completed)
  useEffect(() => {
    // Don't update if order is completed or submitting
    if (isOrderCompleted || isSubmitting) {
      return;
    }

    // Get selected items or all items if none selected
    const itemsToCheckout =
      selectedItems.length > 0
        ? items.filter((item) => selectedItems.includes(item.id))
        : items;

    // Only update if we have items (don't clear if items become empty after order)
    if (itemsToCheckout.length > 0) {
      setSelectedItemsData(itemsToCheckout);
    }
  }, [items, selectedItems, isOrderCompleted, isSubmitting]);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setIsLoadingAddress(true);
      try {
        const data = await addressService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Error loading provinces:", error);
        toast.error("Không thể tải danh sách địa chỉ!");
      } finally {
        setIsLoadingAddress(false);
      }
    };

    loadProvinces();
  }, []);

  // Update districts when province changes
  useEffect(() => {
    if (formData.provinceCode) {
      const loadDistricts = async () => {
        setIsLoadingAddress(true);
        try {
          const districtsData = await addressService.getDistricts(
            formData.provinceCode
          );
          setDistricts(districtsData);
          setWards([]);
          // Reset district and ward when province changes
          setFormData((prev) => ({
            ...prev,
            districtCode: "",
            wardCode: "",
          }));
        } catch (error) {
          console.error("Error loading districts:", error);
        } finally {
          setIsLoadingAddress(false);
        }
      };

      loadDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [formData.provinceCode]);

  // Update wards when district changes
  useEffect(() => {
    if (formData.districtCode) {
      const loadWards = async () => {
        setIsLoadingAddress(true);
        try {
          const wardsData = await addressService.getWards(
            formData.districtCode
          );
          setWards(wardsData);
          // Reset ward when district changes
          setFormData((prev) => ({
            ...prev,
            wardCode: "",
          }));
        } catch (error) {
          console.error("Error loading wards:", error);
        } finally {
          setIsLoadingAddress(false);
        }
      };

      loadWards();
    } else {
      setWards([]);
    }
  }, [formData.districtCode]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên!";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại!";
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ!";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email!";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ!";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ!";
    }
    if (!formData.provinceCode) {
      newErrors.provinceCode = "Vui lòng chọn Tỉnh/Thành phố!";
    }
    if (!formData.districtCode) {
      newErrors.districtCode = "Vui lòng chọn Quận/Huyện!";
    }
    if (!formData.wardCode) {
      newErrors.wardCode = "Vui lòng chọn Phường/Xã!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStripePaymentSuccess = async () => {
    // Set flag to prevent redirect
    setIsProcessingStripe(true);

    // Payment successful, now create the order
    if (!user || !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt hàng!");
      setIsProcessingStripe(false);
      return;
    }

    // Validate form before creating order
    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      setIsProcessingStripe(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get province, district, ward names
      const selectedProvince = provinces.find(
        (p) => p.code === formData.provinceCode
      );
      const selectedDistrict = districts.find(
        (d) => d.code === formData.districtCode
      );
      const selectedWard = wards.find((w) => w.code === formData.wardCode);

      // Create order in database after successful payment
      const orderId = await orderService.createOrder(
        user.id,
        selectedItemsData,
        {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          provinceCode: formData.provinceCode,
          districtCode: formData.districtCode,
          wardCode: formData.wardCode,
          note: formData.note,
        },
        {
          subtotal,
          productDiscount,
          shippingDiscount,
          shippingFee,
          finalAmount,
        },
        "stripe",
        {
          product: appliedProductVoucher
            ? {
                code: appliedProductVoucher.code,
                discountAmount: appliedProductVoucher.discountAmount,
              }
            : undefined,
          shipping: appliedShippingVoucher
            ? {
                code: appliedShippingVoucher.code,
                discountAmount: appliedShippingVoucher.discountAmount,
              }
            : undefined,
        },
        {
          province: selectedProvince
            ? {
                name: selectedProvince.name,
                code: String(selectedProvince.code),
              }
            : undefined,
          district: selectedDistrict
            ? {
                name: selectedDistrict.name,
                code: String(selectedDistrict.code),
              }
            : undefined,
          ward: selectedWard
            ? { name: selectedWard.name, code: String(selectedWard.code) }
            : undefined,
        }
      );

      // Remove ordered items from cart
      selectedItemsData.forEach((item) => {
        dispatch(removeFromCart(item.id));
      });

      // Clear selected items
      dispatch(deselectAllItems());

      // Mark order as completed FIRST to prevent useEffect from running
      setIsOrderCompleted(true);

      // Sync cart to database after removing items
      const remainingItems = items.filter(
        (item) => !selectedItems.includes(item.id)
      );
      await dispatch(
        syncCartToDatabase({ userId: user.id, items: remainingItems })
      );

      setClientSecret(null);
      setIsProcessingStripe(false);

      // Show success modal
      setSuccessOrderId(orderId);
      setShowSuccessModal(true);

      // Auto close modal and redirect after 1.5 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push(`/order/${orderId}`);
      }, 1500);
    } catch (error) {
      console.error("Error creating order after payment:", error);
      toast.error("Có lỗi xảy ra khi tạo đơn hàng!");
      setIsProcessingStripe(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripePaymentError = (error: string) => {
    // Check if error is about ad blocker
    const isAdBlockerError =
      error.includes("Failed to fetch") ||
      error.includes("ERR_BLOCKED_BY_CLIENT") ||
      error.includes("network");

    if (isAdBlockerError) {
      toast.error(
        "Không thể kết nối đến Stripe. Vui lòng tắt Ad Blocker hoặc extension chặn quảng cáo và thử lại.",
        { duration: 6000 }
      );
    } else {
      toast.error(error);
    }
    setIsSubmitting(false);
    setIsProcessingStripe(false);
  };

  const handleStripePaymentProcessingStart = () => {
    // Set flag immediately to prevent redirect
    setIsProcessingStripe(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If Stripe payment is selected, don't submit form directly
    // The StripePayment component will handle it
    if (formData.paymentMethod === "stripe") {
      return;
    }

    // Validate all required fields
    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    if (!user || !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt hàng!");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get province, district, ward names
      const selectedProvince = provinces.find(
        (p) => p.code === formData.provinceCode
      );
      const selectedDistrict = districts.find(
        (d) => d.code === formData.districtCode
      );
      const selectedWard = wards.find((w) => w.code === formData.wardCode);

      // Create order in database
      const orderId = await orderService.createOrder(
        user.id,
        selectedItemsData,
        {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          provinceCode: formData.provinceCode,
          districtCode: formData.districtCode,
          wardCode: formData.wardCode,
          note: formData.note,
        },
        {
          subtotal,
          productDiscount,
          shippingDiscount,
          shippingFee,
          finalAmount,
        },
        formData.paymentMethod,
        {
          product: appliedProductVoucher
            ? {
                code: appliedProductVoucher.code,
                discountAmount: appliedProductVoucher.discountAmount,
              }
            : undefined,
          shipping: appliedShippingVoucher
            ? {
                code: appliedShippingVoucher.code,
                discountAmount: appliedShippingVoucher.discountAmount,
              }
            : undefined,
        },
        {
          province: selectedProvince
            ? {
                name: selectedProvince.name,
                code: String(selectedProvince.code),
              }
            : undefined,
          district: selectedDistrict
            ? {
                name: selectedDistrict.name,
                code: String(selectedDistrict.code),
              }
            : undefined,
          ward: selectedWard
            ? { name: selectedWard.name, code: String(selectedWard.code) }
            : undefined,
        }
      );

      // Remove ordered items from cart
      selectedItemsData.forEach((item) => {
        dispatch(removeFromCart(item.id));
      });

      // Clear selected items
      dispatch(deselectAllItems());

      // Mark order as completed FIRST to prevent useEffect from running
      setIsOrderCompleted(true);

      // Sync cart to database after removing items
      const remainingItems = items.filter(
        (item) => !selectedItems.includes(item.id)
      );
      await dispatch(
        syncCartToDatabase({ userId: user.id, items: remainingItems })
      );

      toast.success("Đặt hàng thành công!");

      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        router.push(`/order/${orderId}`);
      }, 100);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Có lỗi xảy ra khi đặt hàng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/cart"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại giỏ hàng</span>
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Thanh toán
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Shipping Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-pink-600" />
                  <span>Thông tin giao hàng</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                        placeholder="Nhập họ và tên"
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                          placeholder="Nhập số điện thoại"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                          placeholder="Nhập email"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                      placeholder="Số nhà, tên đường"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="provinceCode"
                          value={formData.provinceCode}
                          onChange={handleInputChange}
                          required
                          disabled={isLoadingAddress}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 appearance-none bg-white pr-10"
                        >
                          <option value="">
                            {isLoadingAddress
                              ? "Đang tải..."
                              : "Chọn Tỉnh/Thành phố"}
                          </option>
                          {provinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.provinceCode && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.provinceCode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quận/Huyện <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="districtCode"
                          value={formData.districtCode}
                          onChange={handleInputChange}
                          required
                          disabled={
                            !formData.provinceCode || districts.length === 0
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 appearance-none bg-white pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!formData.provinceCode
                              ? "Chọn Tỉnh/Thành phố trước"
                              : districts.length === 0
                              ? "Đang tải..."
                              : "Chọn Quận/Huyện"}
                          </option>
                          {districts.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.districtCode && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.districtCode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phường/Xã <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="wardCode"
                          value={formData.wardCode}
                          onChange={handleInputChange}
                          required
                          disabled={
                            !formData.districtCode || wards.length === 0
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 appearance-none bg-white pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!formData.districtCode
                              ? "Chọn Quận/Huyện trước"
                              : wards.length === 0
                              ? "Đang tải..."
                              : "Chọn Phường/Xã"}
                          </option>
                          {wards.map((ward) => (
                            <option key={ward.code} value={ward.code}>
                              {ward.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.wardCode && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.wardCode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                      placeholder="Ghi chú cho người giao hàng (tùy chọn)"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  <label
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === "cod"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                      <p className="text-sm text-gray-600">
                        Thanh toán bằng tiền mặt khi nhận được hàng
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === "stripe"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={formData.paymentMethod === "stripe"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                    />
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Thanh toán bằng thẻ (Stripe)
                        </span>
                        <p className="text-sm text-gray-600">
                          Thanh toán an toàn bằng thẻ tín dụng/ghi nợ
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Stripe Payment Form */}
                {formData.paymentMethod === "stripe" && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {isLoadingPaymentIntent ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                        <span className="ml-3 text-gray-600">
                          Đang khởi tạo thanh toán...
                        </span>
                      </div>
                    ) : clientSecret && stripePromise ? (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: "stripe",
                            variables: {
                              colorPrimary: "#ec4899",
                              colorBackground: "#ffffff",
                              colorText: "#111827",
                              colorDanger: "#ef4444",
                              fontFamily: "system-ui, sans-serif",
                              spacingUnit: "4px",
                              borderRadius: "8px",
                            },
                          },
                        }}
                      >
                        <StripePayment
                          amount={finalAmount}
                          currency={
                            process.env.NEXT_PUBLIC_STRIPE_CURRENCY || "vnd"
                          }
                          onSuccess={handleStripePaymentSuccess}
                          onError={handleStripePaymentError}
                          onProcessingStart={handleStripePaymentProcessingStart}
                        />
                      </Elements>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Vui lòng điền đầy đủ thông tin giao hàng để tiếp tục
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                className="bg-white rounded-lg shadow-md p-6 sticky top-20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Đơn hàng
                </h2>

                {/* Order Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedItemsData.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {item.product?.image ? (
                          <Image
                            src={getOptimizedCloudinaryUrl(
                              item.product.image,
                              100,
                              100
                            )}
                            alt={item.product.name || "Product"}
                            width={64}
                            height={64}
                            className="object-contain w-full h-full"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product?.name || "Sản phẩm"}
                        </p>
                        <p className="text-xs text-gray-500">
                          SL: {item.quantity}
                          {item.variantSize && ` • ${item.variantSize}`}
                        </p>
                        <p className="text-sm font-semibold text-pink-600 mt-1">
                          {item.product?.minPrice
                            ? formatPrice(item.product.minPrice * item.quantity)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  {productDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá sản phẩm:</span>
                      <span className="font-medium">
                        -{formatPrice(productDiscount)}
                      </span>
                    </div>
                  )}

                  {shippingDiscount > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Giảm phí vận chuyển:</span>
                      <span className="font-medium">
                        -{formatPrice(shippingDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-medium">
                      {formatPrice(shippingFee)}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      Tổng cộng:
                    </span>
                    <span className="text-lg font-bold text-pink-600">
                      {formatPrice(finalAmount)}
                    </span>
                  </div>
                </div>

                {formData.paymentMethod !== "stripe" && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </form>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"
              >
                <CheckCircle className="h-10 w-10 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Đặt hàng thành công!
              </h2>
              <p className="text-gray-600 mb-4">
                Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận.
              </p>
              {successOrderId && (
                <p className="text-sm text-gray-500 mb-6">
                  Mã đơn hàng:{" "}
                  <span className="font-semibold">{successOrderId}</span>
                </p>
              )}
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                <span>Đang chuyển đến trang đơn hàng...</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
