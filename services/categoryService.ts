import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Category } from "@/types";

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    try {
      const categoriesRef = ref(database, "categories");
      const snapshot = await get(categoriesRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const categoriesData = snapshot.val();
      const categories: Category[] = [];

      for (const [id, data] of Object.entries(categoriesData)) {
        const category = data as any;
        categories.push({
          id,
          title: category.title || "",
          image: category.image || "",
        });
      }

      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },
};

