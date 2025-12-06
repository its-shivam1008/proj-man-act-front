import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import { fetchProducts } from "../../../../redux/slices/productSlice";
import {
  fetchMovements,
  deleteMovement,
} from "../../../../redux/slices/materialMovementSlice";
import {
  History,
  Search,
  Package,
  Eye,
  Trash2,
  ShieldAlert,
} from "lucide-react";

const InventoryHistory: React.FC = () => {
  const canView = usePermission("inventoryReporting", "view");
  const canDelete = usePermission("inventoryReporting", "delete");
  const dispatch = useDispatch<AppDispatch>();
  
  const { products } = useSelector((state: RootState) => state.products);
  const materialMovementsState = useSelector(
    (state: RootState) => state.materialMovements || { movements: [], loading: false }
  );
  const movements = materialMovementsState.movements || [];
  const loading = materialMovementsState.loading || false;
  
  const [searchTerm, setSearchTerm] = useState("");
  const orgId = localStorage.getItem("organisationId");

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 1000 }));
    if (orgId) {
      dispatch(fetchMovements({ organisationId: orgId }));
    }
  }, [dispatch, orgId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    await dispatch(deleteMovement(id));
    if (orgId) {
      dispatch(fetchMovements({ organisationId: orgId }));
    }
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }

  const safeProducts = Array.isArray(products) ? products : [];
  const safeMovements = Array.isArray(movements) ? movements : [];

  const filteredMovements = safeMovements.filter((move) => {
    const matchesSearch =
      move.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      move.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "inbound":
        return "bg-green-100 text-green-800";
      case "outbound":
        return "bg-red-100 text-red-800";
      case "transfer":
        return "bg-blue-100 text-blue-800";
      case "return":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Movements</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete transaction history and stock movement tracking
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <History className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{safeMovements.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Inbound</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeMovements.filter((m) => m.movementType === "inbound").length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Outbound</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeMovements.filter((m) => m.movementType === "outbound").length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Transfers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeMovements.filter((m) => m.movementType === "transfer").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by material, source, destination, WBS task, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WBS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredMovements.map((move) => {
                  const materialName =
                    move.materialName ||
                    (typeof move.materialId === "object" && move.materialId?.name) ||
                    "Unknown Material";
                  const itemType = move.itemType || "material";

                  return (
                    <tr key={move._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {move.movementDate
                          ? new Date(move.movementDate).toLocaleDateString()
                          : new Date(move.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeBadge(
                            move.movementType
                          )}`}
                        >
                          {move.movementType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            itemType === "product"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {itemType === "product" ? "Product" : "Material"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {materialName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {move.quantity} {move.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {move.source || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {move.destination || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {move.wbsTaskName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {move.referenceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(move.totalCost || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          disabled={!canDelete}
                          onClick={() => canDelete && handleDelete(move._id || "")}
                          className={`${
                            canDelete
                              ? "text-red-600 hover:text-red-900"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredMovements.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500">
            Showing 1 to {Math.min(10, filteredMovements.length)} of {filteredMovements.length} movements
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistory;
