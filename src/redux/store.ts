import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import projectReducer from "./slices/projectSlice";
import wbsReducer from "./slices/wbsSlice";
import resourceReducer from "./slices/resourceSlice";
import manpowerReducer from "./slices/manpowerSlice";
import materialReducer from "./slices/materialSlice";
import equipmentReducer from "./slices/equipmentSlice";
import budgetReducer from "./slices/budgetSlice";
import mrsReducer from "./slices/mrsSlice";
import prReducer from "./slices/prSlice";
import poReducer from "./slices/prSlice";
import billingReducer from "./slices/billingSlice";
import dailyProgressReducer from "./slices/dailyProgressSlice";
import warehouseReducer from "./slices/warehouseSlice";
import storageReducer from "./slices/storageSlice";
import productsReducer from "./slices/productSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    wbs: wbsReducer,
    resources: resourceReducer,
    manpower: manpowerReducer,
    materials: materialReducer,
    equipment: equipmentReducer,
    budget: budgetReducer,
    mrs: mrsReducer,
    pr: prReducer,
    po: poReducer,
    dailyProgress: dailyProgressReducer,
    billing: billingReducer,
    warehouse: warehouseReducer,
    storages: storageReducer,
    products: productsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
