import React, { useState } from "react";
import { Mail, AlertCircle, Shield, ChevronRight, Globe, Bot, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/axiosApi";

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post("/auth/forgot-password", { email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Dark Gradient */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900" />

                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg tracking-wide">AVYUKT</h2>
                            <p className="text-purple-300/70 text-xs tracking-widest">CORE TECHNOLOGIES</p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        <h1 className="text-5xl font-bold text-white leading-tight">
                            Account<br />
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Recovery.
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                            Secure your access with our multi-factor authentication recovery system.
                        </p>
                    </div>

                    {/* Bottom Section */}
                    <div className="space-y-4">
                        {/* Quantum Secure Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 text-sm font-medium">OTP VERIFIED RECOVERY</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Light Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-full max-w-md space-y-8">
                    {/* Back Link */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Login</span>
                    </Link>

                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <p className="text-purple-600 text-sm font-semibold tracking-widest mb-2">PASSWORD RECOVERY</p>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
                        <p className="text-gray-500">
                            Enter your email address and we'll send you a verification code.
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
                                <p className="text-gray-600 text-sm">
                                    We've sent a verification code to <strong>{email}</strong>.
                                    Please check your inbox and follow the instructions.
                                </p>
                            </div>

                            <Link
                                to={`/reset-password?email=${encodeURIComponent(email)}`}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                ENTER VERIFICATION CODE
                                <ChevronRight className="w-5 h-5" />
                            </Link>

                            <button
                                onClick={() => setSuccess(false)}
                                className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors text-sm"
                            >
                                Didn't receive the email? Try again
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {/* Email Field */}
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                                    placeholder="Enter your email address"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center text-red-700">
                                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        SEND VERIFICATION CODE
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Bottom Status */}
                    <div className="flex items-center justify-center gap-6 pt-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <Globe className="w-4 h-4" />
                            <span>GLOBAL NODE - LONDON</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <Bot className="w-4 h-4" />
                            <span>AI AGENT READY</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-400 text-xs">
                        Avyukt Core Technologies
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
