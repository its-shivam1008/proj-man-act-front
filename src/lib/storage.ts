// utils/storage.ts

export const storage = {
  /**
   * Get an item from localStorage
   * @param key The key under which data is stored
   * @param defaultValue Default value if key does not exist or parsing fails
   */
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  /**
   * Save an item to localStorage
   */
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  },

  /**
   * Remove an item from localStorage
   */
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  },

  /**
   * Clear all localStorage data
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },
};

/**
 * Standardized storage keys for production-related data
 */
export const STORAGE_KEYS = {
  BOMS: "production_boms",
  WORK_ORDERS: "production_work_orders",
  WORK_CENTERS: "production_work_centers",
  MATERIAL_ISSUES: "production_material_issues",
  QUALITY_CHECKS: "production_quality_checks",
  PRODUCTS: "production_products",
  MATERIALS: "production_materials",
} as const;
