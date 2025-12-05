import { ref, push, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { CartItem } from "@/types";
import { productService } from "./productService";

export interface OrderData {
  id: string;
  userId?: string;
  items: OrderItem[];
  itemsSubtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: string;
  shippingMethod: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    province?: string;
    district?: string;
    ward?: string;
    note?: string;
  };
  vouchers?: {
    product?: {
      code: string;
      discountAmount: number;
    };
    shipping?: {
      code: string;
      discountAmount: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: string;
  quantity: number;
  variant?: {
    size: string;
    price: number;
  };
  category?: string;
  description?: string;
}

export const orderService = {
  async createOrder(
    userId: string,
    cartItems: CartItem[],
    shippingInfo: {
      fullName: string;
      phone: string;
      email: string;
      address: string;
      provinceCode: string;
      districtCode: string;
      wardCode: string;
      note?: string;
    },
    totals: {
      subtotal: number;
      productDiscount: number;
      shippingDiscount: number;
      shippingFee: number;
      finalAmount: number;
    },
    paymentMethod: string,
    vouchers?: {
      product?: { code: string; discountAmount: number };
      shipping?: { code: string; discountAmount: number };
    },
    addressData?: {
      province?: { name: string; code: string };
      district?: { name: string; code: string };
      ward?: { name: string; code: string };
    }
  ): Promise<string> {
    try {
      // Create order items
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        id: item.productId,
        productId: item.productId,
        name: item.product?.name || "Sản phẩm",
        image: item.product?.image || "",
        price: String(item.product?.minPrice || 0),
        quantity: item.quantity,
        variant: item.variantSize
          ? {
              size: item.variantSize,
              price: item.product?.minPrice || 0,
            }
          : undefined,
        category: item.product?.category || "",
        description: item.product?.description || "",
      }));

      // Get province, district, ward names
      const provinceName =
        addressData?.province?.name ||
        shippingInfo.provinceCode ||
        "Chưa xác định";
      const districtName =
        addressData?.district?.name ||
        shippingInfo.districtCode ||
        "Chưa xác định";
      const wardName =
        addressData?.ward?.name || shippingInfo.wardCode || "Chưa xác định";

      // Create order data
      const now = new Date().toISOString();

      // Build vouchers object without undefined values
      const vouchersData: {
        product?: { code: string; discountAmount: number };
        shipping?: { code: string; discountAmount: number };
      } = {};
      if (vouchers?.product) {
        vouchersData.product = vouchers.product;
      }
      if (vouchers?.shipping) {
        vouchersData.shipping = vouchers.shipping;
      }

      const orderData: Omit<OrderData, "id"> & { id: string } = {
        id: "", // Will be set by Firebase
        userId,
        items: orderItems,
        itemsSubtotal: totals.subtotal,
        discountAmount: totals.productDiscount + totals.shippingDiscount,
        shippingCost: totals.shippingFee,
        totalAmount: totals.finalAmount,
        paymentMethod: paymentMethod || "cod",
        shippingMethod: "standard",
        status: "pending",
        shippingAddress: {
          fullName: shippingInfo.fullName,
          phone: shippingInfo.phone,
          email: shippingInfo.email,
          address: shippingInfo.address,
          province: provinceName,
          district: districtName,
          ward: wardName,
          note: shippingInfo.note || "",
        },
        createdAt: now,
        updatedAt: now,
      };

      // Only add vouchers if it has at least one property
      if (Object.keys(vouchersData).length > 0) {
        orderData.vouchers = vouchersData;
      }

      // Push to Firebase
      const ordersRef = ref(database, `users/${userId}/orders`);
      const newOrderRef = push(ordersRef);
      const orderId = newOrderRef.key;

      if (!orderId) {
        throw new Error("Failed to generate order ID");
      }

      // Set order data with generated ID
      orderData.id = orderId;
      await set(newOrderRef, orderData);

      // Decrease product stock after order is created successfully
      try {
        const stockItems = cartItems.map((item) => ({
          productId: item.productId,
          variantSize:
            item.variantSize || item.product?.variants[0]?.size || "",
          quantity: item.quantity,
        }));
        await productService.decreaseStock(stockItems);
        console.log("✅ Stock decreased successfully for order:", orderId);
      } catch (stockError) {
        console.error("⚠️ Error decreasing stock:", stockError);
        // Note: Order is already created, but stock update failed
        // You might want to implement a rollback or notification system here
      }

      return orderId;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  async getOrderById(
    userId: string,
    orderId: string
  ): Promise<OrderData | null> {
    try {
      const orderRef = ref(database, `users/${userId}/orders/${orderId}`);
      const snapshot = await get(orderRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as OrderData;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  },

  async getUserOrders(userId: string): Promise<OrderData[]> {
    try {
      const ordersRef = ref(database, `users/${userId}/orders`);
      const snapshot = await get(ordersRef);

      if (!snapshot.exists()) {
        return [];
      }

      const ordersData = snapshot.val();
      const orders: OrderData[] = [];

      for (const [, data] of Object.entries(ordersData)) {
        const order = data as OrderData;
        orders.push(order);
      }

      // Sort by createdAt descending (newest first)
      return orders.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
  },

  async cancelOrder(userId: string, orderId: string): Promise<void> {
    try {
      const orderRef = ref(database, `users/${userId}/orders/${orderId}`);
      const snapshot = await get(orderRef);

      if (!snapshot.exists()) {
        throw new Error("Đơn hàng không tồn tại");
      }

      const order = snapshot.val() as OrderData;

      // Only allow cancellation for pending or processing orders
      if (order.status !== "pending" && order.status !== "processing") {
        throw new Error("Không thể hủy đơn hàng ở trạng thái này");
      }

      // Update order status to cancelled
      const now = new Date().toISOString();
      await set(orderRef, {
        ...order,
        status: "cancelled",
        updatedAt: now,
      });

      // Restore product stock when order is cancelled
      try {
        const stockItems = order.items.map((item) => ({
          productId: item.productId,
          variantSize: item.variant?.size || "",
          quantity: item.quantity,
        }));
        await productService.increaseStock(stockItems);
        console.log(
          "✅ Stock restored successfully for cancelled order:",
          orderId
        );
      } catch (stockError) {
        console.error("⚠️ Error restoring stock:", stockError);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  },
};
