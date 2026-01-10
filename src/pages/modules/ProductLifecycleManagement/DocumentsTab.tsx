import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  FileImage,
  FileCode,
  File,
  Eye,
  Download,
  Trash2,
  X,
  Edit,
  // FilePdf,              // ← Fixed: Now properly imported
  FileSpreadsheet,
  FileArchive,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  fetchDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
} from "@/redux/slices/documentSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";

/* ================= TYPES ================= */
interface DocumentItem {
  _id: string;
  documentName: string;
  type: "drawing" | "specification" | "cad" | "other";
  description?: string;
  fileUrl: string;
  version?: string;
  uploadedBy: string;        // This stores the fullname (e.g., "Asperiores enim esse")
  location?: string;
  linkedTo?: { type: string; id: string };
  size: number;
  createdAt: string;
}

/* ================= MAIN TAB ================= */
const DocumentsTab = () => {
  const dispatch = useDispatch();
  const { documents, loading } = useSelector((state: RootState) => state.documents);
  const { locations } = useSelector((state: RootState) => state.masterData);

  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  // Parse user profile from localStorage
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const currentUserName = userProfile?.fullname || "Current User";

  const [formData, setFormData] = useState({
    documentName: "",
    type: "" as "drawing" | "specification" | "cad" | "other" | "",
    description: "",
    version: "",
    linkedToType: "",
    linkedToId: "",
    location: "",
    file: null as File | null,
  });

  useEffect(() => {
    dispatch(fetchDocuments({}) as any);
    dispatch(fetchMasterData("location") as any);
  }, [dispatch]);

  const filteredDocs = documents.filter((doc: DocumentItem) => {
    const matchesSearch = doc.documentName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesLocation = locationFilter === "all" || doc.location === locationFilter;
    return matchesSearch && matchesType && matchesLocation;
  });

  const countByType = (type: string) => documents.filter((d: DocumentItem) => d.type === type).length;

  const handleUpload = () => {
    if (!formData.file || !formData.documentName || !formData.type || !formData.location) {
      alert("Please fill all required fields: Document Name, Type, Location, and select a file.");
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("documentName", formData.documentName);
    uploadFormData.append("type", formData.type);
    uploadFormData.append("uploadedBy", currentUserName); // Consistent with display
    uploadFormData.append("location", formData.location);
    if (formData.description) uploadFormData.append("description", formData.description);
    if (formData.version) uploadFormData.append("version", formData.version);
    if (formData.linkedToType && formData.linkedToId) {
      uploadFormData.append("linkedToType", formData.linkedToType);
      uploadFormData.append("linkedToId", formData.linkedToId);
    }
    uploadFormData.append("file", formData.file);

    dispatch(uploadDocument(uploadFormData) as any)
      .unwrap()
      .then(() => {
        setShowUpload(false);
        resetForm();
      })
      .catch((err: any) => {
        console.error("Upload failed:", err);
        alert("Upload failed: " + (err?.message || "Unknown error"));
      });
  };

  const handleUpdate = () => {
    if (!selectedDocument) return;

    const updatedData: Partial<DocumentItem> = {
      documentName: formData.documentName,
      type: formData.type,
      description: formData.description || undefined,
      version: formData.version || undefined,
      location: formData.location,
    };

    // Allow clearing the link
    if (formData.linkedToType && formData.linkedToId) {
      updatedData.linkedTo = { type: formData.linkedToType, id: formData.linkedToId };
    } else {
      updatedData.linkedTo = undefined; // Clears the link if fields are empty
    }

    dispatch(updateDocument({ id: selectedDocument._id, data: updatedData }) as any)
      .unwrap()
      .then(() => {
        setShowEdit(false);
        resetForm();
      })
      .catch((err: any) => {
        console.error("Update failed:", err);
        alert("Update failed: " + (err?.message || "Unknown error"));
      });
  };

  const resetForm = () => {
    setFormData({
      documentName: "",
      type: "",
      description: "",
      version: "",
      linkedToType: "",
      linkedToId: "",
      location: "",
      file: null,
    });
  };

  const handleEdit = (doc: DocumentItem) => {
    setSelectedDocument(doc);
    setFormData({
      documentName: doc.documentName,
      type: doc.type,
      description: doc.description || "",
      version: doc.version || "",
      linkedToType: doc.linkedTo?.type || "",
      linkedToId: doc.linkedTo?.id || "",
      location: doc.location || "",
      file: null,
    });
    setShowEdit(true);
  };

  const handleView = (doc: DocumentItem) => {
    setSelectedDocument(doc);
    setShowView(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    dispatch(deleteDocument(id) as any);
  };

  const handleDownload = (fileUrl: string, documentName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = documentName;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return "—";
    const loc = locations.find((l: any) => l._id === locationId);
    return loc ? loc.name : "—";
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case "pdf":
        return <FilePdf className="h-32 w-32 text-red-600" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="h-32 w-32 text-green-600" />;
      case "doc":
      case "docx":
        return <FileText className="h-32 w-32 text-blue-600" />;
      case "zip":
      case "rar":
      case "7z":
        return <FileArchive className="h-32 w-32 text-yellow-600" />;
      case "dwg":
      case "dxf":
        return <FileCode className="h-32 w-32 text-purple-600" />;
      default:
        return <File className="h-32 w-32 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Document Management</h2>
          <p className="text-sm text-gray-500">
            Manage drawings, specifications, CAD files, and documents
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowUpload(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all duration-200"
          disabled={loading}
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* CATEGORY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CategoryCard title="Technical Drawings" count={countByType("drawing")} icon={<FileImage className="h-8 w-8" />} color="blue" />
        <CategoryCard title="Specifications" count={countByType("specification")} icon={<FileText className="h-8 w-8" />} color="green" />
        <CategoryCard title="CAD Files" count={countByType("cad")} icon={<FileCode className="h-8 w-8" />} color="purple" />
        <CategoryCard title="Other Documents" count={countByType("other")} icon={<File className="h-8 w-8" />} color="orange" />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="relative flex-1 min-w-[200px] md:min-w-[280px]">
          <input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[180px]"
        >
          <option value="all">All Types</option>
          <option value="drawing">Technical Drawing</option>
          <option value="specification">Specification</option>
          <option value="cad">CAD</option>
          <option value="other">Other</option>
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[180px]"
        >
          <option value="all">All Locations</option>
          {locations?.map((loc: any) => (
            <option key={loc._id} value={loc._id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            Loading documents...
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Document</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Location</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Linked To</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Version</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Uploaded By</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Upload Date</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Size</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-500">
                    <div className="space-y-2">
                      <File className="h-12 w-12 mx-auto text-gray-400" />
                      <p>No documents found matching your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc: DocumentItem) => (
                  <tr key={doc._id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.documentName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full capitalize">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{getLocationName(doc.location)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {doc.linkedTo ? `${doc.linkedTo.type.toUpperCase()} - ${doc.linkedTo.id}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{doc.version || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      {doc.uploadedBy === currentUserName ? "You" : doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatSize(doc.size)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => handleView(doc)}
                          title="View Details"
                        />
                        <IconButton
                          icon={<Download className="h-4 w-4" />}
                          onClick={() => handleDownload(doc.fileUrl, doc.documentName)}
                          title="Download"
                        />
                        <IconButton
                          icon={<Edit className="h-4 w-4" />}
                          onClick={() => handleEdit(doc)}
                          title="Edit"
                        />
                        <IconButton
                          icon={<Trash2 className="h-4 w-4" />}
                          danger
                          onClick={() => handleDelete(doc._id)}
                          title="Delete"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALS */}
      {showUpload && (
        <DocumentModal
          isEdit={false}
          formData={formData}
          setFormData={setFormData}
          locations={locations}
          currentUser={currentUserName}
          onClose={() => setShowUpload(false)}
          onSubmit={handleUpload}
        />
      )}
      {showEdit && selectedDocument && (
        <DocumentModal
          isEdit={true}
          formData={formData}
          setFormData={setFormData}
          locations={locations}
          currentUser={selectedDocument.uploadedBy}
          onClose={() => setShowEdit(false)}
          onSubmit={handleUpdate}
        />
      )}
      {showView && selectedDocument && (
        <ViewDocumentModal
          doc={selectedDocument}
          onClose={() => setShowView(false)}
          getLocationName={getLocationName}
          formatSize={formatSize}
          handleDownload={handleDownload}
          getFileIcon={getFileIcon}
        />
      )}
    </div>
  );
};

/* ================= SUB COMPONENTS ================= */
const CategoryCard = ({ title, count, icon, color }: { title: string; count: number; icon: React.ReactNode; color: string }) => {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className={`rounded-xl p-6 border ${bgColors[color]} transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white shadow-sm border">{icon}</div>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
          <p className="text-sm text-gray-500">files</p>
        </div>
      </div>
    </div>
  );
};

const IconButton = ({ icon, danger, onClick, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center ${
      danger
        ? "text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 shadow-sm"
        : "text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-sm"
    }`}
  >
    {icon}
  </button>
);

/* ================= VIEW DOCUMENT MODAL ================= */
const ViewDocumentModal = ({
  doc,
  onClose,
  getLocationName,
  formatSize,
  handleDownload,
  getFileIcon,
}: {
  doc: DocumentItem;
  onClose: () => void;
  getLocationName: (id?: string) => string;
  formatSize: (bytes: number) => string;
  handleDownload: (url: string, name: string) => void;
  getFileIcon: (ext: string) => JSX.Element;
}) => {
  // Safer extension extraction (handles ?query params)
  const fileExtension = doc.fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(fileExtension);
  const isPdf = fileExtension === "pdf";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-2xl font-bold text-gray-900">Document Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Preview / File Icon Section */}
          <div className="lg:w-1/2 bg-gray-50 p-8 flex flex-col items-center justify-center">
            {isImage ? (
              <img
                src={doc.fileUrl}
                alt={doc.documentName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            ) : isPdf ? (
              <iframe
                src={doc.fileUrl}
                className="w-full h-full rounded-xl shadow-2xl border"
                title={doc.documentName}
              />
            ) : (
              <div className="text-center space-y-8">
                <div className="flex justify-center">
                  {getFileIcon(fileExtension)}
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-800">{doc.documentName}</p>
                  <p className="text-xl text-gray-600 mt-2">.{fileExtension.toUpperCase()} File</p>
                </div>
                <button
                  onClick={() => handleDownload(doc.fileUrl, doc.documentName)}
                  className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl font-semibold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition shadow-xl"
                >
                  <Download className="h-8 w-8" />
                  Download File
                </button>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-8 overflow-y-auto bg-white">
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Type</h4>
                <p className="text-xl font-semibold capitalize mt-2">{doc.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p className="text-lg font-semibold mt-1">{getLocationName(doc.location)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Version</h4>
                  <p className="text-lg font-semibold mt-1">{doc.version || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Uploaded By</h4>
                  <p className="text-lg font-semibold mt-1">{doc.uploadedBy}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Upload Date</h4>
                  <p className="text-lg font-semibold mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">File Size</h4>
                  <p className="text-lg font-semibold mt-1">{formatSize(doc.size)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">File Extension</h4>
                  <p className="text-lg font-semibold mt-1">.{fileExtension.toUpperCase()}</p>
                </div>
              </div>

              {doc.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-6 rounded-xl mt-3 text-lg leading-relaxed">{doc.description}</p>
                </div>
              )}

              {doc.linkedTo && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Linked To</h4>
                  <p className="text-lg font-semibold capitalize mt-2">
                    {doc.linkedTo.type} - {doc.linkedTo.id}
                  </p>
                </div>
              )}

              <div className="pt-8 border-t">
                <button
                  onClick={() => handleDownload(doc.fileUrl, doc.documentName)}
                  className="w-full inline-flex justify-center items-center gap-4 px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xl font-semibold rounded-2xl hover:from-green-700 hover:to-green-800 transition shadow-xl"
                >
                  <Download className="h-8 w-8" />
                  Download Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= UPLOAD / EDIT MODAL ================= */
const DocumentModal = ({
  isEdit,
  formData,
  setFormData,
  locations,
  currentUser,
  onClose,
  onSubmit,
}: {
  isEdit: boolean;
  formData: any;
  setFormData: (data: any) => void;
  locations: any[];
  currentUser: string;
  onClose: () => void;
  onSubmit: () => void;
}) => {
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isValid = isEdit
    ? formData.documentName && formData.type && formData.location
    : formData.file && formData.documentName && formData.type && formData.location;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto border">
        <div className="flex justify-between items-center px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Document" : "Upload Document"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <Input
            label="Document Name *"
            value={formData.documentName}
            onChange={(val: string) => handleChange("documentName", val)}
            placeholder="Enter document name"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Select
              label="Type *"
              value={formData.type}
              onChange={(val: string) => handleChange("type", val)}
              options={[
                { value: "", label: "Select Type" },
                { value: "drawing", label: "Technical Drawing" },
                { value: "specification", label: "Specification" },
                { value: "cad", label: "CAD File" },
                { value: "other", label: "Other Document" },
              ]}
            />

            <LocationSelect
              label="Location *"
              value={formData.location}
              onChange={(val: string) => handleChange("location", val)}
              locations={locations}
            />
          </div>

          <Input
            label="Uploaded By"
            value={currentUser}
            disabled
            className="bg-green-50 border-green-200 text-green-800"
          />

          <Textarea
            label="Description (Optional)"
            value={formData.description}
            onChange={(val: string) => handleChange("description", val)}
            placeholder="Enter document description..."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Select
              label="Linked To Type"
              value={formData.linkedToType}
              onChange={(val: string) => handleChange("linkedToType", val)}
              options={[
                { value: "", label: "None" },
                { value: "eco", label: "Engineering Change Order (ECO)" },
                { value: "bom", label: "Bill of Materials (BoM)" },
                { value: "product", label: "Product" },
              ]}
            />
            <Input
              label="Linked To ID"
              value={formData.linkedToId}
              onChange={(val: string) => handleChange("linkedToId", val)}
              placeholder="Enter ID (optional)"
              disabled={!formData.linkedToType}
            />
          </div>

          <Input
            label="Version (Optional)"
            placeholder="e.g., v1.0, v2.1"
            value={formData.version}
            onChange={(val: string) => handleChange("version", val)}
          />

          {!isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-semibold block mb-2 text-gray-900">File Upload *</label>
              <input
                type="file"
                required
                onChange={(e) => handleChange("file", e.target.files?.[0] || null)}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl px-6 py-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:hover:bg-blue-700"
              />
              {formData.file && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">
                    Selected: {formData.file.name}
                  </span>
                  <span className="text-xs text-green-600">{formatSize(formData.file.size)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 px-8 py-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-8 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!isValid}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              isValid
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Upload className="h-4 w-4" />
            {isEdit ? "Update Document" : "Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= INPUT COMPONENTS ================= */
const Input = ({ label, value, onChange, placeholder, disabled, className = "" }: any) => (
  <div>
    <label className="text-sm font-semibold block mb-2 text-gray-900">{label}</label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm ${
        disabled ? "bg-gray-100 cursor-not-allowed" : "hover:border-blue-300 hover:shadow-md"
      } ${className}`}
    />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div>
    <label className="text-sm font-semibold block mb-2 text-gray-900">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm hover:border-blue-300 hover:shadow-md bg-white"
    >
      {options.map((opt: { value: string; label: string }) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const LocationSelect = ({ label, value, onChange, locations }: any) => (
  <div>
    <label className="text-sm font-semibold block mb-2 text-gray-900">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm hover:border-blue-300 hover:shadow-md bg-white"
    >
      <option value="">Select Location</option>
      {locations?.map((loc: any) => (
        <option key={loc._id} value={loc._id}>
          {loc.name}
        </option>
      ))}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder }: any) => (
  <div>
    <label className="text-sm font-semibold block mb-2 text-gray-900">{label}</label>
    <textarea
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical transition-all duration-200 shadow-sm hover:border-blue-300 hover:shadow-md"
    />
  </div>
);

export default DocumentsTab;