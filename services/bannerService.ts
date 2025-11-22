import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Banner } from "@/types";

export const bannerService = {
  async getActiveBanners(): Promise<Banner[]> {
    try {
      const bannersRef = ref(database, "banners");
      const snapshot = await get(bannersRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const bannersData = snapshot.val();
      const banners: Banner[] = [];

      for (const [id, data] of Object.entries(bannersData)) {
        const banner = data as any;
        if (banner.isActive && banner.imageUrl) {
          let imageUrl = banner.imageUrl || "";
          
          // Validate URL has proper extension
          if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
            if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i)) {
              console.warn(`⚠️ Banner ${id} has incomplete image URL:`, imageUrl);
              imageUrl = imageUrl + ".png"; // Try adding .png as fallback
            }
          }
          
          banners.push({
            id,
            title: banner.title || "",
            imageUrl: imageUrl,
            linkUrl: banner.linkUrl || "",
            isActive: banner.isActive,
            createdAt: banner.createdAt || 0,
            updatedAt: banner.updatedAt || 0,
          });
        }
      }

      if (banners.length > 0) {
        console.log(`✅ Loaded ${banners.length} active banners`);
      } else {
        console.warn("⚠️ No active banners found");
      }

      // Sort by updatedAt descending (newest first)
      return banners.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error("Error fetching banners:", error);
      return [];
    }
  },
};

