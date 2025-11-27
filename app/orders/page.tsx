"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAppSelector } from "@/store/hooks";
import { orderService, OrderData } from "@/services/orderService";
import Image from "next/image";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import {
  Package,
  Calendar,
  ArrowRight,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-pink-100 text-pink-800",
    icon: Clock,
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-100 text-blue-800",
    icon: Loader2,
  },
  shipped: {
    label: "Đang giao hàng",
    color: "bg-yellow-100 text-yellow-800",
    icon: Truck,
  },
  delivered: {
    label: "Đã giao hàng",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

type OrderStatusFilter =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [activeFilter, setActiveFilter] =
    useState<OrderStatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadOrders = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const userOrders = await orderService.getUserOrders(user.id);
        setOrders(userOrders);
        setFilteredOrders(userOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
        toast.error("Không thể tải danh sách đơn hàng!");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, user, router]);

  // Filter orders when activeFilter changes
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter((order) => order.status === activeFilter)
      );
    }
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, [activeFilter, orders]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Calculate order counts for each filter
  const getOrderCount = (status: OrderStatusFilter): number => {
    if (status === "all") return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

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

  const getFilterLabel = (status: OrderStatusFilter): string => {
    const labels: Record<OrderStatusFilter, string> = {
      all: "Tất cả",
      pending: "Chờ xác nhận",
      processing: "Đang xử lý",
      shipped: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
    };
    return labels[status];
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Đơn mua
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi đơn hàng của bạn
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {[
              { key: "all", label: "Tất cả" },
              { key: "pending", label: "Chờ xác nhận" },
              { key: "processing", label: "Đang xử lý" },
              { key: "shipped", label: "Đang giao hàng" },
              { key: "delivered", label: "Đã giao hàng" },
              { key: "cancelled", label: "Đã hủy" },
            ].map((filter) => {
              const count = getOrderCount(filter.key as OrderStatusFilter);
              const isActive = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as OrderStatusFilter)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-pink-50 text-pink-600 border-b-2 border-pink-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {filter.label}
                  {count > 0 && (
                    <span
                      className={`ml-1 ${
                        isActive ? "text-pink-600" : "text-orange-500"
                      }`}
                    >
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            <span className="ml-3 text-gray-600">Đang tải đơn hàng...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            className="bg-white rounded-lg shadow-md p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeFilter === "all"
                ? "Chưa có đơn hàng nào"
                : "Không có đơn hàng nào"}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === "all"
                ? "Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!"
                : `Không có đơn hàng nào ở trạng thái "${getFilterLabel(activeFilter)}"`}
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
            >
              <span>Mua sắm ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedOrders.map((order, index) => {
              const StatusIcon = statusConfig[order.status].icon;
              return (
                <motion.div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {/* Order Header */}
                  <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Package className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Mã đơn hàng:
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {order.id}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Status Badge */}
                        <div
                          className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig[order.status].color}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          <span>{statusConfig[order.status].label}</span>
                        </div>

                        {/* View Detail Button */}
                        <Link
                          href={`/order/${order.id}`}
                          className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-medium text-sm transition-colors"
                        >
                          <span>Chi tiết</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-4 md:p-6">
                    <div className="space-y-3 mb-4">
                      {order.items.slice(0, 3).map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-start space-x-3"
                        >
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            {item.image ? (
                              <Image
                                src={getOptimizedCloudinaryUrl(
                                  item.image,
                                  100,
                                  100
                                )}
                                alt={item.name}
                                width={64}
                                height={64}
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                              {item.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>SL: {item.quantity}</span>
                              {item.variant && (
                                <>
                                  <span>•</span>
                                  <span>Dung tích: {item.variant.size}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatPrice(Number(item.price) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500 mb-4">
                        +{order.items.length - 3} sản phẩm khác
                      </p>
                    )}

                    {/* Order Summary */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Tổng cộng:
                        </span>
                        <span className="text-lg font-bold text-pink-600">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages: (number | string)[] = [];
                    const seenPages = new Set<number>();
                    
                    if (totalPages <= 7) {
                      // Show all pages if 7 or fewer
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Always show first page
                      if (!seenPages.has(1)) {
                        pages.push(1);
                        seenPages.add(1);
                      }
                      
                      // Add ellipsis if current page is far from start
                      if (currentPage > 3) {
                        pages.push("...");
                      }
                      
                      // Show pages around current page
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        if (!seenPages.has(i)) {
                          pages.push(i);
                          seenPages.add(i);
                        }
                      }
                      
                      // Add ellipsis if current page is far from end
                      if (currentPage < totalPages - 2) {
                        pages.push("...");
                      }
                      
                      // Always show last page
                      if (!seenPages.has(totalPages)) {
                        pages.push(totalPages);
                        seenPages.add(totalPages);
                      }
                    }
                    
                    return pages.map((page, index) => {
                      if (page === "...") {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            currentPage === page
                              ? "bg-pink-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}

            {/* Pagination Info */}
            {filteredOrders.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} trong tổng số{" "}
                {filteredOrders.length} đơn hàng
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

