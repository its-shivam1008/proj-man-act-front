/**
 * storage.ts — Centralized LocalStorage Utility for ERP System
 * Author: Vaibhav Agarwal
 * Version: v2.5 Stable (2025)
 * Description:
 *   A type-safe, extensible storage manager for ERP modules.
 *   Supports full CRUD, initialization, and cross-tab synchronization.
 */

export const STORAGE_KEYS = {
  // 🏭 Production & Planning
  WORK_ORDERS: "WORK_ORDERS",
  PLANNED_ORDERS: "PLANNED_ORDERS",
  FORECASTS: "FORECASTS",
  MPS_PLANS: "MPS_PLANS",
  MRP_REQUIREMENTS: "MRP_REQUIREMENTS",
  CRP_CAPACITY: "CRP_CAPACITY",

  // ⚙️ Master Data
  ITEMS: "ITEMS",
  BOMS: "BOMS",
  ROUTINGS: "ROUTINGS",
  WORK_CENTERS: "WORK_CENTERS",
  EMPLOYEES: "EMPLOYEES",
  SUPPLIERS: "SUPPLIERS",
  PRODUCTS: "PRODUCTS",
  MATERIALS: "MATERIALS",
  QUALITY_PARAMETERS: "QUALITY_PARAMETERS",

  // 🧾 Production Execution
  WORK_LOGS: "WORK_LOGS",
  WORK_ORDER_AUDIT: "WORK_ORDER_AUDIT",
  DOWNTIME_LOGS: "DOWNTIME_LOGS",
  MAINTENANCE_REQUESTS: "MAINTENANCE_REQUESTS",
  QUALITY_CHECKS: "QUALITY_CHECKS",

  // 📦 Inventory & Material
  INVENTORY: "INVENTORY",
  INVENTORY_LEDGER: "INVENTORY_LEDGER",
  WIP_INVENTORY: "WIP_INVENTORY",
  ISSUE_SLIPS: "ISSUE_SLIPS",
  MATERIAL_ISSUES: "MATERIAL_ISSUES",
  PURCHASE_REQUESTS: "PURCHASE_REQUESTS",
  PURCHASE_ORDERS: "PURCHASE_ORDERS",

  // 💰 Finance
  JOURNALS: "JOURNALS",
  ACCOUNTS: "ACCOUNTS",
  BUDGETS: "BUDGETS",
  INVOICES: "INVOICES",
  PAYMENTS: "PAYMENTS",
  CASH_FLOW: "CASH_FLOW",
  TRANSACTIONS: "TRANSACTIONS",

  // 👨‍💼 HR
  ATTENDANCE: "ATTENDANCE",

  // 📊 Reports / Settings
  REPORT_CACHE: "REPORT_CACHE",
  SETTINGS: "SETTINGS",

  // 🧠 Meta
  AUDIT_LOGS: "AUDIT_LOGS",
  STORAGE_VERSION: "STORAGE_VERSION",

  // ⚙️ Custom Modules
  EQUIPMENT_MASTER_V1: "equipment_master_v1",
  EQUIPMENT_ALLOCATION_V1: "equipment_allocation_v1",
  PREVENTIVE_MAINTENANCE_V1: "preventive_maintenance_v1",
  BREAKDOWN_MAINTENANCE_V1: "breakdown_maintenance_v1",
  MAINTENANCE_WORK_ORDERS_V1: "maintenance_work_orders_v1",
  EQUIPMENT_COSTING_V1: "equipment_costing_v1",
  SAFETY_COMPLIANCE_V1: "safety_compliance_v1",
  MONITORING_REPORTS_V1: "monitoring_reports_v1",
  ASSET_DISPOSAL_V1: "asset_disposal_v1",
  ASSET_DISPOSAL_AUDIT_V1: "asset_disposal_audit_v1",

  // 👷‍♂️ Plant & Machinery
  MAINTENANCE_TEAMS_V1: "maintenance_teams_v1",
} as const;

/* ------------------------------------------------------------------
   🧩 JSON Utilities
------------------------------------------------------------------ */
const isBrowser = typeof window !== "undefined";

const parseJSON = <T>(data: string | null, fallback: T): T => {
  try {
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    console.warn("⚠️ Failed to parse JSON data.");
    return fallback;
  }
};

