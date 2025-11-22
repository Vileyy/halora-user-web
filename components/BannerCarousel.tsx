"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Banner } from "@/types";
import { bannerService } from "@/services/bannerService";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState<"left" | "right">("right");

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerService.getActiveBanners();
        setBanners(data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setDirection("right");
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? "right" : "left");
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div
        className="w-full aspect-[16/6] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 
                      rounded-lg overflow-hidden relative animate-shimmer 
                      bg-[length:200%_100%]"
      ></div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full aspect-[16/6] overflow-hidden rounded-lg mb-4 group 
                    shadow-lg"
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentIndex
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          <div className="relative w-full h-full bg-gray-100">
            <Image
              src={getOptimizedCloudinaryUrl(banner.imageUrl, 1920, 720)}
              alt={banner.title}
              fill
              sizes="100vw"
              className="object-contain"
              priority={index === 0}
            />
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
          </div>
          {banner.title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <div className="text-left">
                <h2 className="text-white text-lg md:text-2xl lg:text-3xl font-bold mb-1 drop-shadow-2xl">
                  {banner.title}
                </h2>
                {banner.description && (
                  <p className="text-white/90 text-sm md:text-base max-w-2xl drop-shadow-lg">
                    {banner.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 
                     bg-white/90 hover:bg-white rounded-full p-2 md:p-3 
                     transition-all duration-300 opacity-0 group-hover:opacity-100
                     hover:scale-110 shadow-lg backdrop-blur-sm z-10"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 
                     bg-white/90 hover:bg-white rounded-full p-2 md:p-3 
                     transition-all duration-300 opacity-0 group-hover:opacity-100
                     hover:scale-110 shadow-lg backdrop-blur-sm z-10"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 md:bottom-4 right-4 flex space-x-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 backdrop-blur-sm ${
                index === currentIndex
                  ? "bg-white w-8 h-2 shadow-lg"
                  : "bg-white/60 hover:bg-white/80 w-2 h-2"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
