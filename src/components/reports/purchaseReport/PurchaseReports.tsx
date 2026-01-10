import { useState } from "react";
import PurchaseOrderReport from "./PurchaseOrderReport";
import RFQReport from "./RFQReport";
import VendorReport from "./VendorReport";
import AgreementReport from "./AgreementReport";

export default function PurchaseReports() {
  const [active, setActive] = useState("po");

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {["po","rfq","vendor","agreement"].map(t => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-2 rounded-lg text-sm ${
              active === t
                ? "bg-gray-900 text-white"
                : "bg-gray-100"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {active === "po" && <PurchaseOrderReport />}
      {active === "rfq" && <RFQReport />}
      {active === "vendor" && <VendorReport />}
      {active === "agreement" && <AgreementReport />}
    </div>
  );
}
