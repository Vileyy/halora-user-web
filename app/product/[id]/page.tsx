"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { productService } from "@/services/productService";
import { brandService } from "@/services/brandService";
import { Product, Brand } from "@/types";
import {
  Star,
  ShoppingCart,
  Heart,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

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
    if (!product || !product.variants[selectedVariant]) return;

    const variant = product.variants[selectedVariant];
    if (variant.stockQty < quantity) {
      alert("Số lượng sản phẩm không đủ!");
      return;
    }

    setIsAddingToCart(true);
    // TODO: Implement add to cart functionality
    setTimeout(() => {
      setIsAddingToCart(false);
      alert("Đã thêm vào giỏ hàng!");
    }, 500);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-lg shadow-md p-6">
          {/* Product Image */}
          <div className="relative">
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
              <Image
                src={getOptimizedCloudinaryUrl(product.image, 800, 800)}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Discount Badge */}
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                Giảm {discountPercent}%
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            {brand && (
              <div className="flex items-center space-x-2">
                {brand.logoUrl && (
                  <Image
                    src={getOptimizedCloudinaryUrl(brand.logoUrl, 40, 40)}
                    alt={brand.name}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                )}
                <span className="text-sm text-gray-600">{brand.name}</span>
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            {product.reviewSummary && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.reviewSummary!.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {product.reviewSummary.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-500">
                  ({product.reviewSummary.totalReviews} đánh giá)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                {currentVariant && (
                  <span className="text-3xl font-bold text-primary-600">
                    {formatPrice(currentVariant.price)}
                  </span>
                )}
                {hasDiscount &&
                  currentVariant &&
                  currentVariant.price < product.maxPrice! && (
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(product.maxPrice!)}
                    </span>
                  )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 font-medium">
                  Tiết kiệm {formatPrice(product.maxPrice! - product.minPrice!)}
                </p>
              )}
            </div>

            {/* Variants (Size) */}
            {product.variants.length > 1 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Kích thước:</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedVariant(index);
                        setQuantity(1);
                      }}
                      disabled={variant.stockQty === 0}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        selectedVariant === index
                          ? "border-primary-600 bg-primary-50 text-primary-600"
                          : "border-gray-300 hover:border-primary-400 text-gray-700"
                      } ${
                        variant.stockQty === 0
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {variant.size}
                      {variant.stockQty === 0 && (
                        <span className="ml-2 text-xs text-red-500">
                          (Hết hàng)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Info */}
            {currentVariant && (
              <div className="flex items-center space-x-2">
                {currentVariant.stockQty > 0 ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">
                      Còn {currentVariant.stockQty} sản phẩm
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600 font-medium">Hết hàng</span>
                  </>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {currentVariant && currentVariant.stockQty > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Số lượng:</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary-600 hover:bg-primary-50 flex items-center justify-center transition-colors"
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
                    className="w-20 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg py-2"
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary-600 hover:bg-primary-50 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={
                  !currentVariant ||
                  currentVariant.stockQty === 0 ||
                  isAddingToCart
                }
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-primary-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>
                  {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                </span>
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`px-6 py-4 rounded-lg border-2 transition-all ${
                  isFavorite
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-300 hover:border-red-400 text-gray-700"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-red-500" : ""}`}
                />
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Mô tả sản phẩm:
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