const saveJSON = (key: string, value: any): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`❌ Failed to save key "${key}"`, err);
  }
};

/* ------------------------------------------------------------------
   🧱 Core Storage API
------------------------------------------------------------------ */
export const storage = {
  /** Save to localStorage */
  set<T>(key: string, value: T): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.debug(`💾 Saved [${key}]`, value);
    } catch (error) {
      console.error("❌ Error saving data:", error);
    }
  },

  /** Get from localStorage */
  get<T>(key: string, fallback: T | null = null): T | null {
    if (!isBrowser) return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : fallback;
    } catch (error) {
      console.error("❌ Error reading localStorage:", error);
      return fallback;
    }
  },

  /** Remove specific key */
  remove(key: string): void {
    if (!isBrowser) return;
    localStorage.removeItem(key);
    console.info(`🗑️ Removed key: ${key}`);
  },

  /** Clear all storage */
  clear(): void {
    if (!isBrowser) return;
    localStorage.clear();
    console.warn("🧹 LocalStorage cleared!");
  },

  /** Check key existence */
  has(key: string): boolean {
    if (!isBrowser) return false;
    return localStorage.getItem(key) !== null;
  },

  /** Add or update an item in an array (by id) */
  push<T extends { id: string }>(key: string, item: T): void {
    const data = storage.get<T[]>(key, []) || [];
    const existingIndex = data.findIndex((d) => d.id === item.id);
    if (existingIndex !== -1) data[existingIndex] = item;
    else data.push(item);
    storage.set(key, data);
  },

  /** Update existing record by ID */
  updateById<T extends { id: string }>(
    key: string,
    id: string,
    updated: Partial<T>
  ): void {
    const data = storage.get<T[]>(key, []) || [];
    const index = data.findIndex((d) => d.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updated };
      storage.set(key, data);
      console.log(`✏️ Updated record in ${key}`, data[index]);
    }
  },

  /** Delete by ID from array */
  deleteById<T extends { id: string }>(key: string, id: string): void {
    const data = storage.get<T[]>(key, []) || [];
    const filtered = data.filter((item) => item.id !== id);
    storage.set(key, filtered);
    console.log(`🗑️ Deleted record from ${key}`, id);
  },
};

/* ------------------------------------------------------------------
   🚀 Initialization Defaults
------------------------------------------------------------------ */
export const ensureInitialized = (): void => {
  if (!isBrowser) return;

  const defaults: Record<string, any> = {
    [STORAGE_KEYS.EQUIPMENT_MASTER_V1]: [],
    [STORAGE_KEYS.PREVENTIVE_MAINTENANCE_V1]: [],
    [STORAGE_KEYS.MAINTENANCE_TEAMS_V1]: [],
    [STORAGE_KEYS.BREAKDOWN_MAINTENANCE_V1]: [],
    [STORAGE_KEYS.EQUIPMENT_COSTING_V1]: [],
    [STORAGE_KEYS.MONITORING_REPORTS_V1]: [],
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (!localStorage.getItem(key)) {
      saveJSON(key, value);
      console.log(`🧩 Initialized key: ${key}`);
    }
  });

  console.info("✅ ERP LocalStorage initialized.");
};

/* ------------------------------------------------------------------
   🔄 Cross-tab Sync
------------------------------------------------------------------ */
if (isBrowser) {
  window.addEventListener("storage", (e) => {
    if (e.key && e.newValue) {
      console.log(`🔄 Cross-tab sync detected for key: ${e.key}`);
    }
  });
}



// /**
//  * storage.ts — Centralized LocalStorage Utility for ERP System
//  * Author: Vaibhav Agarwal
//  * Version: Stable 2025
//  */

// export const STORAGE_KEYS = {
//   // 🏭 Production & Planning
//   WORK_ORDERS: "WORK_ORDERS",
//   PLANNED_ORDERS: "PLANNED_ORDERS",
//   FORECASTS: "FORECASTS",
//   MPS_PLANS: "MPS_PLANS",
//   MRP_REQUIREMENTS: "MRP_REQUIREMENTS",
//   CRP_CAPACITY: "CRP_CAPACITY",

