export const STORAGE_KEYS = {
  ITEMS: 'erp_items',
  BOMS: 'erp_boms',
  ROUTINGS: 'erp_routings',
  WORK_CENTERS: 'erp_work_centers',
  PRODUCTION_PLANS: 'erp_production_plans',
  MATERIAL_REQUIREMENTS: 'erp_material_requirements',
  PRODUCTION_ORDERS: 'erp_production_orders',
  MATERIAL_ISSUES: 'erp_material_issues',
  SHOP_FLOOR: 'erp_shop_floor',
  QUALITY_INSPECTIONS: 'erp_quality_inspections',
  FINISHED_GOODS: 'erp_finished_goods',
  COSTING: 'erp_costing',
  PERFORMANCE: 'erp_performance',
};

export const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

export const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

export const addToStorage = <T extends { id: string }>(key: string, item: T): void => {
  const items = getFromStorage<T>(key);
  items.push(item);
  saveToStorage(key, items);
};

export const updateInStorage = <T extends { id: string }>(key: string, id: string, updatedItem: T): void => {
  const items = getFromStorage<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index] = updatedItem;
    saveToStorage(key, items);
  }
};

export const deleteFromStorage = <T extends { id: string }>(key: string, id: string): void => {
  const items = getFromStorage<T>(key);
  const filtered = items.filter((item) => item.id !== id);
  saveToStorage(key, filtered);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
