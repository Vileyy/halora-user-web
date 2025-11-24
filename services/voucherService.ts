import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export interface VoucherDB {
  code: string;
  title: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number;
  startDate: number;
  endDate: number;
  status: "active" | "inactive";
  type: "product" | "shipping";
  usageCount: number;
  usageLimit?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface Voucher extends VoucherDB {
  id: string;
}

export const voucherService = {
  // Get voucher by code
  async getVoucherByCode(code: string): Promise<Voucher | null> {
    try {
      const vouchersRef = ref(database, "vouchers");
      const snapshot = await get(vouchersRef);

      if (!snapshot.exists()) {
        return null;
      }

      const vouchersData = snapshot.val();
      
      // Find voucher by code
      for (const [id, data] of Object.entries(vouchersData)) {
        const voucher = data as VoucherDB;
        if (voucher.code.toUpperCase() === code.toUpperCase()) {
          return {
            id,
            ...voucher,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching voucher:", error);
      return null;
    }
  },

  // Validate voucher
  validateVoucher(
    voucher: Voucher | null,
    orderAmount: number
  ): { valid: boolean; message: string } {
    if (!voucher) {
      return {
        valid: false,
        message: "Mã giảm giá không tồn tại!",
      };
    }

    // Check status
    if (voucher.status !== "active") {
      return {
        valid: false,
        message: "Mã giảm giá không còn hiệu lực!",
      };
    }

    // Check date
    const now = Date.now();
    if (now < voucher.startDate) {
      return {
        valid: false,
        message: "Mã giảm giá chưa có hiệu lực!",
      };
    }

    if (now > voucher.endDate) {
      return {
        valid: false,
        message: "Mã giảm giá đã hết hạn!",
      };
    }

    // Check usage limit
    if (
      voucher.usageLimit !== undefined &&
      voucher.usageCount >= voucher.usageLimit
    ) {
      return {
        valid: false,
        message: "Mã giảm giá đã hết lượt sử dụng!",
      };
    }

    // Check minimum order amount
    if (orderAmount < voucher.minOrder) {
      return {
        valid: false,
        message: `Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(voucher.minOrder)} để áp dụng mã này!`,
      };
    }

    return {
      valid: true,
      message: "Mã giảm giá hợp lệ!",
    };
  },

  // Calculate discount amount for product voucher
  calculateProductDiscount(
    voucher: Voucher | null,
    orderAmount: number
  ): number {
    if (!voucher || voucher.type !== "product") {
      return 0;
    }

    if (voucher.discountType === "percentage") {
      const discount = (orderAmount * voucher.discountValue) / 100;
      return discount;
    } else {
      // Fixed amount
      return voucher.discountValue;
    }
  },

  // Calculate discount amount for shipping voucher
  calculateShippingDiscount(
    voucher: Voucher | null,
    shippingCost: number = 30000
  ): number {
    if (!voucher || voucher.type !== "shipping") {
      return 0;
    }

    if (voucher.discountType === "percentage") {
      const discount = (shippingCost * voucher.discountValue) / 100;
      // Cap at shipping cost
      return Math.min(discount, shippingCost);
    } else {
      // Fixed amount
      return Math.min(voucher.discountValue, shippingCost);
    }
  },

  // Get all active vouchers
  async getAllActiveVouchers(): Promise<Voucher[]> {
    try {
      const vouchersRef = ref(database, "vouchers");
      const snapshot = await get(vouchersRef);

      if (!snapshot.exists()) {
        return [];
      }

      const vouchersData = snapshot.val();
      const vouchers: Voucher[] = [];
      const now = Date.now();

      for (const [id, data] of Object.entries(vouchersData)) {
        const voucher = data as VoucherDB;
        
        // Filter active vouchers
        if (
          voucher.status === "active" &&
          now >= voucher.startDate &&
          now <= voucher.endDate &&
          (voucher.usageLimit === undefined ||
            voucher.usageCount < voucher.usageLimit)
        ) {
          vouchers.push({
            id,
            ...voucher,
          });
        }
      }

      return vouchers;
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      return [];
    }
  },
};

