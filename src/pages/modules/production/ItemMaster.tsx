import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Package, Search, TrendingUp, RefreshCcw, ShieldAlert, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import type { RootState, AppDispatch } from "@/redux/store";
import { Pagination } from "@/components/ui/pagination";

import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
} from "@/redux/slices/production/itemMasterSlice";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Local Storage Helpers ---


const getStorage = <T,>(key: string, def: T): T => {
  if (typeof window === "undefined") return def;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : def;
  } catch {
    return def;
  }
};
const setStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// --- Type ---
interface ItemMaster {
  id: string;
  itemCode: string;
  itemName: string;
  description: string;
  type: "raw" | "semi-finished" | "finished";
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
  standardCost: number;
  location: string;
  createdAt: string;
  updatedAt?: string;
}

// --- Component ---
export default function ItemMaster() {

  const dispatch = useDispatch();
  const { locations = [] } = useSelector((state: any) => state.masterData);
  
  // ✅ LOCATION FILTERING STATE
  const { userProfile } = useSelector((state: RootState) => state.auth);

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  const { list: items, loading, pagination } = useSelector(
    (state: RootState) => state.itemMaster
  );
  const organisationId = localStorage.getItem("organisationId");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  // ✅ LOCATION FILTERING STATE - Initialize properly for restricted users
  const [locationFilter, setLocationFilter] = useState<string>(() => {
    const isRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
    return isRestricted ? userProfile.location : "all";
  });

  const canView = usePermission("itemMaster", "view");
  const canCreate = usePermission("itemMaster", "create");
  const canEdit = usePermission("itemMaster", "edit");
  const canDelete = usePermission("itemMaster", "delete");
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);
  const [formData, setFormData] = useState<Partial<ItemMaster>>({
    itemCode: "",
    itemName: "",
    description: "",
    type: "raw",
    unit: "pcs",
    stockQuantity: 0,
    reorderLevel: 0,
    standardCost: 0,
    location: "",
  });

  // Load data with pagination
  useEffect(() => {
    if (!organisationId) return;

    dispatch(
      fetchItems({
        organisationId,
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        location: locationFilter !== "all" ? locationFilter : undefined,
      })
    );

    dispatch(fetchMasterData("location"));
  }, [dispatch, organisationId, currentPage, itemsPerPage, searchTerm, locationFilter]);

  // Auto-set location filter for restricted users (backup in case initial state didn't work)
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location && locationFilter === "all") {
      console.log("ItemMaster: Setting location filter for restricted user:", userProfile.location);
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile, locationFilter]);


  // Derived Stats
  const totalItems = pagination.total || 0;
  const lowStockCount = items?.filter((i) => i.stockQuantity <= i.reorderLevel).length || 0;
  const totalInventoryValue = items
    ?.reduce((sum, i) => sum + i.stockQuantity * i.standardCost, 0)
    ?.toFixed(2) || "0.00";

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Location filter handler
  const handleLocationFilterChange = (location: string) => {
    setLocationFilter(location);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Remove the filtered items logic since we're using server-side pagination
  // const filteredItems = useMemo(() => {
  //   return items?.filter(
  //     (i) =>
  //       i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       i.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  // }, [searchTerm, items]);

  // CRUD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itemCode || !formData.itemName) {
      toast.error("Item Code and Name are required");
      return;
    }

    if (!organisationId) {
      toast.error("Organisation not found. Please login again.");
      return;
    }

    try {
      if (editingItem) {
        await dispatch(
          updateItem({
            id: editingItem._id,
            data: {
              ...formData,
              organisationId,
            },
          })
        ).unwrap();

        toast.success("Item updated");
      } else {
        await dispatch(
          createItem({
            ...formData,
            organisationId,
          })
        ).unwrap();

        toast.success("Item created");
      }

      resetForm();
      // Refresh current page data
      dispatch(
        fetchItems({
          organisationId,
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          location: locationFilter !== "all" ? locationFilter : undefined,
        })
      );

    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    }
  };



  // if (editingItem && !canEdit) {
  //   return (
  //     <p className="text-center text-red-600 py-6">
  //       You do not have permission to edit items.
  //     </p>
  //   );
  // }

  // // Create mode — need CREATE
  // if (!editingItem && !canCreate) {
  //   return (
  //     <p className="text-center text-red-600 py-6">
  //       You do not have permission to create items.
  //     </p>
  //   );
  // }

  const handleEdit = (item: ItemMaster) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = async (_id: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      await dispatch(deleteItem(_id)).unwrap();
      toast.success("Item deleted");
    } catch {
      toast.error("Delete failed");
    }
  };



  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({
      itemCode: "",
      itemName: "",
      description: "",
      type: "raw",
      unit: "pcs",
      stockQuantity: 0,
      reorderLevel: 0,
      standardCost: 0,
      location: "",
    });
  };

  const resetAll = () => {
    setSearchTerm("");
    setLocationFilter("all");
    setCurrentPage(1);
    dispatch(fetchItems({ 
      organisationId, 
      page: 1, 
      limit: itemsPerPage, 
      search: "",
      location: undefined
    }));
  };

  const getLocationName = (locationData: string | { _id: string; name: string } | undefined) => {
    if (!locationData) return "No Location";
    if (typeof locationData === 'object' && locationData.name) return locationData.name;
    const loc = locations.find((l: any) => l._id === locationData);
    return loc ? loc.name : "N/A";
  };


  return (
    <div className="space-y-6 p-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Item Master</h2>
          <p className="text-gray-600">Manage raw materials, semi-finished goods, and finished products</p>
        </div>
        <div className="flex gap-3">
          <button
            disabled={!canCreate}
            onClick={() => canCreate && setShowForm(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${canCreate ? "bg-black text-white" : "bg-gray-400 text-white cursor-not-allowed"
              }`}
          >

            <Plus size={18} /> Add Item
          </button>
          <button
            disabled={!canDelete}
            onClick={() => canDelete && resetAll()}
            className={`flex items-center gap-2 border px-4 py-2 rounded-lg ${canDelete ? "hover:bg-gray-50" : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
          >

            <RefreshCcw size={18} /> Reset
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid sm:grid-cols-5 gap-4">
        <div className="col-span-2 flex items-center gap-3">
          <Search className="text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <Select 
            value={locationFilter} 
            onValueChange={handleLocationFilterChange}
            disabled={isLocationRestricted}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Location" />
            </SelectTrigger>
            <SelectContent>
              {!isLocationRestricted && <SelectItem value="all">All Locations</SelectItem>}
              {locations
                .filter(location => !isLocationRestricted || location._id === userProfile?.location)
                .map((location) => (
                  <SelectItem key={location._id} value={location._id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {location.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
          <p className="text-gray-500 text-sm">Total Items</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
          <p className="text-gray-500 text-sm">Low Stock</p>
          <p className="text-2xl font-bold text-red-500">{lowStockCount}</p>
        </div>
      </div>
      
      {/* Additional Stats Row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
          <p className="text-gray-500 text-sm">Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">${totalInventoryValue}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
          <p className="text-gray-500 text-sm">Active Items</p>
          <p className="text-2xl font-bold text-blue-600">{items?.length || 0}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Code", "Name", "Type", "Stock", "Unit", "Cost", "Location", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Package className="mx-auto mb-2" size={42} />
                    No items found. Add your first one.
                  </td>
                </tr>
              ) : (
                items?.map((item) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-all"
                  >
                    <td className="px-6 py-3 font-semibold">{item.itemCode}</td>
                    <td className="px-6 py-3">{item.itemName}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${item.type === "raw"
                          ? "bg-yellow-100 text-yellow-800"
                          : item.type === "semi-finished"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                          }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`${item.stockQuantity <= item.reorderLevel
                          ? "text-red-600 font-semibold"
                          : "text-gray-800"
                          }`}
                      >
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-3">{item.unit}</td>
                    <td className="px-6 py-3">${item.standardCost.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{getLocationName(item.location)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <div className="flex gap-3">
                        <button
                          disabled={!canEdit}
                          onClick={() => canEdit && handleEdit(item)}
                          className={`${canEdit ? "text-indigo-600 hover:text-indigo-800" : "text-gray-400 cursor-not-allowed"}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          disabled={!canDelete}
                          onClick={() => canDelete && handleDelete(item._id)}
                          className={`${canDelete ? "text-red-600 hover:text-red-800" : "text-gray-400 cursor-not-allowed"}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl font-bold mb-4">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h3>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                style={{
                  pointerEvents: editingItem ? (canEdit ? "auto" : "none") : (canCreate ? "auto" : "none"),
                  opacity: editingItem ? (canEdit ? 1 : 0.6) : (canCreate ? 1 : 0.6),
                }}
              >

                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Item Code"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    required
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    placeholder="Item Name"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />

                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="raw">Raw Material</option>
                    <option value="semi-finished">Semi-Finished</option>
                    <option value="finished">Finished Product</option>
                  </select>
                  <input
                    placeholder="Unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Location
                    </label>

                    <Select
                      value={formData.location}
                      onValueChange={(v) =>
                        setFormData({ ...formData, location: v })
                      }
                    >
                      <SelectTrigger className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <SelectValue placeholder="Select Location" />
                      </SelectTrigger>

                      <SelectContent>
                        {locations.map((l: any) => (
                          <SelectItem key={l._id} value={l._id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Stock Qty"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Reorder Level"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Standard Cost ($)"
                    step="0.01"
                    value={formData.standardCost}
                    onChange={(e) => setFormData({ ...formData, standardCost: parseFloat(e.target.value) || 0 })}
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingItem ? !canEdit : !canCreate}
                    className={`px-4 py-2 rounded-lg text-white ${editingItem
                      ? canEdit ? "bg-black" : "bg-gray-400 cursor-not-allowed"
                      : canCreate ? "bg-black" : "bg-gray-400 cursor-not-allowed"
                      }`}
                  >

                    {editingItem ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
