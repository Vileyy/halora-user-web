"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAppSelector } from "@/store/hooks";
import { orderService, OrderData } from "@/services/orderService";
import { reviewService } from "@/services/reviewService";
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
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

const StarRating = ({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (val: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSize =
    size === "sm" ? "w-5 h-5" : size === "md" ? "w-8 h-8" : "w-10 h-10";

  const ratingLabels: Record<number, string> = {
    1: "Rất tệ",
    2: "Không hài lòng",
    3: "Bình thường",
    4: "Hài lòng",
    5: "Tuyệt vời",
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoverValue || value);
          return (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              className="focus:outline-none relative p-0.5"
            >
              <Star
                className={`${starSize} ${
                  isActive
                    ? "text-yellow-400 fill-yellow-400 drop-shadow-sm"
                    : "text-gray-200 fill-gray-100"
                } transition-colors duration-200`}
                strokeWidth={isActive ? 0 : 1.5}
              />
            </motion.button>
          );
        })}
        <div className="ml-3 min-w-[120px] h-6 flex items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={hoverValue || value}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className={`text-sm font-medium ${
                (hoverValue || value) >= 4
                  ? "text-green-600"
                  : (hoverValue || value) === 3
                  ? "text-yellow-600"
                  : "text-red-500"
              }`}
            >
              {ratingLabels[hoverValue || value]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [activeFilter, setActiveFilter] = useState<OrderStatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState<OrderData | null>(null);
  const [productRatings, setProductRatings] = useState<Record<string, number>>(
    {}
  );
  const [shippingRating, setShippingRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, number>>(
    {}
  );
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderData | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

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

  useEffect(() => {
    if (!user) return;

    const loadReviewStatus = async () => {
      try {
        const status = await reviewService.getUserOrderReviewStatus(user.id);
        setReviewedOrders(status);
      } catch (error) {
        console.error("Error loading review status:", error);
      }
    };

    loadReviewStatus();
  }, [user]);

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

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const getItemRatingKey = (
    item: OrderData["items"][number],
    index: number
  ) => {
    const base = item.productId || item.id || `product-${index}`;
    const variantSuffix = item.variant?.size ? `-${item.variant.size}` : "";
    return `${base}${variantSuffix}-${index}`;
  };

  const openReviewDialog = (order: OrderData) => {
    const defaultRatings: Record<string, number> = {};
    order.items.forEach((item, index) => {
      const key = getItemRatingKey(item, index);
      defaultRatings[key] = 5;
    });
    setProductRatings(defaultRatings);
    setShippingRating(5);
    setReviewComment("");
    setOrderToReview(order);
    setIsReviewDialogOpen(true);
  };

  const handleRatingChange = (key: string, value: number) => {
    setProductRatings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const closeReviewDialog = () => {
    setIsReviewDialogOpen(false);
    setOrderToReview(null);
  };

  const handleSubmitReview = async () => {
    if (!orderToReview || !user) return;

    setIsSubmittingReview(true);
    try {
      const itemsPayload = orderToReview.items
        .map((item, index) => {
          const key = getItemRatingKey(item, index);
          const productId = item.productId || item.id;
          if (!productId) return null;
          return {
            productId,
            productName: item.name,
            productImage: item.image,
            rating: productRatings[key] || 5,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (itemsPayload.length === 0) {
        toast.error("Không có sản phẩm hợp lệ để đánh giá!");
        setIsSubmittingReview(false);
        return;
      }

      await reviewService.submitOrderReviews({
        orderId: orderToReview.id,
        userId: user.id,
        userName: user.name || user.email,
        shippingRating,
        comment: reviewComment.trim(),
        items: itemsPayload,
      });

      toast.success("Cảm ơn bạn đã đánh giá đơn hàng!");
      setReviewedOrders((prev) => ({
        ...prev,
        [orderToReview.id]: itemsPayload.length,
      }));
      closeReviewDialog();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Không thể gửi đánh giá, vui lòng thử lại!");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openCancelDialog = (order: OrderData) => {
    setOrderToCancel(order);
    setIsCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setOrderToCancel(null);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel || !user) return;

    setIsCancellingOrder(true);
    try {
      await orderService.cancelOrder(user.id, orderToCancel.id);
      toast.success("Đơn hàng đã được hủy thành công!");

      // Reload orders
      const userOrders = await orderService.getUserOrders(user.id);
      setOrders(userOrders);
      setFilteredOrders(
        activeFilter === "all"
          ? userOrders
          : userOrders.filter((order) => order.status === activeFilter)
      );

      closeCancelDialog();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể hủy đơn hàng, vui lòng thử lại!"
      );
    } finally {
      setIsCancellingOrder(false);
    }
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
          <p className="text-gray-600">Quản lý và theo dõi đơn hàng của bạn</p>
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
                  onClick={() =>
                    setActiveFilter(filter.key as OrderStatusFilter)
                  }
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
                : `Không có đơn hàng nào ở trạng thái "${getFilterLabel(
                    activeFilter
                  )}"`}
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
                const isOrderReviewed = Boolean(reviewedOrders[order.id]);
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

                        <div className="flex items-center space-x-3">
                          {/* Status Badge */}
                          <div
                            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              statusConfig[order.status].color
                            }`}
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
                                {formatPrice(
                                  Number(item.price) * item.quantity
                                )}
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
                        <div className="mt-3 flex justify-end gap-2">
                          {/* Cancel button for pending and processing orders */}
                          {(order.status === "pending" ||
                            order.status === "processing") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300"
                              onClick={() => openCancelDialog(order)}
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Hủy đơn hàng</span>
                            </Button>
                          )}
                          {/* Review button for delivered orders */}
                          {order.status === "delivered" && (
                            <>
                              {isOrderReviewed ? (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                                  Đã đánh giá
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100"
                                  onClick={() => openReviewDialog(order)}
                                >
                                  <Star
                                    className="w-4 h-4 text-yellow-500"
                                    fill="currentColor"
                                  />
                                  <span className="text-yellow-600">
                                    Đánh giá
                                  </span>
                                </Button>
                              )}
                            </>
                          )}
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
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    scrollToTop();
                  }}
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
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page as number);
                            scrollToTop();
                          }}
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
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    scrollToTop();
                  }}
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
                Hiển thị {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredOrders.length)} trong tổng số{" "}
                {filteredOrders.length} đơn hàng
              </div>
            )}
          </>
        )}
        <Dialog
          open={isReviewDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeReviewDialog();
            }
          }}
        >
          <DialogContent className="max-w-2xl bg-white text-gray-900 border border-pink-100 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Đánh giá đơn hàng
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Hãy chia sẻ cảm nhận của bạn về các sản phẩm trong đơn{" "}
                {orderToReview?.id}
              </DialogDescription>
            </DialogHeader>

            {orderToReview && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {orderToReview.items.map((item, itemIndex) => {
                  const key = getItemRatingKey(item, itemIndex);
                  const ratingValue = productRatings[key] || 5;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: itemIndex * 0.1 }}
                      className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 p-2">
                          {item.image ? (
                            <Image
                              src={getOptimizedCloudinaryUrl(
                                item.image,
                                100,
                                100
                              )}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 mb-3">
                            Phân loại: {item.variant?.size || "Mặc định"} • x
                            {item.quantity}
                          </p>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Chất lượng sản phẩm
                            </span>
                            <StarRating
                              value={ratingValue}
                              onChange={(value) =>
                                handleRatingChange(key, value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Đánh giá giao hàng
                </p>
                <StarRating
                  value={shippingRating}
                  onChange={setShippingRating}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Nhận xét của bạn (không bắt buộc)
                </label>
                <textarea
                  className="w-full border border-pink-100 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white placeholder:text-gray-400"
                  rows={3}
                  placeholder="Chia sẻ về chất lượng sản phẩm hoặc trải nghiệm giao hàng..."
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeReviewDialog}
                disabled={isSubmittingReview}
                className="bg-gray-100 border-gray-200 text-red-600 hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="bg-pink-600 hover:bg-pink-700 text-white transition-all duration-200"
              >
                {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Confirmation Dialog */}
        <Dialog
          open={isCancelDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeCancelDialog();
            }
          }}
        >
          <DialogContent className="max-w-md bg-white text-gray-900 border border-red-100 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                Xác nhận hủy đơn hàng
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Bạn có chắc chắn muốn hủy đơn hàng này không?
              </DialogDescription>
            </DialogHeader>

            {orderToCancel && (
              <div className="space-y-3 py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {orderToCancel.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tổng tiền:</span>
                    <span className="text-sm font-semibold text-pink-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(orderToCancel.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trạng thái:</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        statusConfig[orderToCancel.status].color
                      }`}
                    >
                      {statusConfig[orderToCancel.status].label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  ⚠️ Lưu ý: Sau khi hủy, bạn sẽ không thể khôi phục đơn hàng
                  này.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeCancelDialog}
                disabled={isCancellingOrder}
                className="bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                Không, giữ đơn hàng
              </Button>
              <Button
                onClick={handleCancelOrder}
                disabled={isCancellingOrder}
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
              >
                {isCancellingOrder ? "Đang hủy..." : "Có, hủy đơn hàng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