//   // ⚙️ Master Data
//   ITEMS: "ITEMS",
//   BOMS: "BOMS",
//   ROUTINGS: "ROUTINGS",
//   WORK_CENTERS: "WORK_CENTERS",
//   EMPLOYEES: "EMPLOYEES",
//   SUPPLIERS: "SUPPLIERS",
//   PRODUCTS: "PRODUCTS",
//   MATERIALS: "MATERIALS",
//   QUALITY_PARAMETERS: "QUALITY_PARAMETERS",

//   // 🧾 Production Execution
//   WORK_LOGS: "WORK_LOGS",
//   WORK_ORDER_AUDIT: "WORK_ORDER_AUDIT",
//   DOWNTIME_LOGS: "DOWNTIME_LOGS",
//   MAINTENANCE_REQUESTS: "MAINTENANCE_REQUESTS",
//   QUALITY_CHECKS: "QUALITY_CHECKS",

//   // 📦 Inventory & Material
//   INVENTORY: "INVENTORY",
//   INVENTORY_LEDGER: "INVENTORY_LEDGER",
//   WIP_INVENTORY: "WIP_INVENTORY",
//   ISSUE_SLIPS: "ISSUE_SLIPS",
//   MATERIAL_ISSUES: "MATERIAL_ISSUES",
//   PURCHASE_REQUESTS: "PURCHASE_REQUESTS",
//   PURCHASE_ORDERS: "PURCHASE_ORDERS",

//   // 💰 Finance
//   JOURNALS: "JOURNALS",
//   ACCOUNTS: "ACCOUNTS",
//   BUDGETS: "BUDGETS",
//   INVOICES: "INVOICES",
//   PAYMENTS: "PAYMENTS",
//   CASH_FLOW: "CASH_FLOW",
//   TRANSACTIONS: "TRANSACTIONS",

//   // 👨‍💼 HR
//   ATTENDANCE: "ATTENDANCE",

//   // 📊 Reports / Settings
//   REPORT_CACHE: "REPORT_CACHE",
//   SETTINGS: "SETTINGS",

//   // 🧠 Meta
//   AUDIT_LOGS: "AUDIT_LOGS",
//   STORAGE_VERSION: "STORAGE_VERSION",

//   // ⚙️ Custom Modules
//   EQUIPMENT_MASTER_V1: "equipment_master_v1",
//   EQUIPMENT_ALLOCATION_V1: "equipment_allocation_v1",
//   PREVENTIVE_MAINTENANCE_V1: "preventive_maintenance_v1",
//   BREAKDOWN_MAINTENANCE_V1: "breakdown_maintenance_v1",
//   MAINTENANCE_WORK_ORDERS_V1: "maintenance_work_orders_v1",
//   EQUIPMENT_COSTING_V1: "equipment_costing_v1",
//   SAFETY_COMPLIANCE_V1: "safety_compliance_v1",
//   MONITORING_REPORTS_V1: "monitoring_reports_v1",
//   ASSET_DISPOSAL_V1: "asset_disposal_v1",
//   ASSET_DISPOSAL_AUDIT_V1: "asset_disposal_audit_v1",
// } as const;

// /* ------------------------------------------------------------------
//    🔧 JSON Helpers
// ------------------------------------------------------------------ */
// const isBrowser = typeof window !== "undefined";

// const parseJSON = <T>(data: string | null, fallback: T): T => {
//   try {
//     return data ? (JSON.parse(data) as T) : fallback;
//   } catch {
//     console.warn("⚠️ Failed to parse localStorage data.");
//     return fallback;
//   }
// };

// const saveJSON = (key: string, value: any) => {
//   if (!isBrowser) return;
//   try {
//     localStorage.setItem(key, JSON.stringify(value));
//   } catch (e) {
//     console.error(`❌ Failed to save key "${key}":`, e);
//   }
// };

// const fetchJSON = <T>(key: string, fallback: T): T => {
//   if (!isBrowser) return fallback;
//   return parseJSON(localStorage.getItem(key), fallback);
// };

