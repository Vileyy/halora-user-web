import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { CartItem } from "@/types";
import { cartService } from "@/services/cartService";

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isOpen: boolean;
  selectedItems: string[]; // Array of item IDs that are selected
  appliedProductVoucher: {
    code: string;
    discountAmount: number;
  } | null;
  appliedShippingVoucher: {
    code: string;
    discountAmount: number;
  } | null;
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isOpen: false,
  selectedItems: [],
  appliedProductVoucher: null,
  appliedShippingVoucher: null,
};

// Async thunks for database operations
export const loadCartFromDatabase = createAsyncThunk(
  "cart/loadFromDatabase",
  async (userId: string) => {
    const items = await cartService.getCart(userId);
    return items;
  }
);

export const syncCartToDatabase = createAsyncThunk(
  "cart/syncToDatabase",
  async ({ userId, items }: { userId: string; items: CartItem[] }) => {
    await cartService.saveCart(userId, items);
    return items;
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          item.variantSize === action.payload.variantSize
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      state.totalItems = state.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce((sum, item) => {
        const price = item.product?.minPrice || 0;
        return sum + price * item.quantity;
      }, 0);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      // Remove from selected items if it was selected
      state.selectedItems = state.selectedItems.filter(
        (id) => id !== action.payload
      );
      state.totalItems = state.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce((sum, item) => {
        const price = item.product?.minPrice || 0;
        return sum + price * item.quantity;
      }, 0);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        state.totalItems = state.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.totalAmount = state.items.reduce((sum, item) => {
          const price = item.product?.minPrice || 0;
          return sum + price * item.quantity;
        }, 0);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      state.appliedProductVoucher = null;
      state.appliedShippingVoucher = null;
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.totalItems = state.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce((sum, item) => {
        const price = item.product?.minPrice || 0;
        return sum + price * item.quantity;
      }, 0);
    },
    applyProductVoucher: (
      state,
      action: PayloadAction<{ code: string; discountAmount: number }>
    ) => {
      state.appliedProductVoucher = {
        code: action.payload.code,
        discountAmount: action.payload.discountAmount,
      };
    },
    applyShippingVoucher: (
      state,
      action: PayloadAction<{ code: string; discountAmount: number }>
    ) => {
      state.appliedShippingVoucher = {
        code: action.payload.code,
        discountAmount: action.payload.discountAmount,
      };
    },
    removeProductVoucher: (state) => {
      state.appliedProductVoucher = null;
    },
    removeShippingVoucher: (state) => {
      state.appliedShippingVoucher = null;
    },
    toggleSelectItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      if (state.selectedItems.includes(itemId)) {
        state.selectedItems = state.selectedItems.filter((id) => id !== itemId);
      } else {
        state.selectedItems.push(itemId);
      }
    },
    selectAllItems: (state) => {
      state.selectedItems = state.items.map((item) => item.id);
    },
    deselectAllItems: (state) => {
      state.selectedItems = [];
    },
    setSelectedItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCartFromDatabase.fulfilled, (state, action) => {
        state.items = action.payload;
        state.totalItems = state.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.totalAmount = state.items.reduce((sum, item) => {
          const price = item.product?.minPrice || 0;
          return sum + price * item.quantity;
        }, 0);
      })
      .addCase(syncCartToDatabase.fulfilled, (state, action) => {
        // Cart already updated in reducers, just confirm sync
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  setCartOpen,
  setCartItems,
  applyProductVoucher,
  applyShippingVoucher,
  removeProductVoucher,
  removeShippingVoucher,
  toggleSelectItem,
  selectAllItems,
  deselectAllItems,
  setSelectedItems,
} = cartSlice.actions;

export default cartSlice.reducer;
