/**
 * Utility functions for Vietnamese text processing
 */

/**
 * Removes Vietnamese diacritics (accents) from a string
 * Example: "Sản phẩm" -> "San pham"
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return "";
  
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Normalizes a string for search comparison (lowercase + remove diacritics)
 */
export function normalizeForSearch(str: string): string {
  return removeVietnameseDiacritics(str.toLowerCase().trim());
}

/**
 * Checks if a search query matches a text (case-insensitive, diacritic-insensitive)
 */
export function matchesSearch(text: string, query: string): boolean {
  if (!query) return true;
  const normalizedText = normalizeForSearch(text);
  const normalizedQuery = normalizeForSearch(query);
  return normalizedText.includes(normalizedQuery);
}

