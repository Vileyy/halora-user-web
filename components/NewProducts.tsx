"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { Star, TrendingUp, ChevronRight } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

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
      <section className="py-6 bg-pink-100">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-white">Sản phẩm mới</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 animate-pulse rounded-lg h-64"
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
    <section id="new-products" className="py-4 bg-pink-100">
      <div className="container mx-auto px-4">
        {/* New Products Header Banner */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg p-3 md:p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-yellow-300 fill-yellow-300" />
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Sản phẩm mới
            </h2>
          </div>
          <Link
            href="/products?category=new_product"
            className="bg-white text-pink-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg 
                     text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors
                     flex items-center space-x-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </div>

        {/* Grid with 6 products per row on desktop, scrollable on mobile */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:overflow-x-visible md:mx-0 md:px-0">
          <div className="flex gap-3 min-w-max md:grid md:grid-cols-6 md:min-w-0 md:gap-3">
            {displayedProducts.map((product, index) => (
              <ScrollReveal
                key={product.id}
                direction="up"
                delay={index * 0.1}
                duration={0.5}
                className="flex-shrink-0 w-48 md:w-auto md:flex-shrink"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="group bg-white rounded-lg border border-gray-200 overflow-hidden 
                             hover:shadow-lg transition-all duration-300 block h-full flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <Image
                      src={getOptimizedCloudinaryUrl(product.image, 300, 300)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 160px, calc(16.666% - 12px)"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* New Badge */}
                    <div
                      className="absolute top-2 right-2 bg-gradient-to-r from-pink-600 to-rose-600 
                                  text-white text-[10px] font-bold px-2 py-0.5 rounded-full 
                                  shadow-sm flex items-center space-x-0.5"
                    >
                      <TrendingUp className="w-2 h-2 fill-white" />
                      <span>MỚI</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-2 flex-1 flex flex-col">
                    <h3
                      className="font-semibold text-xs mb-1 line-clamp-2 text-gray-800 
                                 group-hover:text-pink-600 transition-colors leading-tight min-h-[32px]"
                    >
                      {product.name}
                    </h3>

                    {/* Rating */}
                    {product.reviewSummary && (
                      <div className="flex items-center space-x-0.5 mb-1">
                        <div className="flex items-center">
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
                        <span className="text-sm font-bold text-pink-600">
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

                    {/* Discount Badge */}
                    {product.maxPrice &&
                      product.minPrice &&
                      product.maxPrice !== product.minPrice && (
                        <div className="mt-auto">
                          <span
                            className="inline-block bg-pink-100 text-pink-700 text-[10px] 
                                         font-bold px-2 py-0.5 rounded"
                          >
                            Giảm{" "}
                            {Math.round(
                              ((product.maxPrice - product.minPrice) /
                                product.maxPrice) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
          </div>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 
                       text-white font-medium rounded-lg hover:from-pink-700 hover:to-rose-700 
                       transition-all duration-300 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
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
