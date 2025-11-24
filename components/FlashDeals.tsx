"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { Star, Zap, ChevronRight } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function FlashDeals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(4 * 60 * 60); // 4 tiếng = 14400 giây

  // Tính thời gian còn lại dựa trên chu kỳ 4 tiếng
  const calculateTimeLeft = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // Tính giờ bắt đầu của chu kỳ hiện tại (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
    const cycleStartHour = Math.floor(currentHour / 4) * 4;
    
    // Tính thời gian đã trôi qua trong chu kỳ hiện tại (tính bằng giây)
    const elapsedSeconds = 
      (currentHour - cycleStartHour) * 3600 + 
      currentMinute * 60 + 
      currentSecond;
    
    // Thời gian còn lại trong chu kỳ hiện tại
    const remainingSeconds = 4 * 60 * 60 - elapsedSeconds;
    
    return remainingSeconds > 0 ? remainingSeconds : 4 * 60 * 60;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getFlashDeals(8);
        setProducts(data);
      } catch (error) {
        console.error("Error fetching flash deals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Khởi tạo thời gian còn lại khi component mount
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, []);

  // Bộ đếm ngược thời gian - chạy liên tục
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Khi hết thời gian, tính lại thời gian còn lại của chu kỳ mới
          return calculateTimeLeft();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <section className="py-6 bg-pink-100">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-white">Flash Deals</h2>
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

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-4 bg-pink-100">
      <div className="container mx-auto px-4">
        {/* Flash Sale Header Banner */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg p-3 md:p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-300 fill-yellow-300" />
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Flash Sale
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg">
              <span className="text-white text-xs md:text-sm font-medium">
                Kết thúc sau:
              </span>
              <span className="text-yellow-300 text-sm md:text-base font-bold font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
            <Link
              href="/products?category=FlashDeals"
              className="bg-white text-pink-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg 
                       text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors
                       flex items-center space-x-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            </Link>
          </div>
        </div>

        {/* Product Grid - Scrollable on mobile */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:overflow-x-visible md:mx-0 md:px-0">
          <div className="flex gap-3 min-w-max md:grid md:grid-cols-6 md:min-w-0 md:gap-3">
            {products.map((product, index) => {
              const discountPercent =
                product.maxPrice &&
                product.minPrice &&
                product.maxPrice !== product.minPrice
                  ? Math.round(
                      ((product.maxPrice - product.minPrice) /
                        product.maxPrice) *
                        100
                    )
                  : 0;

              return (
                <ScrollReveal
                  key={product.id}
                  direction="up"
                  delay={index * 0.1}
                  duration={0.5}
                  className="flex-shrink-0 w-40 md:w-auto md:flex-shrink"
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

                      {/* SALE Badge */}
                      <div
                        className="absolute top-2 right-2 bg-gradient-to-r from-pink-600 to-rose-600 
                                    text-white text-[10px] font-bold px-2 py-0.5 rounded-full 
                                    shadow-sm flex items-center space-x-0.5"
                      >
                        <Zap className="w-2 h-2 fill-white" />
                        <span>SALE</span>
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
                                  Math.floor(
                                    product.reviewSummary!.averageRating
                                  )
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
                      {discountPercent > 0 && (
                        <div className="mt-auto">
                          <span
                            className="inline-block bg-pink-100 text-pink-700 text-[10px] 
                                         font-bold px-2 py-0.5 rounded"
                          >
                            Giảm {discountPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
