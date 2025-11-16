import React, { useState, useEffect } from "react";
import { User, Mail, Lock, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../redux/slices/authSlice";
import { RootState } from "../redux/store"; // adjust your path

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Register to access the SCM Pro dashboard
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="appearance-none rounded-lg block w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-purple-500 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-lg block w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-purple-500 focus:outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-lg block w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-purple-500 focus:outline-none"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            {/* Error Box */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Btn */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* Switch to Login */}
          <p className="text-center mt-4 text-sm text-gray-600">
            Already have an account?
            <a href="/login" className="text-purple-600 font-semibold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
