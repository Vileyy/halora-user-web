"use client";

import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  applyProductVoucher,
  applyShippingVoucher,
  removeProductVoucher,
  removeShippingVoucher,
} from "@/store/cartSlice";
import { voucherService, Voucher } from "@/services/voucherService";
import { X, Tag, Truck, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherModal({ isOpen, onClose }: VoucherModalProps) {
  const dispatch = useAppDispatch();
  const { totalAmount, appliedProductVoucher, appliedShippingVoucher } =
    useAppSelector((state) => state.cart);

  const [productVouchers, setProductVouchers] = useState<Voucher[]>([]);
  const [shippingVouchers, setShippingVouchers] = useState<Voucher[]>([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVouchers();
    }
  }, [isOpen]);

  const loadVouchers = async () => {
    setIsLoading(true);
    try {
      const allVouchers = await voucherService.getAllActiveVouchers();

      const product = allVouchers
        .filter((v) => v.type === "product")
        .sort((a, b) => b.discountValue - a.discountValue);

      const shipping = allVouchers
        .filter((v) => v.type === "shipping")
        .sort((a, b) => b.discountValue - a.discountValue);

      setProductVouchers(product);
      setShippingVouchers(shipping);
    } catch (error) {
      console.error("Error loading vouchers:", error);
      toast.error("Có lỗi xảy ra khi tải voucher!");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateUsagePercentage = (voucher: Voucher) => {
    if (!voucher.usageLimit) return 0;
    return Math.round((voucher.usageCount / voucher.usageLimit) * 100);
  };

  const handleApplyCode = async () => {
    if (!voucherCode.trim()) {
      toast.error("Vui lòng nhập mã voucher!");
      return;
    }

    setIsApplyingCode(true);
    try {
      const voucher = await voucherService.getVoucherByCode(voucherCode.trim());
      const validation = voucherService.validateVoucher(voucher, totalAmount);

      if (!validation.valid) {
        toast.error(validation.message);
        setIsApplyingCode(false);
        return;
      }

      if (voucher!.type === "product") {
        const discount = voucherService.calculateProductDiscount(
          voucher,
          totalAmount
        );
        dispatch(
          applyProductVoucher({ code: voucher!.code, discountAmount: discount })
        );
      } else {
        const discount = voucherService.calculateShippingDiscount(voucher!);
        dispatch(
          applyShippingVoucher({
            code: voucher!.code,
            discountAmount: discount,
          })
        );
      }

      toast.success("Áp dụng voucher thành công!");
      setVoucherCode("");
    } catch (error) {
      console.error("Error applying voucher:", error);
      toast.error("Có lỗi xảy ra khi áp dụng voucher!");
    } finally {
      setIsApplyingCode(false);
    }
  };

  const handleSelectProductVoucher = (voucher: Voucher) => {
    const validation = voucherService.validateVoucher(voucher, totalAmount);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    const discount = voucherService.calculateProductDiscount(
      voucher,
      totalAmount
    );
    dispatch(
      applyProductVoucher({ code: voucher.code, discountAmount: discount })
    );
  };

  const handleSelectShippingVoucher = (voucher: Voucher) => {
    const validation = voucherService.validateVoucher(voucher, totalAmount);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    const discount = voucherService.calculateShippingDiscount(voucher);
    dispatch(
      applyShippingVoucher({ code: voucher.code, discountAmount: discount })
    );
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const voucherItemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        delay: i * 0.05,
      },
    }),
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.98,
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col m-4 z-10"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.div
              className="flex items-center justify-between p-4 border-b border-gray-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-gray-900">Chọn Voucher</h2>
              <motion.button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </motion.div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Input Code Section */}
              <div className="mb-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã Voucher
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã voucher"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleApplyCode();
                        }
                      }}
                    />
                    <motion.button
                      onClick={handleApplyCode}
                      disabled={isApplyingCode || !voucherCode.trim()}
                      className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {isApplyingCode ? "..." : "ÁP DỤNG"}
                    </motion.button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Đang tải voucher...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Product Vouchers */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <ShoppingBag className="w-5 h-5 text-pink-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Mã Giảm Giá Sản Phẩm
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Có thể chọn 1 Voucher
                    </p>
                    {productVouchers.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500">
                          Không có voucher nào khả dụng
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {productVouchers.map((voucher, index) => {
                          const isSelected =
                            appliedProductVoucher?.code === voucher.code;
                          const usagePercent =
                            calculateUsagePercentage(voucher);

                          return (
                            <motion.div
                              key={voucher.id}
                              className={`border-2 rounded-lg p-4 transition-all ${
                                isSelected
                                  ? "border-pink-500 bg-pink-50"
                                  : "border-gray-200 hover:border-pink-300"
                              }`}
                              variants={voucherItemVariants}
                              initial="hidden"
                              animate="visible"
                              custom={index}
                              whileHover={{
                                scale: 1.02,
                                transition: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 20,
                                },
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Tag className="w-5 h-5 text-pink-600" />
                                    <h4 className="font-bold text-gray-900">
                                      {voucher.code}
                                    </h4>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">
                                    {voucher.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-2">
                                    <span>
                                      Giảm tối đa:{" "}
                                      {voucher.discountType === "percentage"
                                        ? `${voucher.discountValue}%`
                                        : formatPrice(voucher.discountValue)}
                                    </span>
                                    <span>
                                      Đơn tối thiểu:{" "}
                                      {formatPrice(voucher.minOrder)}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">
                                        HSD: {formatDate(voucher.endDate)}
                                      </span>
                                      {voucher.usageLimit && (
                                        <span className="text-gray-500 font-medium">
                                          Đã dùng {usagePercent}%
                                        </span>
                                      )}
                                    </div>
                                    {voucher.usageLimit && (
                                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                          className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${usagePercent}%`,
                                          }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 20,
                                            delay: index * 0.05 + 0.3,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  {totalAmount < voucher.minOrder && (
                                    <p className="text-xs text-orange-600 mt-2">
                                      ⚠️ Đơn hàng tối thiểu{" "}
                                      {formatPrice(voucher.minOrder)} để áp dụng
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <motion.button
                                    onClick={() => {
                                      if (isSelected) {
                                        dispatch(removeProductVoucher());
                                      } else {
                                        handleSelectProductVoucher(voucher);
                                      }
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? "border-pink-600 bg-pink-600"
                                        : "border-gray-300 hover:border-pink-400"
                                    }`}
                                    aria-label={
                                      isSelected ? "Bỏ chọn" : "Chọn voucher"
                                    }
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 10,
                                    }}
                                  >
                                    <AnimatePresence>
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          exit={{ scale: 0, rotate: 180 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15,
                                          }}
                                        >
                                          <Check className="w-4 h-4 text-white" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Shipping Vouchers */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Mã Miễn Phí Vận Chuyển
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Có thể chọn 1 Voucher
                    </p>
                    {shippingVouchers.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500">
                          Không có voucher nào khả dụng
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {shippingVouchers.map((voucher, index) => {
                          const isSelected =
                            appliedShippingVoucher?.code === voucher.code;
                          const usagePercent =
                            calculateUsagePercentage(voucher);

                          return (
                            <motion.div
                              key={voucher.id}
                              className={`border-2 rounded-lg p-4 transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                              variants={voucherItemVariants}
                              initial="hidden"
                              animate="visible"
                              custom={index + productVouchers.length}
                              whileHover={{
                                scale: 1.02,
                                transition: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 20,
                                },
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Tag className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-bold text-gray-900">
                                      {voucher.code}
                                    </h4>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">
                                    {voucher.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-2">
                                    <span>
                                      Giảm:{" "}
                                      {voucher.discountType === "percentage"
                                        ? `${voucher.discountValue}% phí vận chuyển`
                                        : formatPrice(voucher.discountValue)}
                                    </span>
                                    <span>
                                      Đơn tối thiểu:{" "}
                                      {formatPrice(voucher.minOrder)}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">
                                        HSD: {formatDate(voucher.endDate)}
                                      </span>
                                      {voucher.usageLimit && (
                                        <span className="text-gray-500 font-medium">
                                          Đã dùng {usagePercent}%
                                        </span>
                                      )}
                                    </div>
                                    {voucher.usageLimit && (
                                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${usagePercent}%`,
                                          }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 20,
                                            delay:
                                              (index + productVouchers.length) *
                                                0.05 +
                                              0.3,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  {totalAmount < voucher.minOrder && (
                                    <p className="text-xs text-orange-600 mt-2">
                                      ⚠️ Đơn hàng tối thiểu{" "}
                                      {formatPrice(voucher.minOrder)} để áp dụng
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <motion.button
                                    onClick={() => {
                                      if (isSelected) {
                                        dispatch(removeShippingVoucher());
                                      } else {
                                        handleSelectShippingVoucher(voucher);
                                      }
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? "border-blue-600 bg-blue-600"
                                        : "border-gray-300 hover:border-blue-400"
                                    }`}
                                    aria-label={
                                      isSelected ? "Bỏ chọn" : "Chọn voucher"
                                    }
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 10,
                                    }}
                                  >
                                    <AnimatePresence>
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          exit={{ scale: 0, rotate: 180 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15,
                                          }}
                                        >
                                          <Check className="w-4 h-4 text-white" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <motion.div
              className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                onClick={onClose}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                TRỞ LẠI
              </motion.button>
              <motion.button
                onClick={onClose}
                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
