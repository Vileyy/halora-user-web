"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Category } from "@/types";
import { categoryService } from "@/services/categoryService";
import { ArrowRight, Sparkles } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import Image from "next/image";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Danh mục</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 
                         animate-shimmer rounded-2xl h-40 bg-[length:200%_100%]"
              ></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  // Pastel colors for category cards
  const pastelColors = [
    "bg-white",           // White
    "bg-yellow-50",       // Light yellow
    "bg-purple-50",       // Light purple
    "bg-blue-50",        // Light blue
    "bg-pink-50",        // Light pink
    "bg-blue-50",        // Light blue (duplicate for more categories)
    "bg-pink-50",        // Light pink (duplicate)
    "bg-green-50",       // Light green
    "bg-orange-50",      // Light orange
    "bg-white",          // White (duplicate)
  ];

  return (
    <section className="py-6 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Danh mục</h2>
        
        {/* Horizontal scrollable container */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-3 min-w-max">
            {categories.map((category, index) => {
              const bgColor = pastelColors[index % pastelColors.length];
              
              return (
                <ScrollReveal
                  key={category.id}
                  direction="up"
                  delay={index * 0.1}
                  duration={0.5}
                  className="flex-shrink-0"
                >
                  <Link
                    href={`/products?category=${category.id}`}
                    className="group block"
                  >
                    <div
                      className={`relative ${bgColor} rounded-xl shadow-sm overflow-hidden 
                                  hover:shadow-md transition-all duration-300 w-32`}
                    >
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={getOptimizedCloudinaryUrl(category.image, 200, 200)}
                        alt={category.title}
                        fill
                        sizes="128px"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Category Title */}
                    <div className="p-2 text-center">
                      <h3 className="font-medium text-gray-800 text-xs leading-tight group-hover:text-primary-600 transition-colors">
                        {category.title}
                      </h3>
                    </div>
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
