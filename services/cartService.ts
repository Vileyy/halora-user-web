import { ref, get, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { CartItem, Product } from "@/types";

interface CartItemDB {
  id: string;
  name: string;
  image: string;
  description: string;
  category: string;
  price: string;
  quantity: number;
  selected: boolean;
  variant: {
    price: number;
    size: string;
  };
}

export const cartService = {
  // Load cart from database
  async getCart(userId: string): Promise<CartItem[]> {
    try {
      const cartRef = ref(database, `users/${userId}/cart`);
      const snapshot = await get(cartRef);

      if (!snapshot.exists()) {
        return [];
      }

      const cartData = snapshot.val() as CartItemDB[];
      if (!Array.isArray(cartData)) {
        return [];
      }

      // Convert database format to CartItem format
      const cartItems: CartItem[] = cartData.map((item) => ({
        id: `${item.id}-${item.variant.size}`,
        productId: item.id,
        userId: userId,
        quantity: item.quantity,
        variantSize: item.variant.size,
        product: {
          id: item.id,
          name: item.name,
          image: item.image,
          description: item.description,
          category: item.category,
          brandId: "",
          variants: [
            {
              price: item.variant.price,
              size: item.variant.size,
              stockQty: 0,
            },
          ],
          minPrice: item.variant.price,
          maxPrice: item.variant.price,
        },
        addedAt: Date.now(),
      }));

      return cartItems;
    } catch (error) {
      console.error("Error loading cart from database:", error);
      return [];
    }
  },

  // Save cart to database
  async saveCart(userId: string, items: CartItem[]): Promise<boolean> {
    try {
      // Convert CartItem to database format
      const cartData: CartItemDB[] = items.map((item) => ({
        id: item.productId,
        name: item.product?.name || "",
        image: item.product?.image || "",
        description: item.product?.description || "",
        category: item.product?.category || "",
        price: String(item.product?.minPrice || 0),
        quantity: item.quantity,
        selected: false,
        variant: {
          price: item.product?.minPrice || 0,
          size: item.variantSize || "",
        },
      }));

      const cartRef = ref(database, `users/${userId}/cart`);
      await set(cartRef, cartData);
      return true;
    } catch (error) {
      console.error("Error saving cart to database:", error);
      return false;
    }
  },

  // Add item to cart in database
  async addItemToCart(userId: string, item: CartItem): Promise<boolean> {
    try {
      // Get current cart
      const currentCart = await this.getCart(userId);

      // Check if item already exists (same productId and variant size)
      const existingIndex = currentCart.findIndex(
        (cartItem) =>
          cartItem.productId === item.productId &&
          cartItem.variantSize === item.variantSize
      );

      if (existingIndex >= 0) {
        // Update quantity
        currentCart[existingIndex].quantity += item.quantity;
      } else {
        // Add new item
        currentCart.push(item);
      }

      // Save updated cart
      return await this.saveCart(userId, currentCart);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return false;
    }
  },

  // Remove item from cart in database
  async removeItemFromCart(userId: string, itemId: string): Promise<boolean> {
    try {
      // Get current cart
      const currentCart = await this.getCart(userId);

      // Remove item
      const updatedCart = currentCart.filter((item) => item.id !== itemId);

      // Save updated cart
      return await this.saveCart(userId, updatedCart);
    } catch (error) {
      console.error("Error removing item from cart:", error);
      return false;
    }
  },

  // Update item quantity in cart
  async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<boolean> {
    try {
      // Get current cart
      const currentCart = await this.getCart(userId);

      // Update quantity
      const itemIndex = currentCart.findIndex((item) => item.id === itemId);
      if (itemIndex >= 0) {
        currentCart[itemIndex].quantity = quantity;
      }

      // Save updated cart
      return await this.saveCart(userId, currentCart);
    } catch (error) {
      console.error("Error updating item quantity:", error);
      return false;
    }
  },

  // Clear cart in database
  async clearCart(userId: string): Promise<boolean> {
    try {
      const cartRef = ref(database, `users/${userId}/cart`);
      await set(cartRef, []);
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  },
};

