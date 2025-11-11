/**
 * storage.tsx — Centralized LocalStorage Utility for ERP System
 *
 * ✅ Supports all ERP modules:
 *   - Production, Planning, PPC
 *   - Work Orders / Manufacturing Execution
 *   - Inventory / Material Issue
 *   - Quality / Finance / HR / Reporting
 *
 * ⚙️ Features:
 *   - Safe JSON parsing
 *   - Type-safe CRUD operations
 *   - Auto initialization of missing keys
 *   - Audit trail logging
 *   - Data export & import for backups
 *
 * Author: Vaibhav Agarwal
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

  // 📦 Material Issue & Inventory
  INVENTORY: "INVENTORY",
  INVENTORY_LEDGER: "INVENTORY_LEDGER",
  WIP_INVENTORY: "WIP_INVENTORY",
  ISSUE_SLIPS: "ISSUE_SLIPS",
  MATERIAL_ISSUES: "MATERIAL_ISSUES",
  PURCHASE_REQUESTS: "PURCHASE_REQUESTS",
  PURCHASE_ORDERS: "PURCHASE_ORDERS",

  // 🧰 Quality Inspection & Control
  QUALITY_PLANS: "QUALITY_PLANS",
  INSPECTIONS: "INSPECTIONS",
  NCR_REPORTS: "NCR_REPORTS",
  CAPA_ACTIONS: "CAPA_ACTIONS",

  // 💰 Finance & Accounting
  JOURNALS: "JOURNALS",
  ACCOUNTS: "ACCOUNTS",
  BUDGETS: "BUDGETS",
  INVOICES: "INVOICES",
  PAYMENTS: "PAYMENTS",
  CASH_FLOW: "CASH_FLOW",
  TRANSACTIONS: "TRANSACTIONS",

  // 👨‍💼 HR & Attendance
  ATTENDANCE: "ATTENDANCE",

  // 📊 Reporting & Settings
  REPORT_CACHE: "REPORT_CACHE",
  SETTINGS: "SETTINGS",

  // 🧠 Meta / System
  AUDIT_LOGS: "AUDIT_LOGS",
  STORAGE_VERSION: "STORAGE_VERSION",
} as const;

/* ------------------------------------------------------------------
   🔧 JSON Utility Helpers
------------------------------------------------------------------ */

const isBrowser = typeof window !== "undefined";

const parseJSON = <T,>(data: string | null, fallback: T): T => {
  try {
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    console.warn("⚠️ Failed to parse localStorage data.");
    return fallback;
  }
};

const saveJSON = (key: string, value: any) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`❌ Failed to save key "${key}":`, e);
  }
};

const fetchJSON = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  return parseJSON(localStorage.getItem(key), fallback);
};

/* ------------------------------------------------------------------
   🧱 Core Storage API
------------------------------------------------------------------ */

export const storage = {
  get<T>(key: string, fallback: T): T {
    return fetchJSON(key, fallback);
  },

  set<T>(key: string, value: T) {
    saveJSON(key, value);
  },

  push<T = any>(key: string, item: T) {
    const list = fetchJSON<T[]>(key, []);
    list.push(item);
    saveJSON(key, list);
  },

  update<T = any>(
    key: string,
    id: string,
    newData: Partial<T>,
    matchField: keyof T = "id" as keyof T
  ) {
    const list = fetchJSON<T[]>(key, []);
    const updated = list.map((item) =>
      (item as any)[matchField] === id ? { ...item, ...newData } : item
    );
    saveJSON(key, updated);
  },

  remove<T = any>(key: string, id: string, matchField: keyof T = "id" as keyof T) {
    const list = fetchJSON<T[]>(key, []);
    const filtered = list.filter((item) => (item as any)[matchField] !== id);
    saveJSON(key, filtered);
  },

  clear(key: string) {
    if (isBrowser) localStorage.removeItem(key);
  },

  resetAll() {
    if (!isBrowser) return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    console.warn("🧹 All ERP localStorage data cleared.");
  },

  ensure<T = any>(key: string, defaultValue: T): T {
    const existing = fetchJSON<T>(key, null as any);
    if (existing === null || existing === undefined) {
      saveJSON(key, defaultValue);
      return defaultValue;
    }
    return existing;
  },

  updateArray<T extends { id: string }>(key: string, record: T) {
    const arr = fetchJSON<T[]>(key, []);
    const idx = arr.findIndex((x) => x.id === record.id);
    if (idx >= 0) arr[idx] = record;
    else arr.push(record);
    saveJSON(key, arr);
  },
};

