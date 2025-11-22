"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { Star, TrendingUp } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";

export default function NewProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(18);
  const INITIAL_DISPLAY = 18;
  const LOAD_MORE_COUNT = 6;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Load tất cả sản phẩm mới
        const data = await productService.getNewProducts(100); // Load nhiều để có đủ
        setAllProducts(data);
        // Hiển thị 18 sản phẩm đầu tiên
        setDisplayedProducts(data.slice(0, INITIAL_DISPLAY));
      } catch (error) {
        console.error("Error fetching new products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      const newCount = displayCount + LOAD_MORE_COUNT;
      setDisplayCount(newCount);
      setDisplayedProducts(allProducts.slice(0, newCount));
      setIsLoadingMore(false);
    }, 300);
  };

  const hasMore = allProducts.length > displayCount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Sản phẩm mới</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 
                         animate-shimmer rounded-2xl h-80 bg-[length:200%_100%]"
              ></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (allProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h2
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                           bg-clip-text text-transparent"
              >
                Sản phẩm mới
              </h2>
            </div>
            <p className="text-gray-600 text-sm ml-8">
              Khám phá những sản phẩm mới nhất
            </p>
          </div>
          <Link
            href="/products?category=new_product"
            className="group flex items-center space-x-1 px-4 py-2 text-sm bg-gradient-to-r 
                     from-blue-600 to-purple-600 text-white font-medium rounded-full
                     hover:shadow-md hover:scale-105 transition-all duration-300"
          >
            <span>Xem tất cả</span>
          </Link>
        </div>

        {/* Grid with 6 products per row on desktop, scrollable on mobile */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:overflow-x-visible md:mx-0 md:px-0">
          <div className="flex gap-3 min-w-max md:grid md:grid-cols-6 md:min-w-0 md:gap-3">
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-48 md:w-auto md:flex-shrink"
              >
                <div
                  className="group relative bg-white rounded-lg shadow-md overflow-hidden 
                              hover:shadow-lg transition-all duration-300 h-full flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <Link href={`/product/${product.id}`}>
                      <Image
                        src={getOptimizedCloudinaryUrl(product.image, 300, 300)}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 192px, calc(16.666% - 12px)"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* New Badge */}
                    <div
                      className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 
                                  text-white text-[10px] font-bold px-2 py-1 rounded-full 
                                  shadow-md"
                    >
                      MỚI
                    </div>
                  </div>

                  {/* Product Info */}
                  <Link
                    href={`/product/${product.id}`}
                    className="block p-2 flex-1 flex flex-col"
                  >
                    <h3
                      className="font-semibold text-xs mb-1 line-clamp-2 text-gray-800 
                                 group-hover:text-primary-600 transition-colors leading-tight min-h-[32px]"
                    >
                      {product.name}
                    </h3>

                    {/* Rating */}
                    {product.reviewSummary && (
                      <div className="flex items-center space-x-0.5 mb-1.5">
                        <div className="flex items-center space-x-0">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 ${
                                i <
                                Math.floor(product.reviewSummary!.averageRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 ml-0.5">
                          {product.reviewSummary.averageRating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ({product.reviewSummary.totalReviews})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center space-x-1.5 mb-1.5">
                      {product.minPrice && (
                        <span className="text-sm font-bold text-primary-600">
                          {formatPrice(product.minPrice)}
                        </span>
                      )}
                      {product.maxPrice &&
                        product.maxPrice !== product.minPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(product.maxPrice)}
                          </span>
                        )}
                    </div>

                    {/* Stock Info */}
                    {product.totalStock !== undefined && (
                      <div className="mt-auto flex items-center space-x-1">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.totalStock > 0
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <p
                          className={`text-[10px] ${
                            product.totalStock > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.totalStock > 0
                            ? `Còn ${product.totalStock} sản phẩm`
                            : "Hết hàng"}
                        </p>
                      </div>
                    )}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 
                       text-white font-medium rounded-full hover:shadow-lg 
                       hover:scale-105 transition-all duration-300 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <span>Xem thêm</span>
                  <TrendingUp className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
