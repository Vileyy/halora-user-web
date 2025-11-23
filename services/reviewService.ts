import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/lib/firebase";
import { Review } from "@/types";

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
};

