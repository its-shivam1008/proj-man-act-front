import React, { useState, useEffect } from "react";
import { User, Mail, Lock, AlertCircle, Shield, ChevronRight, Globe, Bot } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../redux/slices/authSlice";
import { RootState } from "../redux/store";
import { Link } from "react-router-dom";

const Signup: React.FC = () => {
  const dispatch = useDispatch<any>();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loading, error, emailForVerification } = useSelector(
    (state: RootState) => state.auth
  );

  // Redirect to OTP page after signup
  useEffect(() => {
    if (emailForVerification) {
      window.location.href = `/verify-otp?email=${emailForVerification}`;
    }
  }, [emailForVerification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch(
      signupUser({
        fullname,
        email,
        password,
      })
    );
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
              Welcome to<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                SCM Pro.
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              Sign in to your supply chain management dashboard. Experience unified operations with AI-powered insights.
            </p>
          </div>

          {/* Bottom Section */}
          <div className="space-y-4">
            {/* Trust Badges */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-slate-900 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{i}</span>
                  </div>
                ))}
              </div>
              <span className="text-gray-400 text-sm">JOIN 500+ ENTERPRISES</span>
            </div>

            {/* Quantum Secure Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">ENTERPRISE GRADE SECURITY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Light Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center lg:text-left">
            <p className="text-purple-600 text-sm font-semibold tracking-widest mb-2">NEW ACCOUNT</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-500">
              Register to access the SCM Pro dashboard and start managing your supply chain.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                placeholder="Full Name"
              />
            </div>

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
                placeholder="Enterprise Email"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                placeholder="Create Password"
              />
            </div>

            {/* Password Requirements */}
            <p className="text-xs text-gray-400">
              Password must be 8+ characters with uppercase, lowercase, number, and special character.
            </p>

            {/* Error Box */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Btn */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  CREATE ACCOUNT
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <p className="text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
              Sign in
            </Link>
          </p>

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

export default Signup;
