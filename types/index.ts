export interface ProductVariant {
  price: number;
  size: string;
  stockQty: number;
  sku?: string;
}

export interface ReviewSummary {
  averageRating: number;
  ratingDistribution: (number | null)[];
  totalReviews: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  brandId: string;
  category: string;
  variants: ProductVariant[];
  reviewSummary?: ReviewSummary;
  originalProductId?: string;
  // Computed fields
  minPrice?: number;
  maxPrice?: number;
  totalStock?: number;
}

export interface Category {
  id: string;
  title: string;
  image: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  product?: Product;
  variantSize?: string;
  addedAt: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  voucherCode?: string;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  address?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  createdAt: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: number;
}

export interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: number;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
