import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
    User,
    Edit,
    Shield,
    Settings,
    Activity,
    Users,
    Mail,
    Phone,
    Calendar,
    Building2,
    Lock,
    Eye,
    CheckCircle,
    AlertCircle,
    X,
    KeyRound,
    ChevronRight,
} from "lucide-react";
import api from "../utils/axiosApi";

interface TabProps {
    label: string;
    icon: React.ElementType;
    active: boolean;
    onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${active
                ? "text-purple-600 border-purple-600 bg-purple-50/50"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const UserProfile: React.FC = () => {
    const { userProfile, email } = useSelector((state: RootState) => state.auth);
    const [activeTab, setActiveTab] = useState("profile");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordStep, setPasswordStep] = useState<"verify" | "otp" | "newPassword">("verify");
    const [currentPassword, setCurrentPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const tabs = [
        { id: "profile", label: "MY PROFILE", icon: User },
        { id: "edit", label: "EDIT PROFILE", icon: Edit },
        { id: "security", label: "SECURITY SETTINGS", icon: Shield },
        { id: "preferences", label: "PREFERENCES", icon: Settings },
        { id: "activity", label: "ACTIVITY LOG", icon: Activity },
        { id: "access", label: "ACCESS & ROLES", icon: Users },
    ];

    const handleSendOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/send-change-password-otp", { currentPassword });
            setPasswordStep("otp");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to verify password");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/change-password", { otp, newPassword });
            setSuccess(true);
            setTimeout(() => {
                setShowPasswordModal(false);
                resetPasswordModal();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const resetPasswordModal = () => {
        setPasswordStep("verify");
        setCurrentPassword("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        setSuccess(false);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get permissions array for display
    const permissions = userProfile?.permissions || {};
    const permissionKeys = typeof permissions === "object" ? Object.keys(permissions) : [];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Card */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white py-12 rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                <User className="w-12 h-12 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{userProfile?.fullname || "User"}</h2>
                            <p className="text-purple-600 font-medium text-sm tracking-wide uppercase mt-1">
                                {userProfile?.role || "User"}
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-3 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span>ACTIVE - ACCOUNT VERIFIED</span>
                            </div>
                        </div>

                        {/* Access Context */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
                            <h3 className="text-xs font-semibold tracking-widest text-gray-400 mb-4">ACCESS CONTEXT</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">ROLE</p>
                                        <p className="font-medium capitalize">{userProfile?.role || "User"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <User className="w-3 h-3" />
                                        <span>EMPLOYEE ID</span>
                                    </div>
                                    <p className="font-medium text-gray-900">{userProfile?._id?.toUpperCase() || "N/A"}</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <Building2 className="w-3 h-3" />
                                        <span>DEPARTMENT</span>
                                    </div>
                                    <p className="font-medium text-gray-900 capitalize">{userProfile?.role || "N/A"}</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <Mail className="w-3 h-3" />
                                        <span>EMAIL ADDRESS</span>
                                    </div>
                                    <p className="font-medium text-gray-900">{email || userProfile?.email || "N/A"}</p>
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <Calendar className="w-3 h-3" />
                                        <span>LAST SECURE SESSION</span>
                                    </div>
                                    <p className="font-medium text-gray-900">{formatDate(new Date().toISOString())}</p>
                                </div>
                            </div>
                        </div>

                        {/* Security Actions */}
                        <div className="bg-white flex items-center justify-between rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                            </div>

                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25"
                            >
                                <Lock className="w-4 h-4" />
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    resetPasswordModal();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {success ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Password Changed!</h4>
                                    <p className="text-gray-500">Your password has been updated successfully.</p>
                                </div>
                            ) : passwordStep === "verify" ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Enter your current password to verify your identity.
                                    </p>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                            placeholder="Current Password"
                                        />
                                    </div>
                                    {error && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={loading || !currentPassword}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Send OTP to Email
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : passwordStep === "otp" ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Enter the 6-digit OTP sent to your email and create a new password.
                                    </p>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <KeyRound className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-center tracking-widest font-mono"
                                            placeholder="Enter OTP"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                            placeholder="New Password"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                            placeholder="Confirm New Password"
                                        />
                                    </div>
                                    {error && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={loading || !otp || !newPassword || !confirmPassword}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Change Password
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