// /* ------------------------------------------------------------------
//    🧱 Core Storage API
// ------------------------------------------------------------------ */
// export const storage = {
//   /** Save to localStorage */
//   set<T>(key: string, value: T): void {
//     if (!isBrowser) return;
//     try {
//       localStorage.setItem(key, JSON.stringify(value));
//       console.log("Saving key:", key, "data:", value);
//     } catch (error) {
//       console.error("❌ Error saving to localStorage:", error);
//     }
//   },

//   /** Get from localStorage */
//   get<T>(key: string, fallback: T | null = null): T | null {
//     if (!isBrowser) return fallback;
//     try {
//       const data = localStorage.getItem(key);
//       return data ? (JSON.parse(data) as T) : fallback;
//     } catch (error) {
//       console.error("❌ Error reading localStorage:", error);
//       return fallback;
//     }
//   },

//   /** Remove a key */
//   remove(key: string): void {
//     if (!isBrowser) return;
//     localStorage.removeItem(key);
//   },

//   /** Clear all ERP data */
//   clear(): void {
//     if (!isBrowser) return;
//     localStorage.clear();
//   },
// };

// /* ------------------------------------------------------------------
//    🚀 Initialization & Sync
// ------------------------------------------------------------------ */
// export const ensureInitialized = () => {
//   if (typeof window === "undefined") return;

//   const defaults: Record<string, any> = {
//     [STORAGE_KEYS.EQUIPMENT_MASTER_V1]: [],
//     [STORAGE_KEYS.EQUIPMENT_ALLOCATION_V1]: [],
//     [STORAGE_KEYS.PREVENTIVE_MAINTENANCE_V1]: [],
//     [STORAGE_KEYS.BREAKDOWN_MAINTENANCE_V1]: [],
//     [STORAGE_KEYS.MAINTENANCE_WORK_ORDERS_V1]: [],
//     [STORAGE_KEYS.EQUIPMENT_COSTING_V1]: [],
//     [STORAGE_KEYS.SAFETY_COMPLIANCE_V1]: [],
//     [STORAGE_KEYS.MONITORING_REPORTS_V1]: [],
//   };

//   Object.entries(defaults).forEach(([key, value]) => {
//     if (localStorage.getItem(key) === null) {
//       localStorage.setItem(key, JSON.stringify(value));
//       console.log(`🧩 Initialized key: ${key}`);
//     }
//   });

//   console.info("✅ ERP LocalStorage initialized and verified.");
// };

// /* ------------------------------------------------------------------
//    🔄 Cross-tab Sync
// ------------------------------------------------------------------ */
// if (isBrowser) {
//   window.addEventListener("storage", (e) => {
//     if (e.key && e.newValue) {
//       console.log(`🔄 Synced key: ${e.key}`);
//     }
//   });
// }

// // /**
// //  * storage.ts — Centralized LocalStorage Utility for ERP System
// //  * Author: Vaibhav Agarwal
// //  */

// // export const STORAGE_KEYS = {
// //   // 🏭 Production & Planning
// //   WORK_ORDERS: "WORK_ORDERS",
// //   PLANNED_ORDERS: "PLANNED_ORDERS",
// //   FORECASTS: "FORECASTS",
// //   MPS_PLANS: "MPS_PLANS",
// //   MRP_REQUIREMENTS: "MRP_REQUIREMENTS",
// //   CRP_CAPACITY: "CRP_CAPACITY",

// //   // ⚙️ Master Data
// //   ITEMS: "ITEMS",
// //   BOMS: "BOMS",
// //   ROUTINGS: "ROUTINGS",
// //   WORK_CENTERS: "WORK_CENTERS",
// //   EMPLOYEES: "EMPLOYEES",
// //   SUPPLIERS: "SUPPLIERS",
// //   PRODUCTS: "PRODUCTS",
// //   MATERIALS: "MATERIALS",
// //   QUALITY_PARAMETERS: "QUALITY_PARAMETERS",

// //   // 🧾 Production Execution
// //   WORK_LOGS: "WORK_LOGS",
// //   WORK_ORDER_AUDIT: "WORK_ORDER_AUDIT",
// //   DOWNTIME_LOGS: "DOWNTIME_LOGS",
// //   MAINTENANCE_REQUESTS: "MAINTENANCE_REQUESTS",
// //   QUALITY_CHECKS: "QUALITY_CHECKS",

