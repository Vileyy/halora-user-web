import { ref, get, push, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Review } from "@/types";
/* eslint-disable @typescript-eslint/no-explicit-any */


interface SubmitOrderReviewItem {
  productId: string;
  productName: string;
  productImage?: string;
  rating: number;
  comment?: string;
}

interface SubmitOrderReviewsPayload {
  orderId: string;
  userId: string;
  userName: string;
  shippingRating?: number;
  comment?: string;
  items: SubmitOrderReviewItem[];
}

export const reviewService = {
  // Get reviews by product ID
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    try {
      const reviewsRef = ref(database, "reviews");
      const snapshot = await get(reviewsRef);

      if (!snapshot.exists()) {
        console.log("No reviews found in database");
        return [];
      }

      const reviewsData = snapshot.val();
      const reviews: Review[] = [];

      for (const [id, data] of Object.entries(reviewsData)) {
        const review = data as any;

        // Filter by productId
        if (review.productId !== productId) {
          continue;
        }

        // Handle createdAt - can be string (ISO) or number (timestamp)
        let createdAt = Date.now();
        if (review.createdAt) {
          if (typeof review.createdAt === "string") {
            createdAt = new Date(review.createdAt).getTime();
          } else if (typeof review.createdAt === "number") {
            createdAt = review.createdAt;
          }
        }

        reviews.push({
          id,
          productId: review.productId,
          userId: review.userId,
          userName: review.userName || "Người dùng",
          userAvatar: review.userAvatar,
          rating: review.rating || 0,
          comment: review.comment || "",
          images: review.images || [],
          createdAt,
        });
      }

      console.log(`Found ${reviews.length} reviews for product ${productId}`);

      // Sort by createdAt descending (newest first)
      return reviews.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  },

  // Get map of order IDs that current user has reviewed
  async getUserOrderReviewStatus(
    userId: string
  ): Promise<Record<string, number>> {
    try {
      const reviewsRef = ref(database, "reviews");
      const snapshot = await get(reviewsRef);

      if (!snapshot.exists()) {
        return {};
      }

      const reviewsData = snapshot.val();
      const statusMap: Record<string, number> = {};

      for (const [, data] of Object.entries(reviewsData)) {
        const review = data as any;
        if (review.userId !== userId || !review.orderId) {
          continue;
        }
        statusMap[review.orderId] = (statusMap[review.orderId] || 0) + 1;
      }

      return statusMap;
    } catch (error) {
      console.error("Error fetching user review status:", error);
      return {};
    }
  },

  async submitOrderReviews(payload: SubmitOrderReviewsPayload): Promise<void> {
    if (!payload.items || payload.items.length === 0) {
      throw new Error("Không có sản phẩm nào để đánh giá");
    }

    try {
      const reviewsRef = ref(database, "reviews");
      const now = new Date().toISOString();
      const shippingRating = payload.shippingRating ?? 5;

      await Promise.all(
        payload.items.map(async (item) => {
          if (!item.productId) {
            return;
          }
          const newReviewRef = push(reviewsRef);
          const reviewId = newReviewRef.key;

          if (!reviewId) {
            throw new Error("Không thể tạo mã đánh giá");
          }

          const reviewData = {
            id: reviewId,
            orderId: payload.orderId,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage || "",
            rating: item.rating,
            shippingRating,
            comment: item.comment?.trim() || payload.comment?.trim() || "",
            userId: payload.userId,
            userName: payload.userName,
            createdAt: now,
            updatedAt: now,
          };

          await set(newReviewRef, reviewData);
        })
      );
    } catch (error) {
      console.error("Error submitting reviews:", error);
      throw error;
    }
  },
};