/* ------------------------------------------------------------------
   🏗️ Initialization & Default Schema
------------------------------------------------------------------ */

export const initializeStorage = () => {
  if (!isBrowser) return;

  const defaults: Record<string, any> = {
    [STORAGE_KEYS.WORK_ORDERS]: [],
    [STORAGE_KEYS.PLANNED_ORDERS]: [],
    [STORAGE_KEYS.FORECASTS]: [],
    [STORAGE_KEYS.MPS_PLANS]: [],
    [STORAGE_KEYS.MRP_REQUIREMENTS]: [],
    [STORAGE_KEYS.CRP_CAPACITY]: [],
    [STORAGE_KEYS.WORK_CENTERS]: [],
    [STORAGE_KEYS.ROUTINGS]: [],
    [STORAGE_KEYS.BOMS]: [],
    [STORAGE_KEYS.ITEMS]: [],
    [STORAGE_KEYS.EMPLOYEES]: [],
    [STORAGE_KEYS.SUPPLIERS]: [],
    [STORAGE_KEYS.PRODUCTS]: [],
    [STORAGE_KEYS.MATERIALS]: [],
    [STORAGE_KEYS.QUALITY_PARAMETERS]: [],
    [STORAGE_KEYS.QUALITY_CHECKS]: [],
    [STORAGE_KEYS.WORK_LOGS]: [],
    [STORAGE_KEYS.WORK_ORDER_AUDIT]: [],
    [STORAGE_KEYS.DOWNTIME_LOGS]: [],
    [STORAGE_KEYS.MAINTENANCE_REQUESTS]: [],
    [STORAGE_KEYS.INVENTORY]: {},
    [STORAGE_KEYS.INVENTORY_LEDGER]: [],
    [STORAGE_KEYS.WIP_INVENTORY]: {},
    [STORAGE_KEYS.ISSUE_SLIPS]: [],
    [STORAGE_KEYS.MATERIAL_ISSUES]: [],
    [STORAGE_KEYS.PURCHASE_REQUESTS]: [],
    [STORAGE_KEYS.PURCHASE_ORDERS]: [],
    [STORAGE_KEYS.QUALITY_PLANS]: [],
    [STORAGE_KEYS.INSPECTIONS]: [],
    [STORAGE_KEYS.NCR_REPORTS]: [],
    [STORAGE_KEYS.CAPA_ACTIONS]: [],
    [STORAGE_KEYS.JOURNALS]: [],
    [STORAGE_KEYS.ACCOUNTS]: [],
    [STORAGE_KEYS.BUDGETS]: [],
    [STORAGE_KEYS.INVOICES]: [],
    [STORAGE_KEYS.PAYMENTS]: [],
    [STORAGE_KEYS.CASH_FLOW]: [],
    [STORAGE_KEYS.TRANSACTIONS]: [],
    [STORAGE_KEYS.ATTENDANCE]: [],
    [STORAGE_KEYS.REPORT_CACHE]: {},
    [STORAGE_KEYS.SETTINGS]: {},
    [STORAGE_KEYS.AUDIT_LOGS]: [],
    [STORAGE_KEYS.STORAGE_VERSION]: "v2.1",
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });

  console.info("✅ ERP localStorage initialized successfully (v2.1)");
};

/* ------------------------------------------------------------------
   🧠 Audit Trail Logger
------------------------------------------------------------------ */

export const logAudit = (action: string, details?: any) => {
  const entry = {
    id: `audit_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    details,
  };
  storage.push(STORAGE_KEYS.AUDIT_LOGS, entry);
};

/* ------------------------------------------------------------------
   💾 Data Export / Import
------------------------------------------------------------------ */

export const exportAllData = () => {
  const dump: Record<string, any> = {};
  Object.values(STORAGE_KEYS).forEach((key) => {
    dump[key] = parseJSON(localStorage.getItem(key), null);
  });

  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importAllData = async (file: File) => {
  const text = await file.text();
  const parsed = parseJSON<Record<string, any>>(text, {});
  Object.entries(parsed).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  console.info("📦 ERP data restored successfully from backup.");
};
