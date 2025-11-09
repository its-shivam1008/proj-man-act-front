// Plant & Machinery localStorage utilities

export const PM_STORAGE_KEYS = {
  EQUIPMENT: 'pm_equipment',
  ALLOCATIONS: 'pm_allocations',
  PREVENTIVE_MAINTENANCE: 'pm_preventive_maintenance',
  BREAKDOWN_MAINTENANCE: 'pm_breakdown_maintenance',
  SPARE_PARTS: 'pm_spare_parts',
  SPARE_TRANSACTIONS: 'pm_spare_transactions',
  FUEL_LUBRICANT: 'pm_fuel_lubricant',
  CALIBRATION_SAFETY: 'pm_calibration_safety',
  EQUIPMENT_COSTING: 'pm_equipment_costing',
  EQUIPMENT_DISPOSAL: 'pm_equipment_disposal',
} as const;

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

export const deleteFromStorage = <T extends { id: string }>(key: string, id: string): void => {
  const items = getFromStorage<T>(key);
  const filtered = items.filter((item) => item.id !== id);
  saveToStorage(key, filtered);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