// //   // 📦 Inventory & Material
// //   INVENTORY: "INVENTORY",
// //   INVENTORY_LEDGER: "INVENTORY_LEDGER",
// //   WIP_INVENTORY: "WIP_INVENTORY",
// //   ISSUE_SLIPS: "ISSUE_SLIPS",
// //   MATERIAL_ISSUES: "MATERIAL_ISSUES",
// //   PURCHASE_REQUESTS: "PURCHASE_REQUESTS",
// //   PURCHASE_ORDERS: "PURCHASE_ORDERS",

// //   // 💰 Finance
// //   JOURNALS: "JOURNALS",
// //   ACCOUNTS: "ACCOUNTS",
// //   BUDGETS: "BUDGETS",
// //   INVOICES: "INVOICES",
// //   PAYMENTS: "PAYMENTS",
// //   CASH_FLOW: "CASH_FLOW",
// //   TRANSACTIONS: "TRANSACTIONS",

// //   // 👨‍💼 HR
// //   ATTENDANCE: "ATTENDANCE",

// //   // 📊 Reports / Settings
// //   REPORT_CACHE: "REPORT_CACHE",
// //   SETTINGS: "SETTINGS",

// //   // 🧠 Meta
// //   AUDIT_LOGS: "AUDIT_LOGS",
// //   STORAGE_VERSION: "STORAGE_VERSION",

// //   // ⚙️ Custom
// //   EQUIPMENT_MASTER_V1: "equipment_master_v1",
// //   EQUIPMENT_ALLOCATION_V1: "equipment_allocation_v1",
// //   PREVENTIVE_MAINTENANCE_V1: "preventive_maintenance_v1",
// //   BREAKDOWN_MAINTENANCE_V1: "breakdown_maintenance_v1",
// //   MAINTENANCE_WORK_ORDERS_V1: "maintenance_work_orders_v1",
// //   SPARE_PARTS_MASTER_V1: "spare_parts_master_v1",
// //   SPARE_PARTS_ISSUE_SLIPS_V1: "spare_parts_issue_slips_v1",
// //   EQUIPMENT_COSTING_V1: "equipment_costing_v1",
// //   SAFETY_COMPLIANCE_V1: "safety_compliance_v1",
// // } as const;

// // /* ------------------------------------------------------------------
// //    🔧 JSON Helpers
// // ------------------------------------------------------------------ */
// // const isBrowser = typeof window !== "undefined";

// // const parseJSON = <T>(data: string | null, fallback: T): T => {
// //   try {
// //     return data ? (JSON.parse(data) as T) : fallback;
// //   } catch {
// //     console.warn("⚠️ Failed to parse localStorage data.");
// //     return fallback;
// //   }
// // };

// // const saveJSON = (key: string, value: any) => {
// //   if (!isBrowser) return;
// //   try {
// //     localStorage.setItem(key, JSON.stringify(value));
// //   } catch (e) {
// //     console.error(`❌ Failed to save key "${key}":`, e);
// //   }
// // };

// // const fetchJSON = <T>(key: string, fallback: T): T => {
// //   if (!isBrowser) return fallback;
// //   return parseJSON(localStorage.getItem(key), fallback);
// // };

// // /* ------------------------------------------------------------------
// //    🧱 Core Storage API
// // ------------------------------------------------------------------ */
// // // ✅ Fully Working storage.ts for Next.js (Client-side guaranteed)

// // export const storage = {
// //   // --- Save to localStorage ---
// //   set<T>(key: string, value: T): void {
// //     if (typeof window === "undefined") {
// //       console.warn("storage.set skipped (not in browser)");
// //       return;
// //     }
// //     try {
// //       const json = JSON.stringify(value);
// //       localStorage.setItem(key, json);
// //       console.log(`✅ Saved to localStorage [${key}]`, value);
// //     } catch (error) {
// //       console.error("❌ Error saving to localStorage:", error);
// //     }
// //   },

