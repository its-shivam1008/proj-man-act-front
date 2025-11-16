import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../redux/slices/authSlice";
import { RootState } from "../redux/store";
import { Lock, Mail, AlertCircle } from "lucide-react";

const Login: React.FC = () => {
  const dispatch = useDispatch<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isAuthenticated && token) {
      window.location.href = "/";
    } 
  }, [isAuthenticated, token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome to SCM Pro
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your supply chain management dashboard
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 inset-y-0 text-gray-400 w-5 h-5 my-auto" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 inset-y-0 text-gray-400 w-5 h-5 my-auto" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Don’t have an account?{" "}
            <a className="text-blue-600 font-semibold" href="/signup">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
