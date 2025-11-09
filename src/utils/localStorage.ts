// utils/storageUtils.ts

export const STORAGE_KEYS = {
  PROJECTS: "erp_projects",
  WBS_ITEMS: "erp_wbs_items",
  RESOURCES: "erp_resources",
  BUDGETS: "erp_budgets",
  PROGRESS_UPDATES: "erp_progress_updates",
  MILESTONES: "erp_milestones",
  ITEMS: "erp_items",
  BOMS: "erp_boms",
  ROUTINGS: "erp_routings",
  WORK_CENTERS: "erp_work_centers",
  PRODUCTION_PLANS: "erp_production_plans",
  MATERIAL_REQUIREMENTS: "erp_material_requirements",
  PRODUCTION_ORDERS: "erp_production_orders",
  MATERIAL_ISSUES: "erp_material_issues",
  SHOP_FLOOR: "erp_shop_floor",
  QUALITY_INSPECTIONS: "erp_quality_inspections",
  FINISHED_GOODS: "erp_finished_goods",
  COSTING: "erp_costing",
  PERFORMANCE: "erp_performance",
} as const;

/**
 * Retrieve data from localStorage by key
 */
export const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

/**
 * Save data to localStorage under the given key
 */
export const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

/**
 * Add an item to storage list (with unique id)
 */
export const addToStorage = <T extends { id: string }>(key: string, item: T): void => {
  const items = getFromStorage<T>(key);
  items.push(item);
  saveToStorage(key, items);
};

/**
 * Update an item in storage by id
 */
export const updateInStorage = <T extends { id: string }>(
  key: string,
  id: string,
  updatedItem: T
): void => {
  const items = getFromStorage<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index] = updatedItem;
    saveToStorage(key, items);
  }
};

/**
 * Delete an item from storage by id
 */
export const deleteFromStorage = <T extends { id: string }>(key: string, id: string): void => {
  const items = getFromStorage<T>(key);
  const filtered = items.filter((item) => item.id !== id);
  saveToStorage(key, filtered);
};

/**
 * Generate a unique identifier string
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
