import { ref, get, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Product } from "@/types";
import { matchesSearch } from "@/utils/vietnamese";

// Interface for Firebase product variant data
interface FirebaseVariant {
  name?: string;
  size?: string;
  price: number;
  stockQty: number;
  importPrice?: number;
  id?: string;
  createdAt?: string;
  sku?: string;
}

// Interface for Firebase product data
interface FirebaseProduct {
  name: string;
  description?: string;
  image?: string;
  brandId?: string;
  category?: string;
  variants: FirebaseVariant[];
  reviewSummary?: {
    averageRating: number;
    ratingDistribution: (number | null)[];
    totalReviews: number;
  };
  originalProductId?: string;
  supplier?: string;
  createdAt?: string;
  updatedAt?: string;
  media?: unknown[];
}

export const productService = {
  // Get all products
  async getAllProducts(): Promise<Product[]> {
    try {
      const productsRef = ref(database, "products");
      const snapshot = await get(productsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const productsData = snapshot.val();
      const products: Product[] = [];

      for (const [id, data] of Object.entries(productsData)) {
        const product = data as FirebaseProduct;
        if (product.name && product.variants) {
          const prices = product.variants.map((v: FirebaseVariant) => v.price);
          const totalStock = product.variants.reduce(
            (sum: number, v: FirebaseVariant) => sum + (v.stockQty || 0),
            0
          );

          // Validate and fix image URL if needed
          let imageUrl = product.image || "";

          // Check if URL is complete (has file extension)
          if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
            // Ensure URL has proper extension
            if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i)) {
              console.warn(
                `⚠️ Product ${id} has incomplete image URL:`,
                imageUrl
              );
              // Try to find the complete URL or use placeholder
              imageUrl = imageUrl + ".jpg"; // Try adding .jpg as fallback
            }
          }

          // Debug: log first product image
          if (products.length === 0 && imageUrl) {
            console.log("✅ First product image URL:", imageUrl);
            console.log("✅ URL length:", imageUrl.length);
            console.log(
              "✅ Has extension:",
              /\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i.test(imageUrl)
            );
          }

          // Map variants - ensure 'size' field exists (Firebase uses 'name' field)
          const mappedVariants = product.variants.map((v: FirebaseVariant) => ({
            price: v.price,
            stockQty: v.stockQty,
            size: v.size || v.name || "", // Use 'size' if exists, fallback to 'name'
            sku: v.sku,
          }));

          products.push({
            id,
            name: product.name,
            description: product.description || "",
            image: imageUrl,
            brandId: product.brandId || "",
            category: product.category || "",
            variants: mappedVariants,
            reviewSummary: product.reviewSummary,
            originalProductId: product.originalProductId,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            totalStock,
          });
        }
      }

      console.log(`✅ Loaded ${products.length} products`);
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const productsRef = ref(database, "products");
      const snapshot = await get(productsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const productsData = snapshot.val();
      const products: Product[] = [];

      for (const [id, data] of Object.entries(productsData)) {
        const product = data as FirebaseProduct;
        if (product.category === category && product.name && product.variants) {
          const prices = product.variants.map((v: FirebaseVariant) => v.price);
          const totalStock = product.variants.reduce(
            (sum: number, v: FirebaseVariant) => sum + (v.stockQty || 0),
            0
          );

          // Map variants - ensure 'size' field exists
          const mappedVariants = product.variants.map((v: FirebaseVariant) => ({
            price: v.price,
            stockQty: v.stockQty,
            size: v.size || v.name || "",
            sku: v.sku,
          }));

          products.push({
            id,
            name: product.name,
            description: product.description || "",
            image: product.image || "",
            brandId: product.brandId || "",
            category: product.category || "",
            variants: mappedVariants,
            reviewSummary: product.reviewSummary,
            originalProductId: product.originalProductId,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            totalStock,
          });
        }
      }

      console.log(
        `✅ Loaded ${products.length} products in category: ${category}`
      );
      return products;
    } catch (error) {
      console.error("Error fetching products by category:", error);
      return [];
    }
  },

  // Get FlashDeals products
  async getFlashDeals(limit: number = 10): Promise<Product[]> {
    const products = await this.getProductsByCategory("FlashDeals");
    return products.slice(0, limit);
  },

  // Get new products
  async getNewProducts(limit: number = 10): Promise<Product[]> {
    const products = await this.getProductsByCategory("new_product");
    return products.slice(0, limit);
  },

  // Get product by ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);

      if (!snapshot.exists()) {
        return null;
      }

      const product = snapshot.val() as FirebaseProduct;
      if (!product.name || !product.variants) {
        return null;
      }

      // Validate and fix image URL
      let imageUrl = product.image || "";
      if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i)) {
          console.warn(
            `⚠️ Product ${productId} has incomplete image URL:`,
            imageUrl
          );
          imageUrl = imageUrl + ".jpg"; // Try adding .jpg as fallback
        }
      }

      const prices = product.variants.map((v: FirebaseVariant) => v.price);
      const totalStock = product.variants.reduce(
        (sum: number, v: FirebaseVariant) => sum + (v.stockQty || 0),
        0
      );

      // Map variants - ensure 'size' field exists
      const mappedVariants = product.variants.map((v: FirebaseVariant) => ({
        price: v.price,
        stockQty: v.stockQty,
        size: v.size || v.name || "",
        sku: v.sku,
      }));

      return {
        id: productId,
        name: product.name,
        description: product.description || "",
        image: imageUrl,
        brandId: product.brandId || "",
        category: product.category || "",
        variants: mappedVariants,
        reviewSummary: product.reviewSummary,
        originalProductId: product.originalProductId,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        totalStock,
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  },

  // Search products by query (diacritic-insensitive)
  async searchProducts(query: string, limit: number = 50): Promise<Product[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const allProducts = await this.getAllProducts();
      const searchQuery = query.trim();

      // Filter products that match the search query
      const matchedProducts = allProducts.filter((product) => {
        // Search in product name
        if (matchesSearch(product.name, searchQuery)) {
          return true;
        }
        // Search in description
        if (
          product.description &&
          matchesSearch(product.description, searchQuery)
        ) {
          return true;
        }
        return false;
      });

      // Sort by relevance (products with name match first)
      const sortedProducts = matchedProducts.sort((a, b) => {
        const aNameMatch = matchesSearch(a.name, searchQuery);
        const bNameMatch = matchesSearch(b.name, searchQuery);

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        // If both match name or both don't, maintain original order
        return 0;
      });

      return sortedProducts.slice(0, limit);
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  },

  // Update product stock quantity
  async updateProductStock(
    productId: string,
    variantSize: string,
    quantityChange: number
  ): Promise<void> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);

      if (!snapshot.exists()) {
        throw new Error(`Product ${productId} not found`);
      }

      const product = snapshot.val() as FirebaseProduct;
      const variants: FirebaseVariant[] = product.variants || [];

      // Find the variant index - check both 'size' and 'name' fields
      const variantIndex = variants.findIndex(
        (v: FirebaseVariant) => v.size === variantSize || v.name === variantSize
      );

      if (variantIndex === -1) {
        throw new Error(
          `Variant ${variantSize} not found for product ${productId}`
        );
      }

      // Update stock quantity
      const currentStock = variants[variantIndex].stockQty || 0;
      const newStock = currentStock + quantityChange;

      if (newStock < 0) {
        throw new Error(
          `Insufficient stock for product ${productId}, variant ${variantSize}`
        );
      }

      // Update the variant stock in database
      await update(
        ref(database, `products/${productId}/variants/${variantIndex}`),
        {
          stockQty: newStock,
        }
      );

      console.log(
        `✅ Updated stock for product ${productId}, variant ${variantSize}: ${currentStock} → ${newStock}`
      );
    } catch (error) {
      console.error("Error updating product stock:", error);
      throw error;
    }
  },

  // Decrease stock when order is placed
  async decreaseStock(
    items: Array<{
      productId: string;
      variantSize: string;
      quantity: number;
    }>
  ): Promise<void> {
    try {
      for (const item of items) {
        await this.updateProductStock(
          item.productId,
          item.variantSize,
          -item.quantity
        );
      }
    } catch (error) {
      console.error("Error decreasing stock:", error);
      throw error;
    }
  },

  // Increase stock when order is cancelled
  async increaseStock(
    items: Array<{
      productId: string;
      variantSize: string;
      quantity: number;
    }>
  ): Promise<void> {
    try {
      for (const item of items) {
        await this.updateProductStock(
          item.productId,
          item.variantSize,
          item.quantity
        );
      }
    } catch (error) {
      console.error("Error increasing stock:", error);
      throw error;
    }
  },
};
