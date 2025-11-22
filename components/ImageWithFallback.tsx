"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc = "/placeholder-product.jpg",
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      {isLoading && !hasError && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 
                      animate-shimmer bg-[length:200%_100%]"
        />
      )}
      <Image
        {...props}
        src={hasError ? fallbackSrc : imgSrc}
        alt={alt}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
      />
    </>
  );
}
