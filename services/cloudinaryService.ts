/**
 * Cloudinary Service for Next.js
 * Handles image upload, optimization, and URL generation
 */

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  version: number;
  folder?: string;
}

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: string | number;
  format?: string;
  crop?: string;
  gravity?: string;
}

class CloudinaryService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      "";
    this.apiKey =
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY ||
      "";
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  }

  /**
   * Extract public_id from Cloudinary URL
   */
  extractPublicId(cloudinaryUrl: string): string | null {
    try {
      // Match: /v{version}/{public_id}.{extension}
      const regex = /\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp|svg|jfif)$/i;
      const match = cloudinaryUrl.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Error extracting public_id:", error);
      return null;
    }
  }

  /**
   * Generate optimized Cloudinary URL with transformations
   */
  generateOptimizedUrl(
    cloudinaryUrl: string,
    options: OptimizeOptions = {}
  ): string {
    if (!cloudinaryUrl || !cloudinaryUrl.includes("res.cloudinary.com")) {
      return cloudinaryUrl;
    }

    const {
      width,
      height,
      quality = "auto:good",
      format = "auto",
      crop = "fill",
      gravity = "auto",
    } = options;

    // Extract cloud name and path from URL
    const urlMatch = cloudinaryUrl.match(
      /https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)/
    );

    if (!urlMatch) {
      // If URL is malformed, try to extract public_id and rebuild
      const publicId = this.extractPublicId(cloudinaryUrl);
      if (publicId) {
        return this.buildUrlFromPublicId(publicId, options);
      }
      return cloudinaryUrl;
    }

    const cloudName = urlMatch[1];
    const pathAfterUpload = urlMatch[2];

    // Check if path starts with version
    const versionMatch = pathAfterUpload.match(/^v\d+\//);
    
    if (versionMatch) {
      // Has version: v{version}/{public_id}.{ext}
      // Build transformations
      const transforms: string[] = [];
      
      if (width) transforms.push(`w_${width}`);
      if (height) transforms.push(`h_${height}`);
      if (crop) transforms.push(`c_${crop}`);
      if (gravity) transforms.push(`g_${gravity}`);
      if (quality) transforms.push(`q_${quality}`);
      if (format && format !== "auto") transforms.push(`f_${format}`);

      const transformString = transforms.length > 0 
        ? transforms.join(",") + "/"
        : "";

      return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${pathAfterUpload}`;
    } else {
      // No version, might have existing transformations
      // For now, just return original or add transformations
      if (width || height) {
        const transforms: string[] = [];
        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        if (crop) transforms.push(`c_${crop}`);
        if (quality) transforms.push(`q_${quality}`);
        
        const transformString = transforms.join(",");
        return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${pathAfterUpload}`;
      }
      return cloudinaryUrl;
    }
  }

  /**
   * Build URL from public_id
   */
  private buildUrlFromPublicId(
    publicId: string,
    options: OptimizeOptions = {}
  ): string {
    if (!this.cloudName) {
      throw new Error("Cloudinary cloud name is missing");
    }

    const {
      width = 300,
      height = 300,
      quality = "auto:good",
      format = "auto",
      crop = "fill",
      gravity = "auto",
    } = options;

    const transforms: string[] = [];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop) transforms.push(`c_${crop}`);
    if (gravity) transforms.push(`g_${gravity}`);
    if (quality) transforms.push(`q_${quality}`);
    if (format && format !== "auto") transforms.push(`f_${format}`);

    const transformString = transforms.join(",");

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformString}/${publicId}`;
  }

  /**
   * Upload image to Cloudinary (server-side only)
   */
  async uploadImage(
    file: File | Blob | Buffer,
    folder: string = "general",
    uploadPreset?: string
  ): Promise<CloudinaryUploadResponse> {
    if (typeof window !== "undefined") {
      throw new Error("uploadImage can only be called server-side");
    }

    try {
      const formData = new FormData();
      
      // In Node.js, FormData can accept Buffer, File, or Blob
      // Use type assertion to handle all cases
      formData.append("file", file as any);

      formData.append("upload_preset", uploadPreset || "my_preset");
      formData.append("folder", folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: CloudinaryUploadResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary (server-side only)
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      throw new Error("deleteImage can only be called server-side");
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", this.apiKey);
      formData.append("signature", stringToSign);

      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;

      const response = await fetch(deleteUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      return false;
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(this.cloudName && this.apiKey);
  }

  /**
   * Get configuration (without secrets)
   */
  getConfig() {
    return {
      cloudName: this.cloudName,
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret,
    };
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;

