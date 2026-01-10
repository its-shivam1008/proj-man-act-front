"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchPurchaseAgreements } from "@/redux/slices/purchase/purchaseAgreementSlice";
import ReportShell from "./ReportShell";
import { Eye } from "lucide-react";

/* ---------------- SAFE DATE FORMAT ---------------- */
const formatDate = (date?: string | Date) => {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

/* ---------------- STATUS BADGE ---------------- */
const StatusBadge = ({ status }: { status: string }) => {
  const map: any = {
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        map[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

export default function AgreementReport() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    purchaseAgreements,
    loading,
    error,
    meta,
  } = useSelector((state: RootState) => state.purchaseAgreements);

  const [page, setPage] = useState(1);
  const limit = 10;

  /* ---------------- FETCH AGREEMENTS ---------------- */
  useEffect(() => {
    dispatch(fetchPurchaseAgreements({ page, limit }));
  }, [dispatch, page, limit]);

  return (
    <ReportShell
      title="Agreement Report"
      subtitle="Contract value, validity & vendor agreements"
    >
      {/* ---------------- ERROR ---------------- */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* ---------------- TABLE ---------------- */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Agreements</h3>
          <span className="text-sm text-gray-500">
            Page {page} of {meta?.totalPages ?? 1}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Agreement No</th>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3 text-right">Value</th>
              <th className="p-3 text-left">Period</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  Loading agreements...
                </td>
              </tr>
            )}

            {!loading && purchaseAgreements.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No agreements found
                </td>
              </tr>
            )}

            {!loading &&
              purchaseAgreements.map((a) => (
                <tr
                  key={a.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3 font-medium">
                    {a.agreementNumber}
                  </td>

                  <td className="p-3">{a.vendor}</td>

                  <td className="p-3 text-right font-semibold">
                    ₹{a.totalValue?.toLocaleString()}
                  </td>

                  <td className="p-3 text-sm text-gray-600">
                    {formatDate(a.startDate)} → {formatDate(a.endDate)}
                  </td>

                  <td className="p-3">
                    <StatusBadge status={a.status} />
                  </td>

                  <td className="p-3 text-center">
                    <button className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* ---------------- PAGINATION ---------------- */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page === meta?.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </ReportShell>
  );
}
