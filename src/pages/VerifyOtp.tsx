import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOtpUser, resendOtpUser, clearError } from "../redux/slices/authSlice";
import { RootState } from "../redux/store";

import { ShieldCheck, AlertCircle, Clock } from "lucide-react";

const VerifyOtp: React.FC = () => {
  const dispatch = useDispatch<any>();

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";

  const { loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  // timer countdown
  useEffect(() => {
    const t = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(verifyOtpUser({ email, otp }));
  };

  const handleResend = () => {
    if (timer > 0) return;
    dispatch(resendOtpUser(email));
    setTimer(60);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="bg-white p-8 max-w-md w-full rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800">
            Verify Email
          </h2>
          <p className="text-gray-600 text-sm">
            Enter the OTP sent to <b>{email}</b>
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-6 space-y-6">
          <input
            type="text"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border rounded-lg p-3 text-center text-xl tracking-widest"
            placeholder="●●●●●●"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="text-center text-sm text-gray-600">
            {timer > 0 ? (
              <span className="flex items-center justify-center gap-1">
                <Clock size={16} /> Resend OTP in {timer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-indigo-600 font-semibold"
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
