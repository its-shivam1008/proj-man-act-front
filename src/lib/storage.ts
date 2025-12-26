// Updated storage.ts
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
  DOWNTIME_EVENTS: "DOWNTIME_EVENTS",
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
  RECEIPTS: "RECEIPTS",
  DELIVERIES: "DELIVERIES",
  SCRAP_ORDERS: "SCRAP_ORDERS",
  FORECAST_ITEMS: "FORECAST_ITEMS",
  STOCK_REPORTS: "STOCK_REPORTS",
  STOCK_MOVES: "STOCK_MOVES",
  MOVES_ANALYSIS: "MOVES_ANALYSIS",
  VALUATION: "VALUATION",
  RFQS: "RFQS",
  PURCHASE_AGREEMENTS: "PURCHASE_AGREEMENTS",
  VENDORS: "VENDORS",

  // 🛠️ Product Lifecycle
  ENGINEERING_CHANGE_ORDERS: "ENGINEERING_CHANGE_ORDERS",
  BOM_VERSIONS: "BOM_VERSIONS",
  PRODUCT_DOCUMENTS: "PRODUCT_DOCUMENTS",
  ENGINEERING_TEAMS: "ENGINEERING_TEAMS",
  ECO_COMMENTS: "ECO_COMMENTS",

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

  // 🛡️ Quality Management
  QUALITY_CONTROL_POINTS: "QUALITY_CONTROL_POINTS",
  QUALITY_ALERTS: "QUALITY_ALERTS",
  QUALITY_TEAMS: "QUALITY_TEAMS",
  QUALITY_TAGS: "QUALITY_TAGS",

  // 🔧 Repair Management
  REPAIR_ORDERS_DETAILED: "REPAIR_ORDERS_DETAILED",
  REPAIR_TEAMS: "REPAIR_TEAMS",
  REPAIR_TEMPLATES: "REPAIR_TEMPLATES",

  // 📱 Barcode Management
  BARCODE_SCANS: "BARCODE_SCANS",
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
  push<T extends { id: string | number }>(key: string, item: T): void {
    let data = storage.get<T[]>(key, []) || [];
    if (!Array.isArray(data)) {
      data = [];
    }
    const existingIndex = data.findIndex((d) => d.id === item.id);
    if (existingIndex !== -1) data[existingIndex] = item;
    else data.push(item);
    storage.set(key, data);
  },

  /** Update existing record by ID */
  updateById<T extends { id: string | number }>(
    key: string,
    id: string | number,
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
  deleteById<T extends { id: string | number }>(key: string, id: string | number): void {
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
    [STORAGE_KEYS.RECEIPTS]: [],
    [STORAGE_KEYS.DELIVERIES]: [],
    [STORAGE_KEYS.SCRAP_ORDERS]: [],
    [STORAGE_KEYS.FORECAST_ITEMS]: [],
    [STORAGE_KEYS.STOCK_REPORTS]: [],
    [STORAGE_KEYS.STOCK_MOVES]: [],
    [STORAGE_KEYS.MOVES_ANALYSIS]: [
      {
        id: 'MA-001',
        product: 'Steel Plates',
        demand: 150,
        snLots: 5,
        packagingQty: 50,
        quantity: 250,
        realQuantity: 245,
        unitPrice: 150.00,
        inboundTrend: 'up',
        outboundTrend: 'stable',
        turnoverRate: 2.5
      },
      {
        id: 'MA-002',
        product: 'Aluminum Rods',
        demand: 80,
        snLots: 3,
        packagingQty: 25,
        quantity: 45,
        realQuantity: 43,
        unitPrice: 75.00,
        inboundTrend: 'down',
        outboundTrend: 'up',
        turnoverRate: 1.8
      },
      {
        id: 'MA-003',
        product: 'Hydraulic Pumps',
        demand: 25,
        snLots: 2,
        packagingQty: 5,
        quantity: 0,
        realQuantity: 0,
        unitPrice: 500.00,
        inboundTrend: 'stable',
        outboundTrend: 'down',
        turnoverRate: 0.0
      }
    ],
    [STORAGE_KEYS.VALUATION]: [
      {
        id: 'VAL-001',
        date: '2024-01-15',
        reference: 'REC-001',
        product: 'Steel Plates',
        quantity: 250,
        unitValue: 150.00,
        totalValue: 37500.00,
        method: 'FIFO',
        notes: ''
      },
      {
        id: 'VAL-002',
        date: '2024-01-14',
        reference: 'DEL-001',
        product: 'Hydraulic Pumps',
        quantity: -15,
        unitValue: 500.00,
        totalValue: -7500.00,
        method: 'LIFO',
        notes: ''
      },
      {
        id: 'VAL-003',
        date: '2024-01-13',
        reference: 'ADJ-001',
        product: 'Aluminum Rods',
        quantity: 5,
        unitValue: 75.00,
        totalValue: 375.00,
        method: 'Average Cost',
        notes: ''
      }
    ],
    [STORAGE_KEYS.RFQS]: [],
    [STORAGE_KEYS.PURCHASE_ORDERS]: [],
    [STORAGE_KEYS.PURCHASE_AGREEMENTS]: [
      {
        id: 1,
        agreementNumber: 'PA-2024-001',
        vendor: 'Steel Corp Ltd',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalValue: 50000,
        status: 'active',
        terms: 'Annual supply of steel materials at fixed rates',
        notes: 'Volume commitment: 100 tons'
      },
      {
        id: 2,
        agreementNumber: 'PA-2024-002',
        vendor: 'Aluminum Co',
        startDate: '2024-03-01',
        endDate: '2025-02-28',
        totalValue: 30000,
        status: 'active',
        terms: 'Quarterly deliveries with price adjustments',
        notes: 'Preferred supplier for alloys'
      }
    ],
    [STORAGE_KEYS.VENDORS]: [],
    [STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS]: [],
    [STORAGE_KEYS.BOM_VERSIONS]: [],
    [STORAGE_KEYS.PRODUCT_DOCUMENTS]: [],
    [STORAGE_KEYS.ENGINEERING_TEAMS]: [],
    [STORAGE_KEYS.ECO_COMMENTS]: [],

    // 🛡️ Quality Management Defaults
    [STORAGE_KEYS.QUALITY_CHECKS]: [],
    [STORAGE_KEYS.QUALITY_CONTROL_POINTS]: [],
    [STORAGE_KEYS.QUALITY_ALERTS]: [],
    [STORAGE_KEYS.QUALITY_TEAMS]: [],
    [STORAGE_KEYS.QUALITY_TAGS]: [],

    // 🔧 Repair Management Defaults
    [STORAGE_KEYS.REPAIR_ORDERS_DETAILED]: [],
    [STORAGE_KEYS.REPAIR_TEAMS]: [
      {
        id: 'TEAM-001',
        teamName: 'Primary Repair Team',
        teamLead: 'John Doe',
        location: 'Repair Center A',
        workingHours: { start: '08:00', end: '17:00' },
        contactInfo: { email: 'primary@repair.com', phone: '+1-555-0101' },
        members: [
          {
            technicianId: 'TECH-001',
            name: 'Alice Johnson',
            hourlyRate: 75,
            availability: 'available',
            skills: ['Electronics', 'Mechanical']
          },
          {
            technicianId: 'TECH-002',
            name: 'Bob Smith',
            hourlyRate: 85,
            availability: 'busy',
            skills: ['Hydraulics', 'Welding']
          }
        ]
      },
      {
        id: 'TEAM-002',
        teamName: 'Specialist Team',
        teamLead: 'Jane Roe',
        location: 'Repair Center B',
        workingHours: { start: '09:00', end: '18:00' },
        contactInfo: { email: 'specialist@repair.com', phone: '+1-555-0202' },
        members: [
          {
            technicianId: 'TECH-003',
            name: 'Charlie Brown',
            hourlyRate: 95,
            availability: 'available',
            skills: ['Advanced Electronics']
          }
        ]
      }
    ],
    [STORAGE_KEYS.REPAIR_TEMPLATES]: [
      {
        id: 'TPL-001',
        templateName: 'Standard Electronics Repair',
        productCategory: 'Electronics',
        commonIssue: 'Circuit Board Failure',
        estimatedDuration: 4,
        defaultParts: ['Resistor Kit', 'Capacitor', 'Solder'],
        isActive: true
      },
      {
        id: 'TPL-002',
        templateName: 'Mechanical Adjustment',
        productCategory: 'Mechanical',
        commonIssue: 'Alignment Issue',
        estimatedDuration: 2,
        defaultParts: ['Lubricant', 'Adjustment Tool'],
        isActive: true
      }
    ],

    // 📱 Barcode Management Defaults
    [STORAGE_KEYS.BARCODE_SCANS]: [
      { id: 1, code: 'SP-001-2024', item: 'Steel Plates', action: 'Stock Update', timestamp: '2024-01-15 10:30', status: 'success' },
      { id: 2, code: 'AR-002-2024', item: 'Aluminum Rods', action: 'Inventory Check', timestamp: '2024-01-15 09:15', status: 'success' },
      { id: 3, code: 'HP-003-2024', item: 'Hydraulic Pumps', action: 'Shipping', timestamp: '2024-01-14 16:45', status: 'warning' },
    ],
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