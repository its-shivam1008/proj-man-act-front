import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import {
    User,
    Edit,
    Shield,
    Building2,
    Lock,
    CheckCircle,
    AlertCircle,
    X,
    KeyRound,
    ChevronRight,
    Briefcase,
    MapPin,
    Phone,
    Mail,
    Save,
    Camera,
    LayoutDashboard,
    Package,
    ShoppingCart,
    Factory,
    Wrench,
    ScanLine,
    UserRound,
    GitBranch,
    FactoryIcon,
    Eye,
    Plus,
    Trash2
} from "lucide-react";
import api from "../utils/axiosApi";
import { fetchCompanyInfo, updateCompanyInfo, updateUserProfileThunk } from "@/redux/slices/authSlice";

interface TabProps {
    id: string;
    label: string;
    icon: React.ElementType;
    active: boolean;
    onClick: () => void;
}


const Tab: React.FC<TabProps> = ({ label, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${active
            ? "text-purple-600 border-purple-600 bg-purple-50/60"
            : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
    >
        <Icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-gray-400"}`} />
        {label}
    </button>
);

const UserProfile: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { userProfile, companyInfo, loading, companyLoading } = useSelector((state: RootState) => state.auth);

    // Tab State
    const [activeTab, setActiveTab] = useState("profile");

    // Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordStep, setPasswordStep] = useState<"verify" | "otp" | "newPassword">("verify");
    const [currentPassword, setCurrentPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Form States
    const [editForm, setEditForm] = useState({
        fullname: "",
        mobile: "",
        address: "",
        postalCode: ""
    });

    const [companyForm, setCompanyForm] = useState({
        name: "",
        employeeCapacity: "",
        hrmsOrganisationId: "",
        address: ""
    });

    // Feedback State
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState(false); // separate for password modal
    const { locations } = useSelector((state: RootState) => state.masterData);

    const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = locations.find(loc => loc._id === locationId);
    return location ? location.name : locationId;
  };

    // Initialize forms
    useEffect(() => {
        if (userProfile) {
            setEditForm({
                fullname: userProfile.fullname || "",
                mobile: userProfile.mobile || "",
                address: userProfile.address || "",
                postalCode: userProfile.postalCode || ""
            });
        }
    }, [userProfile]);

    useEffect(() => {
        if (activeTab === "company") {
            dispatch(fetchCompanyInfo());
        }
    }, [activeTab, dispatch]);

    useEffect(() => {
        if (companyInfo) {
            setCompanyForm({
                name: companyInfo.name || "",
                employeeCapacity: companyInfo.employeeCapacity || "",
                hrmsOrganisationId: companyInfo.hrmsOrganisationId || "",
                address: companyInfo.address || ""
            });
        }
    }, [companyInfo]);

    const handleUpdateProfile = async () => {
        setError(null);
        setSuccess(null);
        const res = await dispatch(updateUserProfileThunk(editForm));
        if (updateUserProfileThunk.fulfilled.match(res)) {
            setSuccess("Profile updated successfully!");
        } else {
            setError(typeof res.payload === 'string' ? res.payload : "Failed to update profile");
        }
    };

    const handleUpdateCompany = async () => {
        setError(null);
        setSuccess(null);
        const res = await dispatch(updateCompanyInfo(companyForm));
        if (updateCompanyInfo.fulfilled.match(res)) {
            setSuccess("Company information updated successfully!");
        } else {
            setError(typeof res.payload === 'string' ? res.payload : "Failed to update company info");
        }
    };

    // Password Change Logic
    const handleSendOtp = async () => {
        setError(null);
        try {
            await api.post("/auth/send-change-password-otp", { currentPassword });
            setPasswordStep("otp");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to verify password");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setError(null);
        try {
            await api.post("/auth/change-password", { otp, newPassword });
            setModalSuccess(true);
            setTimeout(() => {
                setShowPasswordModal(false);
                resetPasswordModal();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to change password");
        }
    };

    const resetPasswordModal = () => {
        setPasswordStep("verify");
        setCurrentPassword("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        setModalSuccess(false);
    };

    const tabs = [
        { id: "profile", label: "Overview", icon: User },
        { id: "edit", label: "Edit Profile", icon: Edit },
        { id: "security", label: "Security & Permissions", icon: Shield },
        { id: "company", label: "Company Info", icon: Building2 },
    ];

    const isAdmin = userProfile?.role === "admin";

    // Helper to render permission badges
    const renderPermissionBadge = (type: string, allowed: boolean) => (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${allowed
                ? type === 'view' ? 'bg-blue-100 text-blue-700' :
                    type === 'create' ? 'bg-green-100 text-green-700' :
                        type === 'edit' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-400'
            }`}>
            {type}
        </span>
    );

    const getModuleIcon = (key: string) => {
        // Map keys to module IDs if possible or just precise icon mapping
        const icons: any = {
            dashboard: LayoutDashboard,
            project: Package, // FolderKanban is better but using Package for consistency if imported
            inventory: Package,
            purchase: ShoppingCart,
            production: Factory,
            qualityControl: Shield,
            plantMachinery: FactoryIcon,
            productLifecycle: GitBranch,
            repair: Wrench,
            barcode: ScanLine,
            permissions: UserRound,
            drawing: UserRound // Default fallback
        };
        return icons[key] || UserRound;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-10 pointer-events-none" />

                    <div className="z-10 relative group">
                        <div className="w-32 h-32 rounded-full bg-white p-1 shadow-xl ring-4 ring-purple-50">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 font-bold text-4xl">
                                {userProfile?.fullname?.substring(0, 2).toUpperCase() || <User className="w-12 h-12" />}
                            </div>
                        </div>
                        {/* <button className="absolute bottom-1 right-1 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors">
                            <Camera className="w-4 h-4" />
                        </button> */}
                    </div>

                    <div className="flex-1 text-center md:text-left z-10 pt-2">
                        <h1 className="text-3xl font-bold text-gray-900">{userProfile?.fullname}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-3 mt-2 text-gray-500">
                            <span className="flex items-center gap-1.5 text-sm bg-gray-100 px-3 py-1 rounded-full font-medium uppercase tracking-wide">
                                <Shield className="w-3 h-3" />
                                {userProfile?.role}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {userProfile?.email}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Tabs Sidebar (Desktop) / Topbar (Mobile) */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className={`flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all text-left whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? "text-purple-700 bg-purple-50 border-l-4 border-purple-600"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-4 border-transparent"
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-purple-600" : "text-gray-400"}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-100 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="p-1 bg-green-100 rounded-full"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                                <span className="font-medium">{success}</span>
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="p-1 bg-red-100 rounded-full"><AlertCircle className="w-4 h-4 text-red-600" /></div>
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* VIEW PROFILE */}
                        {activeTab === "profile" && (
                            <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                            <UserRound className="w-5 h-5 text-gray-400" />
                                            Personal Details
                                        </h3>
                                        <div className="grid gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email</label>
                                                <p className="font-medium text-gray-900">{userProfile?.email}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mobile</label>
                                                <p className="font-medium text-gray-900">{userProfile?.mobile || "Not Added"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                            <MapPin className="w-5 h-5 text-gray-400" />
                                            Home Address
                                        </h3>
                                        <div className="grid gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Home Address</label>
                                                <p className="font-medium text-gray-900">{userProfile?.address || "Not Added"}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Postal Code</label>
                                                <p className="font-medium text-gray-900">{userProfile?.postalCode || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                            <MapPin className="w-5 h-5 text-gray-400" />
                                            Company Information
                                        </h3>
                                        <div className="grid gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Company Name</label>
                                                <p className="font-medium text-gray-900">{userProfile?.companyName || "Not Added"}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Company Address</label>
                                                <p className="font-medium text-gray-900">{userProfile?.companyAddress || "Not Added"}</p>
                                            </div>
                                            {userProfile.role === "admin" && <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Capacity</label>
                                                <p className="font-medium text-gray-900">{userProfile?.employeeCapacity || "Not Added"}</p>
                                            </div>}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                            <MapPin className="w-5 h-5 text-gray-400" />
                                            MISC Information
                                        </h3>
                                        <div className="grid gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Role</label>
                                                <p className="font-medium text-gray-900">{userProfile?.role || "Not Added"}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Location</label>
                                                <p className="font-medium text-gray-900">{getLocationName(userProfile?.location) || "Not Added"}</p>
                                            </div>
                                            {userProfile.role === "admin" && <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hrms Oganisation Id</label>
                                                <p className="font-medium text-gray-900">{(userProfile?.hrmsOrganisationId as string) || "Not Added"}</p>
                                            </div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EDIT PROFILE */}
                        {activeTab === "edit" && (
                            <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                            value={editForm.fullname}
                                            onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                            value={editForm.mobile}
                                            onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                                            placeholder="+91..."
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-gray-700">Home Address</label>
                                        <textarea
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none"
                                            value={editForm.address}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            rows={3}
                                            placeholder="Enter your personal address"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Postal Code</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                            value={editForm.postalCode}
                                            onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={loading}
                                        className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md shadow-purple-200 disabled:opacity-50 flex items-center gap-2 font-medium transition-transform active:scale-95"
                                    >
                                        {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SECURITY */}
                        {activeTab === "security" && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                {/* Password Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white border border-gray-100 rounded-full shadow-sm">
                                                <KeyRound className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900">Password & Authentication</h3>
                                                <p className="text-sm text-gray-500">Update your password securely using OTP verification.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-purple-200 hover:text-purple-700 hover:shadow-sm transition-all font-medium text-sm"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </div>

                                {/* Permissions Section */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Page Access & Permissions</h3>
                                        <p className="text-gray-500 text-sm">Modules you have access to within your organization.</p>
                                    </div>

                                    {isAdmin ? (
                                        <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl text-center space-y-4">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                <Shield className="w-8 h-8 text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-purple-900">Administrator Access</h4>
                                                <p className="text-purple-700/80 max-w-md mx-auto mt-1">
                                                    You have full <strong>Admin</strong> privileges. You can view, create, edit, and delete across all modules in this organization.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold text-xs">
                                                    <tr>
                                                        <th className="px-6 py-4">Module Name</th>
                                                        <th className="px-6 py-4 text-center w-24">View</th>
                                                        <th className="px-6 py-4 text-center w-24">Create</th>
                                                        <th className="px-6 py-4 text-center w-24">Edit</th>
                                                        <th className="px-6 py-4 text-center w-24">Delete</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {userProfile?.permissions && Object.entries(userProfile.permissions).map(([key, perms]: [string, any]) => {
                                                        const Icon = getModuleIcon(key);
                                                        // Capitalize first letter of key or map to a name
                                                        const moduleName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();

                                                        // Filter only if at least one permission is true? Or show all? showing all for transparency
                                                        // If permissions object is huge, maybe filter?
                                                        if (!perms.view && !perms.create && !perms.edit && !perms.delete) return null;

                                                        return (
                                                            <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                                    <Icon className="w-4 h-4 text-gray-400" />
                                                                    {moduleName}
                                                                </td>
                                                                <td className="px-6 py-4 text-center">{renderPermissionBadge('view', perms.view)}</td>
                                                                <td className="px-6 py-4 text-center">{renderPermissionBadge('create', perms.create)}</td>
                                                                <td className="px-6 py-4 text-center">{renderPermissionBadge('edit', perms.edit)}</td>
                                                                <td className="px-6 py-4 text-center">{renderPermissionBadge('delete', perms.delete)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {(!userProfile?.permissions || Object.keys(userProfile.permissions || {}).length === 0) && (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                                No specific permissions assigned.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* COMPANY INFO */}
                        {activeTab === "company" && (
                            <div className="animate-in fade-in duration-500">
                                {companyLoading ? (
                                    <div className="text-center py-20 text-gray-500">
                                        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                                        Loading company information...
                                    </div>
                                ) : (
                                    <div className="max-w-3xl space-y-8">
                                        {!isAdmin && (
                                            <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold">Read-Only View</p>
                                                    <p className="opacity-90">Only Administrators can manage organization details. You are viewing these details in read-only mode.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Company Name</label>
                                                <input
                                                    type="text"
                                                    disabled={!isAdmin}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                                    value={companyForm.name}
                                                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                                    placeholder="e.g. Acme Corp"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Employee Capacity</label>
                                                <input
                                                    type="text"
                                                    disabled={!isAdmin}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                                    value={companyForm.employeeCapacity}
                                                    onChange={(e) => setCompanyForm({ ...companyForm, employeeCapacity: e.target.value })}
                                                    placeholder="e.g. 100-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">HRMS Organisation ID</label>
                                                <input
                                                    type="text"
                                                    disabled={!isAdmin}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all font-mono text-sm"
                                                    value={companyForm.hrmsOrganisationId}
                                                    onChange={(e) => setCompanyForm({ ...companyForm, hrmsOrganisationId: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-gray-700">Company Address</label>
                                                <textarea
                                                    disabled={!isAdmin}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all resize-none"
                                                    value={companyForm.address}
                                                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                                                    rows={3}
                                                    placeholder="Official business address"
                                                />
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="flex justify-end pt-6 border-t border-gray-100">
                                                <button
                                                    onClick={handleUpdateCompany}
                                                    disabled={companyLoading}
                                                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md shadow-purple-200 disabled:opacity-50 flex items-center gap-2 font-medium transition-transform active:scale-95"
                                                >
                                                    {companyLoading ? "Saving..." : <><Save className="w-4 h-4" /> Update Company Details</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    resetPasswordModal();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            {modalSuccess ? (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h4>
                                    <p className="text-gray-500">Your account is now secure with the new password.</p>
                                </div>
                            ) : passwordStep === "verify" ? (
                                <div className="space-y-5">
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        To ensure your security, please enter your current password to receive a verification OTP.
                                    </p>
                                    <div className="space-y-4">
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            placeholder="Current Password"
                                        />
                                        {error && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                                        <button
                                            onClick={handleSendOtp}
                                            disabled={loading || !currentPassword}
                                            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all"
                                        >
                                            {loading ? "Sending OTP..." : "Send Verification OTP"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm mb-4">
                                        OTP sent to your email. Please check your inbox.
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-center tracking-[0.5em] font-bold text-lg"
                                        placeholder="------"
                                        maxLength={6}
                                    />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                        placeholder="New Password"
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                        placeholder="Confirm Password"
                                    />
                                    {error && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={loading}
                                        className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all"
                                    >
                                        Set New Password
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
