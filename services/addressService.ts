// Vietnam Provinces API Service
// Using provinces.open-api.vn API
// API: https://provinces.open-api.vn/api/v1/

export interface Province {
  code: string | number;
  name: string;
  districts?: District[];
}

export interface District {
  code: string | number;
  name: string;
  wards?: Ward[];
}

export interface Ward {
  code: string | number;
  name: string;
}

// Cache for better performance
let provincesCache: Province[] | null = null;
let districtsCache: Map<string, District[]> = new Map();
let wardsCache: Map<string, Ward[]> = new Map();

export const addressService = {
  async getProvinces(): Promise<Province[]> {
    // Return cached data if available
    if (provincesCache) {
      return provincesCache;
    }

    try {
      // Use provinces.open-api.vn API
      const response = await fetch(
        "https://provinces.open-api.vn/api/v1/",
        {
          cache: "force-cache",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const provinces: Province[] = data.map((p: any) => ({
            code: String(p.code),
            name: p.name,
          }));
          provincesCache = provinces;
          return provinces;
        }
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }

    return [];
  },

  async getDistricts(provinceCode: string): Promise<District[]> {
    // Return cached data if available
    if (districtsCache.has(provinceCode)) {
      return districtsCache.get(provinceCode) || [];
    }

    try {
      // Use provinces.open-api.vn API
      const response = await fetch(
        `https://provinces.open-api.vn/api/v1/p/${provinceCode}?depth=2`,
        {
          cache: "force-cache",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.districts && Array.isArray(data.districts)) {
          const districts: District[] = data.districts.map((d: any) => ({
            code: String(d.code),
            name: d.name,
          }));
          districtsCache.set(provinceCode, districts);
          return districts;
        }
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }

    return [];
  },

  async getWards(districtCode: string): Promise<Ward[]> {
    // Return cached data if available
    if (wardsCache.has(districtCode)) {
      return wardsCache.get(districtCode) || [];
    }

    try {
      // Use provinces.open-api.vn API
      const response = await fetch(
        `https://provinces.open-api.vn/api/v1/d/${districtCode}?depth=2`,
        {
          cache: "force-cache",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.wards && Array.isArray(data.wards)) {
          const wards: Ward[] = data.wards.map((w: any) => ({
            code: String(w.code),
            name: w.name,
          }));
          wardsCache.set(districtCode, wards);
          return wards;
        }
      }
    } catch (error) {
      console.error("Error fetching wards:", error);
    }

    return [];
  },
};