// //   // --- Get from localStorage ---
// //   get<T>(key: string, fallback: T | null = null): T | null {
// //     if (typeof window === "undefined") {
// //       console.warn("storage.get skipped (not in browser)");
// //       return fallback;
// //     }
// //     try {
// //       const data = localStorage.getItem(key);
// //       if (!data) {
// //         console.log(`⚠️ No data found for key: ${key}`);
// //         return fallback;
// //       }
// //       const parsed = JSON.parse(data) as T;
// //       console.log(`📦 Loaded from localStorage [${key}]`, parsed);
// //       return parsed;
// //     } catch (error) {
// //       console.error("❌ Error reading localStorage:", error);
// //       return fallback;
// //     }
// //   },

// //   // --- Remove a specific key ---
// //   remove(key: string): void {
// //     if (typeof window === "undefined") return;
// //     try {
// //       localStorage.removeItem(key);
// //       console.log(`🗑️ Removed key from localStorage: ${key}`);
// //     } catch (error) {
// //       console.error("❌ Error removing from localStorage:", error);
// //     }
// //   },

// //   // --- Clear all keys (be careful!) ---
// //   clear(): void {
// //     if (typeof window === "undefined") return;
// //     try {
// //       localStorage.clear();
// //       console.log("🧹 Cleared all localStorage data");
// //     } catch (error) {
// //       console.error("❌ Error clearing localStorage:", error);
// //     }
// //   },
// // };

// // // ✅ Sync across browser tabs
// // if (typeof window !== "undefined") {
// //   window.addEventListener("storage", (e) => {
// //     if (e.key) {
// //       console.log(`🔄 Detected storage update for key: ${e.key}`);
// //     }
// //   });
// // }

// // /* ------------------------------------------------------------------
// //    🏗️ Initialization & Defaults
// // ------------------------------------------------------------------ */
// // export const initializeStorage = () => {
// //   if (!isBrowser) return;

// //   const defaults: Record<string, any> = {
// //     [STORAGE_KEYS.WORK_ORDERS]: [],
// //     [STORAGE_KEYS.PLANNED_ORDERS]: [],
// //     [STORAGE_KEYS.MRP_REQUIREMENTS]: [],
// //     [STORAGE_KEYS.EQUIPMENT_MASTER_V1]: [],
// //     [STORAGE_KEYS.EQUIPMENT_ALLOCATION_V1]: [],
// //     [STORAGE_KEYS.PREVENTIVE_MAINTENANCE_V1]: [],
// //     [STORAGE_KEYS.BREAKDOWN_MAINTENANCE_V1]: [],
// //     [STORAGE_KEYS.MAINTENANCE_WORK_ORDERS_V1]: [],
// //     [STORAGE_KEYS.SPARE_PARTS_ISSUE_SLIPS_V1]: [],
// //     [STORAGE_KEYS.SPARE_PARTS_MASTER_V1]: [],
// //     [STORAGE_KEYS.EQUIPMENT_COSTING_V1]: [],
// //     [STORAGE_KEYS.SAFETY_COMPLIANCE_V1]: [],

// //   };

// //   Object.entries(defaults).forEach(([key, value]) => {
// //     if (localStorage.getItem(key) === null) {
// //       localStorage.setItem(key, JSON.stringify(value));
// //     }
// //   });

// //   console.info("✅ LocalStorage initialized for ERP system.");
// // };

// // // ✅ Ensure all ERP storage keys exist on load
// // export const ensureInitialized = () => {
// //   if (typeof window === "undefined") return;

// //   try {
// //     const keysToInit = [
// //       STORAGE_KEYS.SAFETY_COMPLIANCE_V1,
// //       STORAGE_KEYS.EQUIPMENT_MASTER_V1,
// //       STORAGE_KEYS.EQUIPMENT_ALLOCATION_V1,
// //       STORAGE_KEYS.PREVENTIVE_MAINTENANCE_V1,
// //       STORAGE_KEYS.BREAKDOWN_MAINTENANCE_V1,
// //       STORAGE_KEYS.MAINTENANCE_WORK_ORDERS_V1,
// //       STORAGE_KEYS.EQUIPMENT_COSTING_V1,
// //     ];

// //     keysToInit.forEach((key) => {
// //       if (localStorage.getItem(key) === null) {
// //         localStorage.setItem(key, JSON.stringify([]));
// //       }
// //     });

// //     console.log("✅ ERP LocalStorage verified & ready");
// //   } catch (e) {
// //     console.error("❌ Error initializing storage:", e);
// //   }
// // };
