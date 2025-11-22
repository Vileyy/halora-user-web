import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Brand } from "@/types";

export const brandService = {
  async getBrandById(brandId: string): Promise<Brand | null> {
    try {
      const brandRef = ref(database, `brands/${brandId}`);
      const snapshot = await get(brandRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const brand = snapshot.val();
      return {
        id: brandId,
        name: brand.name || "",
        description: brand.description || "",
        logoUrl: brand.logoUrl || "",
      };
    } catch (error) {
      console.error("Error fetching brand:", error);
      return null;
    }
  },

  async getAllBrands(): Promise<Brand[]> {
    try {
      const brandsRef = ref(database, "brands");
      const snapshot = await get(brandsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const brandsData = snapshot.val();
      const brands: Brand[] = [];

      for (const [id, data] of Object.entries(brandsData)) {
        const brand = data as any;
        brands.push({
          id,
          name: brand.name || "",
          description: brand.description || "",
          logoUrl: brand.logoUrl || "",
        });
      }

      return brands;
    } catch (error) {
      console.error("Error fetching brands:", error);
      return [];
    }
  },
};

