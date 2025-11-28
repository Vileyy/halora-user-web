"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { productService } from "@/services/productService";
import { Product } from "@/types";
import { Search, Star } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";
import { motion } from "framer-motion";

function SearchContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get query from URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);
    if (query) {
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await productService.searchProducts(query, 50);
      setProducts(results);
    } catch (error) {
      console.error("Error searching products:", error);
      setProducts([]);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Search Results */}
        {searchQuery && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoading
                  ? "Đang tìm kiếm..."
                  : products.length > 0
                  ? `Tìm thấy ${products.length} sản phẩm cho "${searchQuery}"`
                  : `Không tìm thấy sản phẩm nào cho "${searchQuery}"`}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/product/${product.id}`}
                      className="group bg-white rounded-lg border border-gray-200 overflow-hidden 
                               hover:shadow-lg transition-all duration-300 block h-full flex flex-col"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <Image
                          src={getOptimizedCloudinaryUrl(
                            product.image,
                            300,
                            300
                          )}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16.666vw"
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                          {product.name}
                        </h3>

                        {/* Rating */}
                        {product.reviewSummary &&
                          product.reviewSummary.averageRating > 0 && (
                            <div className="flex items-center space-x-1 mb-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => {
                                  const rating =
                                    product.reviewSummary!.averageRating;
                                  const fillPercentage =
                                    Math.min(Math.max(rating - i, 0), 1) * 100;

                                  return (
                                    <div
                                      key={i}
                                      className="relative w-3.5 h-3.5"
                                    >
                                      {/* Background star (empty) */}
                                      <Star className="w-3.5 h-3.5 fill-gray-200 text-gray-200 absolute" />
                                      {/* Foreground star (filled) with clip */}
                                      <div
                                        className="overflow-hidden absolute"
                                        style={{ width: `${fillPercentage}%` }}
                                      >
                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="text-xs text-gray-600">
                                {product.reviewSummary.averageRating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({product.reviewSummary.totalReviews})
                              </span>
                            </div>
                          )}

                        {/* Price */}
                        <div className="mt-auto">
                          {product.minPrice && product.maxPrice ? (
                            product.minPrice === product.maxPrice ? (
                              <p className="text-base font-bold text-pink-600">
                                {formatPrice(product.minPrice)}
                              </p>
                            ) : (
                              <p className="text-base font-bold text-pink-600">
                                {formatPrice(product.minPrice)} -{" "}
                                {formatPrice(product.maxPrice)}
                              </p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500">Liên hệ</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">
                  Không tìm thấy sản phẩm nào
                </p>
                <p className="text-gray-500 text-sm">
                  Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              Tìm kiếm sản phẩm của bạn
            </p>
            <p className="text-gray-500 text-sm">
              Nhập từ khóa vào ô tìm kiếm để bắt đầu
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
