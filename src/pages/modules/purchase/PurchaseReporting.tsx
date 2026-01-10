import { usePermission } from "@/hooks/userPermission";

import PurchaseReports from "@/components/reports/purchaseReport/PurchaseReports";
import { ShieldAlert } from "lucide-react";




const PurchaseReporting: React.FC = () => {
  const canView = usePermission("purchaseReporting", "view");

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Purchase Summary Report</h3>
        </div>
        <div className=" p-5">
          <PurchaseReports/>
         
        </div>
      </div>
    </div>
  );
};

export default PurchaseReporting;