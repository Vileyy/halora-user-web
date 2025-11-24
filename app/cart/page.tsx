"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import VoucherModal from "@/components/VoucherModal";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  removeFromCart,
  updateQuantity,
  syncCartToDatabase,
  loadCartFromDatabase,
  removeProductVoucher,
  removeShippingVoucher,
  toggleSelectItem,
  selectAllItems,
  deselectAllItems,
} from "@/store/cartSlice";
import { CartItem } from "@/types";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Tag, Truck, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    items,
    totalItems,
    totalAmount,
    selectedItems,
    appliedProductVoucher,
    appliedShippingVoucher,
  } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Load cart from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(loadCartFromDatabase(user.id));
    }
  }, [isAuthenticated, user, dispatch]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleQuantityChange = async (
    itemId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      toast.error("Số lượng phải lớn hơn 0!");
      return;
    }

    dispatch(updateQuantity({ id: itemId, quantity: newQuantity }));

    // Sync to database
    if (isAuthenticated && user) {
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      await dispatch(
        syncCartToDatabase({ userId: user.id, items: updatedItems })
      );
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    dispatch(removeFromCart(itemId));

    // Sync to database
    if (isAuthenticated && user) {
      const updatedItems = items.filter((item) => item.id !== itemId);
      await dispatch(
        syncCartToDatabase({ userId: user.id, items: updatedItems })
      );
    }

    toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
  };

  // Calculate totals for selected items only
  const selectedItemsData = items.filter((item) =>
    selectedItems.includes(item.id)
  );
  const selectedTotalItems = selectedItemsData.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const selectedTotalAmount = selectedItemsData.reduce((sum, item) => {
    const price = item.product?.minPrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const productDiscount = appliedProductVoucher?.discountAmount || 0;
  const shippingDiscount = appliedShippingVoucher?.discountAmount || 0;
  const totalDiscount = productDiscount + shippingDiscount;
  const finalAmount = selectedTotalAmount - totalDiscount;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thanh toán!");
      router.push("/login");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    router.push("/checkout");
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      dispatch(deselectAllItems());
    } else {
      dispatch(selectAllItems());
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vui lòng đăng nhập
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn cần đăng nhập để xem giỏ hàng của mình
            </p>
            <Link
              href="/login"
              className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tiếp tục mua sắm</span>
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Giỏ hàng của bạn
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
            <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-gray-600 mb-6">
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <Link
              href="/"
              className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All */}
              <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedItems.length === items.length && items.length > 0
                      ? "border-pink-600 bg-pink-600"
                      : "border-gray-300 hover:border-pink-400"
                  }`}
                >
                  {selectedItems.length === items.length && items.length > 0 && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Chọn tất cả ({selectedItems.length}/{items.length})
                </span>
              </div>

              {items.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg shadow-md p-4 md:p-5 flex flex-col sm:flex-row gap-4 ${
                      isSelected ? "ring-2 ring-pink-500" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => dispatch(toggleSelectItem(item.id))}
                      className={`self-start sm:self-center w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected
                          ? "border-pink-600 bg-pink-600"
                          : "border-gray-300 hover:border-pink-400"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>

                    {/* Product Image */}
                    <Link
                      href={`/product/${item.productId}`}
                      className="flex-shrink-0 w-full sm:w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                    >
                    {item.product?.image ? (
                      <Image
                        src={getOptimizedCloudinaryUrl(
                          item.product.image,
                          200,
                          200
                        )}
                        alt={item.product.name || "Product"}
                        width={128}
                        height={128}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.productId}`}
                      className="block mb-2"
                    >
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors line-clamp-2">
                        {item.product?.name || "Sản phẩm"}
                      </h3>
                      {item.variantSize && (
                        <p className="text-sm text-gray-500 mt-1">
                          Dung tích: {item.variantSize}
                        </p>
                      )}
                    </Link>

                    <div className="flex items-center justify-between mt-4">
                      {/* Price */}
                      <div>
                        <span className="text-lg md:text-xl font-bold text-pink-600">
                          {item.product?.minPrice
                            ? formatPrice(item.product.minPrice)
                            : "N/A"}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 md:w-9 md:h-9 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-pink-600 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            handleQuantityChange(item.id, val);
                          }}
                          min={1}
                          className="w-16 md:w-20 text-center text-base md:text-lg font-bold text-gray-900 border-2 border-gray-300 rounded-lg py-1.5 md:py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-600 transition-all"
                        />
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 md:w-9 md:h-9 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-pink-600 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Thành tiền:</span>
                      <span className="text-base font-semibold text-gray-900">
                        {item.product?.minPrice
                          ? formatPrice(item.product.minPrice * item.quantity)
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="flex-shrink-0 self-start sm:self-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-5 md:p-6 sticky top-20">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  Tóm tắt đơn hàng
                </h2>

                {/* Voucher Section */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Mã giảm giá
                    </label>
                    <button
                      onClick={() => setIsVoucherModalOpen(true)}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                    >
                      Chọn voucher
                    </button>
                  </div>
                  
                  {(appliedProductVoucher || appliedShippingVoucher) && (
                    <div className="space-y-2">
                      {appliedProductVoucher && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <ShoppingBag className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-xs font-semibold text-green-800">
                                  {appliedProductVoucher.code}
                                </p>
                                <p className="text-xs text-green-700">
                                  Giảm: {formatPrice(productDiscount)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => dispatch(removeProductVoucher())}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              aria-label="Remove voucher"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      {appliedShippingVoucher && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-xs font-semibold text-blue-800">
                                  {appliedShippingVoucher.code}
                                </p>
                                <p className="text-xs text-blue-700">
                                  Giảm: {formatPrice(shippingDiscount)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => dispatch(removeShippingVoucher())}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              aria-label="Remove voucher"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tổng sản phẩm đã chọn:</span>
                    <span className="font-medium">
                      {selectedTotalItems} sản phẩm
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-medium">
                      {formatPrice(selectedTotalAmount)}
                    </span>
                  </div>
                  {productDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá sản phẩm:</span>
                      <span className="font-medium">-{formatPrice(productDiscount)}</span>
                    </div>
                  )}
                  {shippingDiscount > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Giảm phí vận chuyển:</span>
                      <span className="font-medium">-{formatPrice(shippingDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-medium">Tính khi thanh toán</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      Tổng cộng:
                    </span>
                    <span className="text-lg font-bold text-pink-600">
                      {formatPrice(finalAmount > 0 ? finalAmount : 0)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all duration-300 shadow-lg"
                >
                  Thanh toán
                </button>

                <Link
                  href="/"
                  className="block w-full text-center mt-3 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Voucher Modal */}
      <VoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
      />
    </div>
  );
}

