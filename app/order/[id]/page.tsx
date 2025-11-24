"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAppSelector } from "@/store/hooks";
import { orderService, OrderData } from "@/services/orderService";
import Image from "next/image";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { addressService } from "@/services/addressService";

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-pink-100 text-pink-800",
    icon: Clock,
    description: "Đơn hàng đang chờ được xác nhận",
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-100 text-blue-800",
    icon: Loader2,
    description: "Đơn hàng đang được xử lý",
  },
  shipped: {
    label: "Đang giao hàng",
    color: "bg-yellow-100 text-yellow-800",
    icon: Truck,
    description: "Đơn hàng đang được vận chuyển",
  },
  delivered: {
    label: "Đã giao hàng",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Đơn hàng đã được giao thành công",
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description: "Đơn hàng đã bị hủy",
  },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addressParts, setAddressParts] = useState<{
    ward?: string;
    district?: string;
    province?: string;
  }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadOrder = async () => {
      if (!user || !orderId) return;

      setIsLoading(true);
      try {
        const orderData = await orderService.getOrderById(user.id, orderId);
        if (!orderData) {
          toast.error("Không tìm thấy đơn hàng!");
          router.push("/orders");
          return;
        }
        setOrder(orderData);

        // If address has codes instead of names, fetch the names
        if (orderData.shippingAddress) {
          const addr = orderData.shippingAddress;
          const parts: { ward?: string; district?: string; province?: string } = {};

          // Parse address if it contains codes in format "address, wardCode, districtCode, provinceCode"
          let wardCode = addr.ward;
          let districtCode = addr.district;
          let provinceCode = addr.province;

          // Debug: log current address data
          console.log("Address data:", {
            address: addr.address,
            ward: addr.ward,
            district: addr.district,
            province: addr.province,
          });

          // If address field contains codes (format: "address, code1, code2, code3")
          if (addr.address && addr.address.includes(",")) {
            const addressParts = addr.address.split(",").map((p) => p.trim());
            // Last 3 parts might be codes
            if (addressParts.length >= 4) {
              const lastThree = addressParts.slice(-3);
              // Check if they are numeric codes
              if (lastThree.every((p) => /^\d+$/.test(p))) {
                wardCode = lastThree[0];
                districtCode = lastThree[1];
                provinceCode = lastThree[2];
                // Update address to remove codes
                addr.address = addressParts.slice(0, -3).join(", ");
                console.log("Parsed codes:", { wardCode, districtCode, provinceCode });
              }
            }
          }

          // If ward, district, province are not set but address has codes, try to extract
          if (!wardCode && !districtCode && !provinceCode && addr.address) {
            const addressParts = addr.address.split(",").map((p) => p.trim());
            if (addressParts.length >= 4) {
              const lastThree = addressParts.slice(-3);
              if (lastThree.every((p) => /^\d+$/.test(p))) {
                wardCode = lastThree[0];
                districtCode = lastThree[1];
                provinceCode = lastThree[2];
                addr.address = addressParts.slice(0, -3).join(", ");
                console.log("Extracted codes from address:", { wardCode, districtCode, provinceCode });
              }
            }
          }

          // Fetch province name (provinceCode is the last number: 79)
          if (provinceCode) {
            const provinceCodeStr = String(provinceCode).trim();
            if (/^\d+$/.test(provinceCodeStr)) {
              try {
                const provinces = await addressService.getProvinces();
                const province = provinces.find((p) => String(p.code) === provinceCodeStr);
                if (province) {
                  parts.province = province.name;
                  console.log(`Found province: ${province.name} for code ${provinceCodeStr}`);
                } else {
                  parts.province = `Tỉnh/Thành phố (${provinceCodeStr})`;
                  console.warn(`Province not found for code: ${provinceCodeStr}`);
                }
              } catch (error) {
                console.error("Error fetching province name:", error);
                parts.province = `Tỉnh/Thành phố (${provinceCodeStr})`;
              }
            } else {
              parts.province = String(provinceCode);
            }
          }

          // Fetch district name (districtCode is the second last number: 777)
          if (districtCode && provinceCode) {
            const districtCodeStr = String(districtCode).trim();
            const provinceCodeStr = String(provinceCode).trim();
            if (/^\d+$/.test(districtCodeStr)) {
              try {
                const districts = await addressService.getDistricts(provinceCodeStr);
                const district = districts.find((d) => String(d.code) === districtCodeStr);
                if (district) {
                  parts.district = district.name;
                  console.log(`Found district: ${district.name} for code ${districtCodeStr}`);
                } else {
                  parts.district = `Quận/Huyện (${districtCodeStr})`;
                  console.warn(`District not found for code: ${districtCodeStr}`);
                }
              } catch (error) {
                console.error("Error fetching district name:", error);
                parts.district = `Quận/Huyện (${districtCodeStr})`;
              }
            } else {
              parts.district = String(districtCode);
            }
          }

          // Fetch ward name (wardCode is the first number: 27451)
          if (wardCode && districtCode) {
            const wardCodeStr = String(wardCode).trim();
            const districtCodeStr = String(districtCode).trim();
            if (/^\d+$/.test(wardCodeStr)) {
              try {
                const wards = await addressService.getWards(districtCodeStr);
                const ward = wards.find((w) => String(w.code) === wardCodeStr);
                if (ward) {
                  parts.ward = ward.name;
                  console.log(`Found ward: ${ward.name} for code ${wardCodeStr}`);
                } else {
                  parts.ward = `Phường/Xã (${wardCodeStr})`;
                  console.warn(`Ward not found for code: ${wardCodeStr}`);
                }
              } catch (error) {
                console.error("Error fetching ward name:", error);
                parts.ward = `Phường/Xã (${wardCodeStr})`;
              }
            } else {
              parts.ward = String(wardCode);
            }
          }

          setAddressParts(parts);
        }
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Không thể tải thông tin đơn hàng!");
        router.push("/orders");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [isAuthenticated, user, orderId, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            <span className="ml-3 text-gray-600">Đang tải thông tin đơn hàng...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn hàng</span>
        </Link>

        {/* Order Header */}
        <motion.div
          className="bg-white rounded-lg shadow-md p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Chi tiết đơn hàng
              </h1>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Package className="w-4 h-4" />
                <span>Mã đơn hàng: {order.id}</span>
              </div>
            </div>
            <div
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${statusConfig[order.status].color}`}
            >
              <StatusIcon className="w-5 h-5" />
              <span>{statusConfig[order.status].label}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {statusConfig[order.status].description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Sản phẩm đã đặt
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  >
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {item.image ? (
                        <Image
                          src={getOptimizedCloudinaryUrl(item.image, 150, 150)}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      {item.category && (
                        <p className="text-xs text-gray-500 mb-1">
                          Danh mục: {item.category}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Số lượng: {item.quantity}</span>
                        {item.variant && (
                          <>
                            <span>•</span>
                            <span>Dung tích: {item.variant.size}</span>
                          </>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-base font-semibold text-gray-900">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(Number(item.price))} / sản phẩm
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-pink-600" />
                  <span>Địa chỉ giao hàng</span>
                </h2>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-start space-x-2">
                    <span className="font-medium min-w-[100px]">Họ tên:</span>
                    <span>{order.shippingAddress.fullName}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-medium min-w-[100px]">SĐT:</span>
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                  {order.shippingAddress.email && (
                    <div className="flex items-start space-x-2">
                      <span className="font-medium min-w-[100px]">Email:</span>
                      <span>{order.shippingAddress.email}</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <span className="font-medium min-w-[100px]">Địa chỉ:</span>
                    <span className="flex-1">
                      {order.shippingAddress.address}
                      {addressParts.ward ? (
                        <span>, {addressParts.ward}</span>
                      ) : order.shippingAddress.ward ? (
                        <span>, {order.shippingAddress.ward}</span>
                      ) : null}
                      {addressParts.district ? (
                        <span>, {addressParts.district}</span>
                      ) : order.shippingAddress.district ? (
                        <span>, {order.shippingAddress.district}</span>
                      ) : null}
                      {addressParts.province ? (
                        <span>, {addressParts.province}</span>
                      ) : order.shippingAddress.province ? (
                        <span>, {order.shippingAddress.province}</span>
                      ) : null}
                    </span>
                  </div>
                  {order.shippingAddress.note && (
                    <div className="flex items-start space-x-2">
                      <span className="font-medium min-w-[100px]">Ghi chú:</span>
                      <span className="text-gray-600">{order.shippingAddress.note}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 sticky top-20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Thông tin đơn hàng
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Ngày đặt: {formatDate(order.createdAt)}</span>
                </div>
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Cập nhật: {formatDate(order.updatedAt)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span>Vận chuyển: {order.shippingMethod || "Standard"}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CreditCard className="w-4 h-4" />
                  <span>
                    Thanh toán:{" "}
                    {order.paymentMethod === "cod"
                      ? "Thanh toán khi nhận hàng"
                      : order.paymentMethod === "stripe"
                      ? "Thẻ tín dụng"
                      : order.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-medium">
                    {formatPrice(order.itemsSubtotal)}
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">
                      -{formatPrice(order.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-medium">
                    {formatPrice(order.shippingCost)}
                  </span>
                </div>

                {order.vouchers && (
                  <div className="pt-2 border-t border-gray-200">
                    {order.vouchers.product && (
                      <div className="text-xs text-gray-500 mb-1">
                        Voucher sản phẩm: {order.vouchers.product.code}
                      </div>
                    )}
                    {order.vouchers.shipping && (
                      <div className="text-xs text-gray-500">
                        Voucher vận chuyển: {order.vouchers.shipping.code}
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    Tổng cộng:
                  </span>
                  <span className="text-lg font-bold text-pink-600">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

