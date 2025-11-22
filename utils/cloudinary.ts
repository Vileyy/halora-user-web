/**
 * Cloudinary utility functions
 */

// Use NEXT_PUBLIC_ prefix for client-side access
// Fallback to server-side env var if NEXT_PUBLIC_ is not available
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  "de8vufzzx";

/**
 * Get Cloudinary image URL
 * Accepts various formats and normalizes them
 */
export function getCloudinaryUrl(
  imageUrl: string | null | undefined,
  transformations?: string
): string {
  // Return placeholder if no URL
  if (!imageUrl) {
    return "/placeholder-product.jpg";
  }

  // If already a full Cloudinary URL, return as is
  if (imageUrl.startsWith("https://res.cloudinary.com/")) {
    return imageUrl;
  }

  // If it's just a public_id (e.g., "products/abc123")
  if (!imageUrl.startsWith("http")) {
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const transform = transformations || "q_auto,f_auto";
    return `${baseUrl}/${transform}/${imageUrl}`;
  }

  // If it's another external URL, return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Default fallback
  return "/placeholder-product.jpg";
}

/**
 * Get optimized Cloudinary URL for different sizes
 * SIMPLIFIED VERSION - Returns original URL to ensure images load
 */
export function getOptimizedCloudinaryUrl(
  imageUrl: string | null | undefined,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  // Return placeholder if no URL
  if (!imageUrl || imageUrl.trim() === "") {
    return "https://via.placeholder.com/400x400?text=No+Image";
  }

  // If already a full Cloudinary URL, return as is (no transformations for now)
  if (imageUrl.startsWith("https://res.cloudinary.com/")) {
    // Log in development
    if (typeof window !== "undefined") {
      console.log("🔗 Cloudinary URL:", imageUrl.substring(0, 100));
    }
    return imageUrl;
  }

  // If it's another external URL, return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it's just a public_id, build full URL
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const transforms: string[] = ["q_auto", "f_auto"];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (quality !== 80) transforms.push(`q_${quality}`);

  const transformString = transforms.join(",");
  return `${baseUrl}/${transformString}/${imageUrl}`;
}

/**
 * Get thumbnail URL
 */
export function getThumbnailUrl(imageUrl: string | null | undefined): string {
  return getOptimizedCloudinaryUrl(imageUrl, 400, 400, 70);
}

/**
 * Validate if URL is a valid Cloudinary URL
 */
export function isValidCloudinaryUrl(url: string): boolean {
  return (
    url.startsWith("https://res.cloudinary.com/") ||
    (!url.startsWith("http") && url.length > 0)
  );
}
