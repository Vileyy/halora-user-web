import { ref, get, query, orderByChild, equalTo, limitToFirst } from "firebase/database";
import { database } from "@/lib/firebase";
import { Product } from "@/types";

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
        const product = data as any;
        if (product.name && product.variants) {
          const prices = product.variants.map((v: any) => v.price);
          const totalStock = product.variants.reduce((sum: number, v: any) => sum + (v.stockQty || 0), 0);
          
          // Validate and fix image URL if needed
          let imageUrl = product.image || "";
          
          // Check if URL is complete (has file extension)
          if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
            // Ensure URL has proper extension
            if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i)) {
              console.warn(`⚠️ Product ${id} has incomplete image URL:`, imageUrl);
              // Try to find the complete URL or use placeholder
              imageUrl = imageUrl + ".jpg"; // Try adding .jpg as fallback
            }
          }
          
          // Debug: log first product image
          if (products.length === 0 && imageUrl) {
            console.log("✅ First product image URL:", imageUrl);
            console.log("✅ URL length:", imageUrl.length);
            console.log("✅ Has extension:", /\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i.test(imageUrl));
          }
          
          products.push({
            id,
            name: product.name,
            description: product.description || "",
            image: imageUrl,
            brandId: product.brandId || "",
            category: product.category || "",
            variants: product.variants || [],
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
        const product = data as any;
        if (product.category === category && product.name && product.variants) {
          const prices = product.variants.map((v: any) => v.price);
          const totalStock = product.variants.reduce((sum: number, v: any) => sum + (v.stockQty || 0), 0);
          
          products.push({
            id,
            name: product.name,
            description: product.description || "",
            image: product.image || "",
            brandId: product.brandId || "",
            category: product.category || "",
            variants: product.variants || [],
            reviewSummary: product.reviewSummary,
            originalProductId: product.originalProductId,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            totalStock,
          });
        }
      }

      console.log(`✅ Loaded ${products.length} products in category: ${category}`);
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

      const product = snapshot.val();
      if (!product.name || !product.variants) {
        return null;
      }

      // Validate and fix image URL
      let imageUrl = product.image || "";
      if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i)) {
          console.warn(`⚠️ Product ${productId} has incomplete image URL:`, imageUrl);
          imageUrl = imageUrl + ".jpg"; // Try adding .jpg as fallback
        }
      }

      const prices = product.variants.map((v: any) => v.price);
      const totalStock = product.variants.reduce((sum: number, v: any) => sum + (v.stockQty || 0), 0);

      return {
        id: productId,
        name: product.name,
        description: product.description || "",
        image: imageUrl, // Use validated imageUrl
        brandId: product.brandId || "",
        category: product.category || "",
        variants: product.variants || [],
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
};

