import { configureStore } from "@reduxjs/toolkit";
import ecoReducer from "./slices/ecoSlice";
import authReducer from "./slices/authSlice";
import projectReducer from "./slices/projectSlice";
import wbsReducer from "./slices/wbsSlice";
import resourceReducer from "./slices/resourceSlice";
import manpowerReducer from "./slices/manpowerSlice";
import materialReducer from "./slices/materialSlice";
import budgetReducer from "./slices/budgetSlice";
import mrsReducer from "./slices/mrsSlice";
import prReducer from "./slices/prSlice";
import poReducer from "./slices/prSlice";
import billingReducer from "./slices/billingSlice";
import dailyProgressReducer from "./slices/dailyProgressSlice";
import warehouseReducer from "./slices/warehouseSlice";
import storageReducer from "./slices/storageSlice";
import productsReducer from "./slices/productSlice";
import rawMaterialReducer from "./slices/rawmaterialSlice";
import stockReportReducer from "./slices/stockReportSlice";
import inventoryHistoryReducer from "./slices/inventoryHistorySlice";
import movesAnalysisReducer from "./slices/movesAnalysisSlice";
import valuationReducer from "./slices/valuationSlice";
import receiptReducer from "./slices/receiptSlice";
import deliveryReducer from "./slices/deliverySlice";
import scrapOrderReducer from "./slices/scrapOrderSlice";
import forecastReducer from "./slices/forecastSlice";
import vendorReducer from "./slices/purchase/vendorSlice";
import rfqReducer from "./slices/purchase/rfqSlice";
import purchaseOrderReducer from "./slices/purchase/purchaseOrderSlice";
import purchaseAgreementReducer from "./slices/purchase/purchaseAgreementSlice";
import notificationReducer from "./slices/notificationSlice"
import masterDataReducer from "./slices/masterDataSlice";
import equipmentReducer from "./slices/equipmentSlice";
import activityCostReducer from "./slices/activityCostSlice";
import machineryReducer from "./slices/plantandmachinary/machinerySlice";
import preventiveMaintenanceReducer from "./slices/plantandmachinary/preventiveMaintenanceSlice";
import calibrationSafetyReducer from "./slices/plantandmachinary/calibrationSafetySlice";
import equipmentAllocationReducer from "./slices/plantandmachinary/equipmentAllocationSlice";
import inventoryMasterReducer from "./slices/inventoryMasterSlice";
import materialMovementReducer from "./slices/materialMovementSlice";
import materialRequestReducer from "./slices/materialRequestSlice";
import rackReducer from './slices/rackSlice'
import shelfReducer from './slices/shelfSlice'
import reminderReducer from "./slices/reminderSlice";
import bomReducer from "./slices/production/bomSlice";
import workOrderReducer from "./slices/production/workOrderSlice";
import sparePartsReducer from "./slices/plantandmachinary/sparePartsSlice";
import materialIssueReducer from "./slices/production/materialIssueSlice";
import itemMasterReducer from "./slices/production/itemMasterSlice";
import ppcReducer from "./slices/production/ppcSlice";
import grnReducer from "./slices/production/grnSlice";
import qualityReducer from "./slices/production/qualitySlice";
import costingPerformanceReducer from "./slices/production/costingPerformanceSlice";
import workCenterReducer from "./slices/production/workCenterSlice";
import productionExecutionReducer from "./slices/production/productionExecutionSlice";
import productionReportingReducer from "./slices/production/productionReportingSlice";
import downtimeAnalysisReducer from "./slices/production/downtimeAnalysisSlice";
import productionEfficiencyReducer from "./slices/production/productionEfficiencySlice";
import orderProgressReducer from "./slices/production/orderProgressSlice";
import repairOrders from "./slices/repairOrderSlice";
import repairTeams from "./slices/repairTeamSlice";
import repairTemplates from "./slices/repairTemplateSice";
import barcodeReducer from './slices/barcodeSlice'
import qualityMReducer from "./slices/qualitySliceManagement";
import qualityCheckReducer from "./slices/qualityCheckSlice";
import controlPointReducer from "./slices/controlPointSlice";
import qualityAlertReducer from "./slices/qualityAlertSlice";
import qualityTeamReducer from "./slices/qualityTeamSlice";
import qualityTagReducer from "./slices/qualityTagSlice";
import documentReducer from "./slices/documentSlice";
import purchaseDashboardReducer from "./slices/purchase/purchaseDashboardSlice";
import teamReducer from "./slices/teamSlice";
import routingReducer from "./slices/production/routingSlice";
import wbsBillReducer from './slices/wbsBillSlice'
import batchReducer from "@/redux/slices/production/batchSlice";
import chatReducer from "@/redux/slices/production/chatSlice";
import notificationSidebarReducer from "@/redux/slices/notificationSidebarSlice"
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    notifications: notificationSidebarReducer,
    batch: batchReducer, 
    wbsBill:wbsBillReducer,
    routing: routingReducer,
    teams: teamReducer,
    documents: documentReducer,
    ecos: ecoReducer,
    purchaseDashboard: purchaseDashboardReducer,
    itemMaster: itemMasterReducer,
    auth: authReducer,
    projects: projectReducer,
    wbs: wbsReducer,
    resources: resourceReducer,
    manpower: manpowerReducer,
    materials: materialReducer,
    budget: budgetReducer,
    mrs: mrsReducer,
    pr: prReducer,
    po: poReducer,
    dailyProgress: dailyProgressReducer,
    billing: billingReducer,
    warehouse: warehouseReducer,
    storages: storageReducer,
    products: productsReducer,
    rawMaterials: rawMaterialReducer,
    stockReports: stockReportReducer,
    inventoryHistory: inventoryHistoryReducer,
    movesAnalysis: movesAnalysisReducer,
    valuations: valuationReducer,
    receipts: receiptReducer,
    delivery: deliveryReducer,
    scrap: scrapOrderReducer,
    forecast: forecastReducer,
    vendors: vendorReducer,
    rfqs: rfqReducer,
    purchaseOrders: purchaseOrderReducer,
    purchaseAgreements: purchaseAgreementReducer,
    notification: notificationReducer,
    masterData: masterDataReducer,
    equipment: equipmentReducer,
    activityCost: activityCostReducer,
    machinery: machineryReducer,
    preventiveMaintenance: preventiveMaintenanceReducer,
    calibrationSafety: calibrationSafetyReducer,
    equipmentAllocation: equipmentAllocationReducer,
    inventoryMaster: inventoryMasterReducer,
    materialMovement: materialMovementReducer,
    materialRequests: materialRequestReducer,
    rack: rackReducer,
    shelf: shelfReducer,
    reminders: reminderReducer,
    bom: bomReducer,
    workOrders: workOrderReducer,
    spareParts: sparePartsReducer,
    materialIssue: materialIssueReducer,
    ppc: ppcReducer,
    grn: grnReducer,
    quality: qualityReducer,
    costingPerformance: costingPerformanceReducer,
    workCenters: workCenterReducer,
    productionExecution: productionExecutionReducer,
    productionReporting: productionReportingReducer,
    downtimeAnalysis: downtimeAnalysisReducer,
    productionEfficiency: productionEfficiencyReducer,
    orderProgress: orderProgressReducer,
    repairOrders,
    repairTeams,
    repairTemplates,
    barcode: barcodeReducer,
    qualityM: qualityMReducer,
    qualityChecks: qualityCheckReducer,
    controlPoints: controlPointReducer,
    qualityAlerts: qualityAlertReducer,
    qualityTeams: qualityTeamReducer,
    qualityTags: qualityTagReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

