"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { productService } from "@/services/productService";
import { brandService } from "@/services/brandService";
import { reviewService } from "@/services/reviewService";
import { categoryService } from "@/services/categoryService";
import { Product, Brand, Review, Category } from "@/types";
import {
  Star,
  ShoppingCart,
  Heart,
  ArrowLeft,
  Check,
  AlertCircle,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  addToCart,
  syncCartToDatabase,
  setSelectedItems,
} from "@/store/cartSlice";
import { CartItem } from "@/types";
import { toast } from "sonner";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";
import { motion } from "framer-motion";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const productId = params.id as string;

  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const { items } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<
    number | null
  >(null);
  const [showOnlyWithComment, setShowOnlyWithComment] = useState(false);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const productData = await productService.getProductById(productId);

        if (!productData) {
          router.push("/");
          return;
        }

        setProduct(productData);

        // Fetch brand information
        if (productData.brandId) {
          const brandData = await brandService.getBrandById(
            productData.brandId
          );
          setBrand(brandData);
        }

        // Fetch category information
        if (productData.category) {
          // Check if category is a special type (new_product, FlashDeals) or a category ID
          if (
            productData.category === "new_product" ||
            productData.category === "FlashDeals"
          ) {
            // It's a special product type, not a category ID
            setCategory({
              id: productData.category,
              title:
                productData.category === "new_product"
                  ? "Sản phẩm mới"
                  : "Flash Deals",
              image: "",
            });
          } else {
            // Try to find in categories collection
            const categories = await categoryService.getAllCategories();
            const categoryData = categories.find(
              (cat) => cat.id === productData.category
            );
            if (categoryData) {
              setCategory(categoryData);
            }
          }
        }

        // Fetch reviews
        setIsLoadingReviews(true);
        try {
          const reviewsData = await reviewService.getReviewsByProductId(
            productId
          );
          console.log("Fetched reviews:", reviewsData);
          console.log("Product ID:", productId);
          setReviews(reviewsData);
        } catch (error) {
          console.error("Error fetching reviews:", error);
          setReviews([]);
        } finally {
          setIsLoadingReviews(false);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddToCart = async () => {
    // Kiểm tra đăng nhập
    if (!isAuthenticated || !user) {
      setShowLoginDialog(true);
      return;
    }

    if (!product || !product.variants[selectedVariant]) return;

    const variant = product.variants[selectedVariant];
    if (variant.stockQty < quantity) {
      toast.error("Số lượng sản phẩm không đủ!");
      return;
    }

    setIsAddingToCart(true);

    try {
      // Tạo unique ID cho cart item (kết hợp productId và variant size)
      const cartItemId = `${product.id}-${variant.size}`;

      const cartItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        userId: user.id,
        quantity: quantity,
        product: {
          ...product,
          minPrice: variant.price,
          maxPrice: variant.price,
        },
        variantSize: variant.size,
        addedAt: Date.now(),
      };

      // Check if item already exists
      const existingItemIndex = items.findIndex(
        (item) =>
          item.productId === cartItem.productId &&
          item.variantSize === cartItem.variantSize
      );

      let updatedItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedItems = items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        );
      } else {
        // Add new item
        updatedItems = [...items, cartItem];
      }

      // Update Redux state
      dispatch(addToCart(cartItem));

      // Sync to database
      await dispatch(
        syncCartToDatabase({ userId: user.id, items: updatedItems })
      );

      setIsAddingToCart(false);
      toast.success("Đã thêm vào giỏ hàng thành công!", {
        description: `${product.name} - ${variant.size}`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      setIsAddingToCart(false);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng!");
    }
  };

  const handleBuyNow = async () => {
    // Kiểm tra đăng nhập
    if (!isAuthenticated || !user) {
      setShowLoginDialog(true);
      return;
    }

    if (!product || !product.variants[selectedVariant]) return;

    const variant = product.variants[selectedVariant];
    if (variant.stockQty < quantity) {
      toast.error("Số lượng sản phẩm không đủ!");
      return;
    }

    setIsAddingToCart(true);

    try {
      // Tạo unique ID cho cart item
      const cartItemId = `${product.id}-${variant.size}`;

      const cartItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        userId: user.id,
        quantity: quantity,
        product: {
          ...product,
          minPrice: variant.price,
          maxPrice: variant.price,
        },
        variantSize: variant.size,
        addedAt: Date.now(),
      };

      // Check if item already exists
      const existingItemIndex = items.findIndex(
        (item) =>
          item.productId === cartItem.productId &&
          item.variantSize === cartItem.variantSize
      );

      let updatedItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedItems = items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        );
      } else {
        // Add new item
        updatedItems = [...items, cartItem];
      }

      // Update Redux state
      dispatch(addToCart(cartItem));

      // Select only this item for checkout
      const itemToSelect =
        existingItemIndex >= 0
          ? updatedItems[existingItemIndex].id
          : cartItemId;
      dispatch(setSelectedItems([itemToSelect]));

      // Sync to database
      await dispatch(
        syncCartToDatabase({ userId: user.id, items: updatedItems })
      );

      setIsAddingToCart(false);

      // Navigate to checkout
      router.push("/checkout");
    } catch (error) {
      console.error("Error in buy now:", error);
      setIsAddingToCart(false);
      toast.error("Có lỗi xảy ra!");
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (!product || !product.variants[selectedVariant]) return;

    const variant = product.variants[selectedVariant];
    const newQuantity = quantity + delta;

    if (newQuantity < 1) return;
    if (newQuantity > variant.stockQty) {
      alert(`Chỉ còn ${variant.stockQty} sản phẩm!`);
      return;
    }

    setQuantity(newQuantity);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-200 animate-pulse rounded-lg h-96"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 animate-pulse rounded h-8"></div>
              <div className="bg-gray-200 animate-pulse rounded h-6"></div>
              <div className="bg-gray-200 animate-pulse rounded h-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const currentVariant = product.variants[selectedVariant];
  const hasDiscount =
    product.maxPrice &&
    product.minPrice &&
    product.maxPrice !== product.minPrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.maxPrice! - product.minPrice!) / product.maxPrice!) * 100
      )
    : 0;

  // Calculate review statistics
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));

  const reviewsWithComment = reviews.filter(
    (r) => r.comment && r.comment.trim() !== ""
  ).length;
  const reviewsWithImages = reviews.filter(
    (r) => r.images && r.images.length > 0
  ).length;

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (
      selectedRatingFilter !== null &&
      review.rating !== selectedRatingFilter
    ) {
      return false;
    }
    if (
      showOnlyWithComment &&
      (!review.comment || review.comment.trim() === "")
    ) {
      return false;
    }
    if (showOnlyWithImages && (!review.images || review.images.length === 0)) {
      return false;
    }
    return true;
  });

  // Animation variants
  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        duration: 0.5,
      },
    },
  };

  const reviewItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        delay: i * 0.05,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-pink-600 mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 bg-white rounded-lg shadow-md p-4 md:p-5">
          {/* Product Image */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: 0.1,
            }}
          >
            <motion.div
              className="relative"
              variants={imageVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                <Image
                  src={getOptimizedCloudinaryUrl(product.image, 600, 600)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-2 md:p-3"
                  priority
                />
              </div>

              {/* Discount Badge */}
              {hasDiscount && (
                <motion.div
                  className="absolute top-2 left-2 md:top-3 md:left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs md:text-sm font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring" as const,
                    stiffness: 200,
                    damping: 15,
                    delay: 0.4,
                  }}
                >
                  Giảm {discountPercent}%
                </motion.div>
              )}
            </motion.div>

            {/* Description - Moved to left side */}
            {product.description && (
              <motion.div
                className="bg-white rounded-lg border border-gray-200 p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: 0.12,
                }}
              >
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
                  Mô tả sản phẩm:
                </h3>
                <div className="relative">
                  <div
                    className={`text-xs md:text-sm text-gray-600 leading-relaxed whitespace-pre-line overflow-hidden transition-all ${
                      !isDescriptionExpanded ? "line-clamp-6" : ""
                    }`}
                  >
                    {product.description}
                  </div>
                  {/* Check if description needs expand button */}
                  {(() => {
                    const estimatedLines = Math.ceil(
                      product.description.length / 50
                    );
                    const hasNewlines =
                      product.description.split("\n").length > 6;
                    const needsExpand = estimatedLines > 6 || hasNewlines;

                    return needsExpand ? (
                      <button
                        onClick={() =>
                          setIsDescriptionExpanded(!isDescriptionExpanded)
                        }
                        className="mt-3 flex items-center space-x-1 text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors"
                      >
                        <span>
                          {isDescriptionExpanded ? "Thu gọn" : "Hiển thị thêm"}
                        </span>
                        {isDescriptionExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    ) : null;
                  })()}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            className="space-y-3 md:space-y-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: 0.15,
            }}
          >
            {/* Brand */}
            {brand && (
              <div className="flex items-center space-x-2">
                {brand.logoUrl && (
                  <Image
                    src={getOptimizedCloudinaryUrl(brand.logoUrl, 32, 32)}
                    alt={brand.name}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                )}
                <span className="text-xs md:text-sm text-gray-600">
                  {brand.name}
                </span>
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviewSummary && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.reviewSummary!.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm md:text-base font-semibold text-gray-700">
                  {product.reviewSummary.averageRating.toFixed(1)}
                </span>
                <span className="text-xs md:text-sm text-gray-500">
                  ({product.reviewSummary.totalReviews} đánh giá)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {currentVariant && (
                  <span className="text-xl md:text-2xl font-bold text-pink-600">
                    {formatPrice(currentVariant.price)}
                  </span>
                )}
                {hasDiscount &&
                  currentVariant &&
                  currentVariant.price < product.maxPrice! && (
                    <span className="text-base md:text-lg text-gray-400 line-through">
                      {formatPrice(product.maxPrice!)}
                    </span>
                  )}
              </div>
              {hasDiscount && (
                <p className="text-xs md:text-sm text-green-600 font-medium">
                  Tiết kiệm {formatPrice(product.maxPrice! - product.minPrice!)}
                </p>
              )}
            </div>

            {/* Variants (Size) - New Layout */}
            {product.variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                  Dung tích:
                </h3>
                <div
                  className={`grid gap-3 ${
                    product.variants.length === 1
                      ? "grid-cols-1 max-w-xs"
                      : "grid-cols-2 md:grid-cols-3"
                  }`}
                >
                  {product.variants.map((variant, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setSelectedVariant(index);
                        setQuantity(1);
                      }}
                      disabled={variant.stockQty === 0}
                      className={`relative flex items-center space-x-2 p-3 rounded-lg border-2 text-left transition-all ${
                        selectedVariant === index
                          ? "shadow-sm"
                          : "border-gray-300 text-gray-700 bg-white"
                      } ${
                        variant.stockQty === 0
                          ? "opacity-50 cursor-not-allowed"
                          : selectedVariant === index
                          ? ""
                          : "hover:bg-gray-50"
                      }`}
                      style={
                        selectedVariant === index
                          ? {
                              borderColor: "#FF9999",
                              backgroundColor: "#FFF5F5",
                              color: "#FF9999",
                            }
                          : {}
                      }
                      whileHover={
                        variant.stockQty > 0 && selectedVariant !== index
                          ? { scale: 1.02, borderColor: "#FF9999" }
                          : {}
                      }
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                      animate={
                        selectedVariant === index
                          ? { scale: 1.02 }
                          : { scale: 1 }
                      }
                      onMouseEnter={(e) => {
                        if (selectedVariant !== index && variant.stockQty > 0) {
                          e.currentTarget.style.borderColor = "#FF9999";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedVariant !== index) {
                          e.currentTarget.style.borderColor = "";
                        }
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={getOptimizedCloudinaryUrl(
                            product.image,
                            100,
                            100
                          )}
                          alt={`${product.name} - ${variant.size}`}
                          width={56}
                          height={56}
                          className="object-contain w-full h-full"
                        />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium"
                          style={
                            selectedVariant === index
                              ? { color: "#FF9999" }
                              : { color: "#111827" }
                          }
                        >
                          {variant.size}
                          {variant.size &&
                          !variant.size.includes("ml") &&
                          !variant.size.includes("g") &&
                          !variant.size.includes("kg")
                            ? "ml"
                            : ""}
                        </div>
                      </div>

                      {/* Checkmark for selected */}
                      {selectedVariant === index && (
                        <motion.div
                          className="absolute bottom-1 right-1"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                        >
                          <Check
                            className="w-4 h-4"
                            style={{ color: "#FF9999" }}
                          />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Info */}
            {currentVariant && (
              <div className="flex items-center space-x-1.5">
                {currentVariant.stockQty > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-xs md:text-sm text-green-600 font-medium">
                      Còn {currentVariant.stockQty} sản phẩm
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs md:text-sm text-red-600 font-medium">
                      Hết hàng
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {currentVariant && currentVariant.stockQty > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                  Số lượng:
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-lg border-2 border-gray-700 text-gray-900 hover:border-pink-600 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors text-sm md:text-base font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (val >= 1 && val <= currentVariant.stockQty) {
                        setQuantity(val);
                      }
                    }}
                    min={1}
                    max={currentVariant.stockQty}
                    className="w-16 md:w-20 text-center text-base md:text-lg font-bold text-gray-900 border-2 border-gray-700 rounded-lg py-1.5 md:py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-600 transition-all bg-white flex items-center justify-center"
                    style={{ textAlign: "center" }}
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-lg border-2 border-gray-700 text-gray-900 hover:border-pink-600 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors text-sm md:text-base font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={
                  !currentVariant ||
                  currentVariant.stockQty === 0 ||
                  isAddingToCart
                }
                className="flex-1 flex items-center justify-center space-x-2 border-2 bg-white text-sm md:text-base font-semibold py-3 md:py-3.5 px-4 md:px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: "#FF9999",
                  color: "#FF9999",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#FFF5F5";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                <span>
                  {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                </span>
              </motion.button>
              <motion.button
                onClick={handleBuyNow}
                disabled={
                  !currentVariant ||
                  currentVariant.stockQty === 0 ||
                  isAddingToCart
                }
                className="flex-1 flex items-center justify-center space-x-2 text-white text-sm md:text-base font-semibold py-3 md:py-3.5 px-4 md:px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                style={{
                  background: "linear-gradient(to right, #FF9999, #FF6666)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #FF8888, #FF5555)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(to right, #FF9999, #FF6666)";
                }}
              >
                <span>Mua Ngay</span>
              </motion.button>
              <motion.button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`px-4 md:px-6 py-3 md:py-3.5 rounded-lg border-2 transition-all ${
                  isFavorite
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-300 hover:border-red-400 text-gray-700"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  animate={{ scale: isFavorite ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={`w-4 h-4 md:w-5 md:h-5 ${
                      isFavorite ? "fill-red-500" : ""
                    }`}
                  />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Product Details Section */}
        <motion.div
          className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.2,
          }}
        >
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
            CHI TIẾT SẢN PHẨM
          </h2>
          <div className="space-y-3">
            {/* Danh Mục */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Danh Mục:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900">
                {category ? (
                  <span className="text-blue-600 hover:underline">
                    {category.title}
                  </span>
                ) : (
                  <span className="text-gray-500">Đang cập nhật</span>
                )}
              </div>
            </div>

            {/* Kho */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Kho:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900 font-semibold">
                {product.totalStock && product.totalStock > 0 ? (
                  <span className="text-green-600">CÒN HÀNG</span>
                ) : (
                  <span className="text-red-600">HẾT HÀNG</span>
                )}
              </div>
            </div>

            {/* Dung tích */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Dung tích:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900">
                {product.variants && product.variants.length > 0 ? (
                  <span>
                    {product.variants
                      .map((variant) => {
                        // Check if size already contains 'ml' or other unit
                        const size = variant.size || "";
                        return size.includes("ml") ||
                          size.includes("g") ||
                          size.includes("kg")
                          ? size
                          : `${size}ml`;
                      })
                      .join(", ")}
                  </span>
                ) : (
                  <span className="text-gray-500">Đang cập nhật</span>
                )}
              </div>
            </div>

            {/* Thương hiệu */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Thương hiệu:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900">
                {brand ? (
                  brand.name
                ) : (
                  <span className="text-gray-500">Đang cập nhật</span>
                )}
              </div>
            </div>

            {/* Địa chỉ tổ chức chịu trách nhiệm sản xuất */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Địa chỉ tổ chức chịu trách nhiệm sản xuất:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900">
                <span className="text-gray-500">Đang cập nhật</span>
              </div>
            </div>

            {/* Tên tổ chức chịu trách nhiệm sản xuất */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Tên tổ chức chịu trách nhiệm sản xuất:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900">
                {brand ? (
                  <span>{brand.name}</span>
                ) : (
                  <span className="text-gray-500">Đang cập nhật</span>
                )}
              </div>
            </div>

            {/* Hạn bảo hành */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Hạn bảo hành:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900">
                <span className="text-gray-500">Đang cập nhật</span>
              </div>
            </div>

            {/* Gửi từ */}
            <div className="flex items-start">
              <div className="w-1/3 md:w-1/4 text-sm md:text-base font-medium text-gray-700">
                Gửi từ:
              </div>
              <div className="flex-1 text-sm md:text-base text-gray-900">
                <span className="text-gray-500">Đang cập nhật</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.25,
          }}
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            Đánh giá sản phẩm
          </h2>

          {isLoadingReviews ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm md:text-base">
                Đang tải đánh giá...
              </p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm md:text-base">
                Chưa có đánh giá nào cho sản phẩm này
              </p>
            </div>
          ) : (
            <>
              {/* Overall Rating Summary */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">trên 5</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(averageRating)
                            ? "fill-red-500 text-red-500"
                            : i < averageRating
                            ? "fill-red-300 text-red-300"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Rating Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedRatingFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedRatingFilter === null
                        ? "bg-red-500 text-white border-2 border-red-500"
                        : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-red-300"
                    }`}
                  >
                    Tất Cả ({reviews.length})
                  </button>
                  {ratingDistribution.map(({ rating, count }) => (
                    <button
                      key={rating}
                      onClick={() =>
                        setSelectedRatingFilter(
                          selectedRatingFilter === rating ? null : rating
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedRatingFilter === rating
                          ? "bg-red-500 text-white border-2 border-red-500"
                          : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-red-300"
                      }`}
                    >
                      {rating} Sao ({count})
                    </button>
                  ))}
                </div>

                {/* Additional Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowOnlyWithComment(!showOnlyWithComment)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      showOnlyWithComment
                        ? "bg-red-500 text-white border-2 border-red-500"
                        : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-red-300"
                    }`}
                  >
                    Có Bình Luận ({reviewsWithComment})
                  </button>
                  <button
                    onClick={() => setShowOnlyWithImages(!showOnlyWithImages)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      showOnlyWithImages
                        ? "bg-red-500 text-white border-2 border-red-500"
                        : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-red-300"
                    }`}
                  >
                    Có Hình Ảnh / Video ({reviewsWithImages})
                  </button>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm md:text-base">
                      Không có đánh giá nào phù hợp với bộ lọc
                    </p>
                  </div>
                ) : (
                  filteredReviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                      variants={reviewItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                    >
                      <div className="flex items-start space-x-3">
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                          {review.userAvatar ? (
                            <Image
                              src={getOptimizedCloudinaryUrl(
                                review.userAvatar,
                                40,
                                40
                              )}
                              alt={review.userName}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                              <span className="text-pink-600 font-semibold text-sm">
                                {review.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-sm md:text-base text-gray-900">
                              {review.userName}
                            </span>
                            <div className="flex items-center space-x-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "fill-red-500 text-red-500"
                                      : "fill-gray-200 text-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                "vi-VN",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                }
                              )}{" "}
                              {new Date(review.createdAt).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                          {review.comment && (
                            <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-2 mb-3">
                              {review.comment}
                            </p>
                          )}

                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 mb-3">
                              {review.images.map((image, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                  <Image
                                    src={getOptimizedCloudinaryUrl(
                                      image,
                                      100,
                                      100
                                    )}
                                    alt={`Review image ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Like Button */}
                          <div className="flex items-center space-x-1 mt-3">
                            <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-xs">Hữu ích</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </motion.div>
      </main>
      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        redirectUrl={pathname}
      />
    </div>
  );
}
