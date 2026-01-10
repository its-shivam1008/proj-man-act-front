import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { RootState } from "@/redux/store";
import { fetchEcos, createEco, deleteEco, updateEco } from "@/redux/slices/ecoSlice";
/* ================= TYPES ================= */

interface Eco {
  _id: string;
  ecoNumber: string;
  product: string;
  type: string;
  description: string;
  priority: string;
  stage: string;
  requestedBy: string;
  location: string;
  effectiveDate: string;
}

/* ================= MODALS ================= */

const ConfirmDeleteModal = ({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
      <h3 className="text-lg font-semibold">Delete ECO?</h3>
      <p className="text-sm text-gray-500 mt-2">
        This action cannot be undone.
      </p>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const ViewEcoModal = ({ eco, onClose }: { eco: Eco; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl w-full max-w-2xl shadow-lg">
      <div className="flex justify-between items-center px-6 py-4 border-b">
        <h3 className="font-semibold text-lg">ECO Details</h3>
        <button onClick={onClose}>
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 text-sm">
        <Detail label="ECO Number" value={eco.ecoNumber} />
        <Detail label="Product" value={eco.product} />
        <Detail label="Type" value={eco.type} />
        <Detail label="Priority" value={eco.priority} />
        <Detail label="Stage" value={eco.stage} />
        <Detail label="Requested By" value={eco.requestedBy} />
        <Detail label="Effective Date" value={eco.effectiveDate} />
        <Detail label="Location" value={eco.location} />

        <div className="col-span-2">
          <p className="font-medium">Description</p>
          <p className="text-gray-600">{eco.description || "-"}</p>
        </div>
      </div>

      <div className="flex justify-end px-6 py-4 border-t">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg">
          Close
        </button>
      </div>
    </div>
  </div>
);

const Detail = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value || "-"}</p>
  </div>
);

/* ================= MAIN TAB ================= */

const EcosTab = () => {
  const dispatch = useDispatch();
  const { ecos, loading } = useSelector((state: RootState) => state.ecos);
  const { locations } = useSelector((state: RootState) => state.masterData);

  const [viewEco, setViewEco] = useState<Eco | null>(null);
  const [deleteEcoId, setDeleteEcoId] = useState<string | null>(null);
  const [editEco, setEditEco] = useState<Eco | null>(null);

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [type, setType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    ecoType: "",
    product: "",
    currentBomVersion: "",
    proposedBomVersion: "",
    description: "",
    changeReason: "",
    priority: "",
    effectiveDate: "",
    estimatedCost: "",
    location: "",
    notes: "",
    documents: null as File | null,
  });

  const handleView = (eco: Eco) => setViewEco(eco);

  const handleEdit = (eco: Eco) => {
    setEditEco(eco);
    setFormData({
      ecoType: eco.type,
      product: eco.product,
      currentBomVersion: "", // You may want to fetch these if available
      proposedBomVersion: "",
      description: eco.description,
      changeReason: "",
      priority: eco.priority,
      effectiveDate: eco.effectiveDate,
      estimatedCost: "",
      location: eco.location,
      notes: "",
      documents: null,
    });
    setShowCreate(true);
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteEcoId(id);
  };

  useEffect(() => {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) {
      console.warn("No organisation selected");
      return;
    }
    dispatch(fetchEcos() as any);
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMasterData('location') as any);
  }, [dispatch]);

  const filteredEcos = ecos.filter((eco: Eco) => {
    const matchesSearch =
      eco.ecoNumber.toLowerCase().includes(search.toLowerCase()) ||
      eco.product.toLowerCase().includes(search.toLowerCase());

    const matchesStage = stage === "all" || eco.stage === stage;
    const matchesType = type === "all" || eco.type === type;
    const matchesPriority = priority === "all" || eco.priority === priority;

    return matchesSearch && matchesStage && matchesType && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold">Engineering Change Orders</h2>
        <p className="text-sm text-gray-500">
          Track and manage engineering change requests
        </p>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search ECOs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-60"
          />
        </div>

        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Stages</option>
          <option value="new">New</option>
          <option value="under-review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="applied">Applied</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="bom">BoM</option>
          <option value="document">Document</option>
          <option value="product-variant">Product Variant</option>
          <option value="routing">Routing</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <button
          onClick={() => {
            setEditEco(null);
            setFormData({
              ecoType: "",
              product: "",
              currentBomVersion: "",
              proposedBomVersion: "",
              description: "",
              changeReason: "",
              priority: "",
              effectiveDate: "",
              estimatedCost: "",
              location: "",
              notes: "",
              documents: null,
            });
            setShowCreate(true);
          }}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New ECO
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">ECO Number</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-left">Requested By</th>
              <th className="px-4 py-3 text-left">Effective Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEcos.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-500">
                  No ECOs found
                </td>
              </tr>
            ) : (
              filteredEcos.map((eco: Eco) => (
                <tr key={eco._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{eco.ecoNumber}</td>
                  <td className="px-4 py-3">{eco.product}</td>
                  <td className="px-4 py-3 capitalize">{eco.type}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{eco.description}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={eco.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={eco.stage} />
                  </td>
                  <td className="px-4 py-3">{eco.requestedBy}</td>
                  <td className="px-4 py-3">{eco.effectiveDate}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <IconButton icon={<Eye className="h-4 w-4" />} onClick={() => handleView(eco)} />
                      <IconButton icon={<Edit className="h-4 w-4" />} onClick={() => handleEdit(eco)} />
                      <IconButton
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onClick={() => handleDeleteConfirm(eco._id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Modals */}
        {viewEco && <ViewEcoModal eco={viewEco} onClose={() => setViewEco(null)} />}
        {deleteEcoId && (
          <ConfirmDeleteModal
            onCancel={() => setDeleteEcoId(null)}
            onConfirm={() => {
              dispatch(deleteEco(deleteEcoId) as any);
              setDeleteEcoId(null);
            }}
          />
        )}
        {showCreate && (
          <CreateEcoModal
            onClose={() => setShowCreate(false)}
            locations={locations}
            formData={formData}
            setFormData={setFormData}
            dispatch={dispatch}
            editEco={editEco}
          />
        )}
      </div>
    </div>
  );
};

/* ================= BADGES & BUTTONS ================= */

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[priority.toLowerCase()] || "bg-gray-100"}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const StageBadge = ({ stage }: { stage: string }) => {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    "under-review": "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    applied: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[stage.toLowerCase()] || "bg-gray-100"}`}>
      {stage.replace("-", " ").charAt(0).toUpperCase() + stage.replace("-", " ").slice(1)}
    </span>
  );
};

const IconButton = ({ icon, danger, onClick }: { icon: React.ReactNode; danger?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg border hover:bg-gray-100 ${danger ? "text-red-600 border-red-200" : "text-gray-600"}`}
  >
    {icon}
  </button>
);

/* ================= CREATE / EDIT MODAL ================= */

const CreateEcoModal = ({
  onClose,
  locations,
  formData,
  setFormData,
  dispatch,
  editEco,
}: {
  onClose: () => void;
  locations: any[];
  formData: any;
  setFormData: ( updater: (prev: any) => any ) => void;
  dispatch: any;
  editEco: Eco | null;
}) => {
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const payload = {
      type: formData.ecoType,
      product: formData.product,
      description: formData.description,
      priority: formData.priority,
      effectiveDate: formData.effectiveDate,
      location: formData.location,
      // Add other fields if backend supports them
    };

    const action = editEco
      ? updateEco({ id: editEco._id, data: payload })
      : createEco({
          ...payload,
          ecoNumber: `ECO-${Date.now()}`,
          stage: "new",
          requestedBy: "Current User", // Adjust as needed
        });

    dispatch(action as any)
      .unwrap()
      .then(() => {
        onClose();
      })
      .catch((err: any) => console.error(err));
  };

  const isEdit = !!editEco;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white">
          <h3 className="font-semibold text-lg">
            {isEdit ? "Edit" : "Create"} Engineering Change Order
          </h3>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="ECO Type *"
              options={["BoM", "Document", "Product Variant", "Routing"]}
              value={formData.ecoType}
              onChange={(val: string) => handleChange("ecoType", val.toLowerCase())}
            />
            <Select
              label="Product *"
              options={["Product A", "Product B", "Product C"]} // Replace with dynamic if needed
              value={formData.product}
              onChange={(val: string) => handleChange("product", val)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Current BoM Version"
              placeholder="e.g. v2.0"
              value={formData.currentBomVersion}
              onChange={(val: string) => handleChange("currentBomVersion", val)}
            />
            <Input
              label="Proposed BoM Version"
              placeholder="e.g. v2.1"
              value={formData.proposedBomVersion}
              onChange={(val: string) => handleChange("proposedBomVersion", val)}
            />
          </div>

          <Textarea
            label="Description *"
            value={formData.description}
            onChange={(val: string) => handleChange("description", val)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Change Reason"
              options={["Design Improvement", "Compliance", "Cost Reduction", "Customer Request"]}
              value={formData.changeReason}
              onChange={(val: string) => handleChange("changeReason", val)}
            />
            <Select
              label="Priority *"
              options={["Low", "Medium", "High", "Critical"]}
              value={formData.priority}
              onChange={(val: string) => handleChange("priority", val.toLowerCase())}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Effective Date *"
              type="date"
              value={formData.effectiveDate}
              onChange={(val: string) => handleChange("effectiveDate", val)}
            />
            <Input
              label="Estimated Cost"
              placeholder="0.00"
              value={formData.estimatedCost}
              onChange={(val: string) => handleChange("estimatedCost", val)}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Location *</label>
            <select
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Location</option>
              {locations?.map((loc: any) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="file"
            label="Documents"
            onChange={(file: File | undefined) => handleChange("documents", file || null)}
          />

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(val: string) => handleChange("notes", val)}
          />
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isEdit ? "Update ECO" : "Create ECO"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= INPUT COMPONENTS ================= */

const Input = ({ label, type = "text", placeholder, value, onChange }: any) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    <input
      type={type}
      value={type === "file" ? undefined : value}
      onChange={(e) => onChange(type === "file" ? e.target.files?.[0] : e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

const Select = ({ label, options, value, onChange }: any) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    <select
      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select {label.split(" *")[0]}</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt.toLowerCase().replace(/ /g, "-")}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange }: any) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
    />
  </div>
);

export default EcosTab;