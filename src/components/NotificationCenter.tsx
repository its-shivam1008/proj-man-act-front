import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchNotifications, respondToInvite, respondToMaterialPurchase, respondToMaterialRequest, markAsRead } from "@/redux/slices/notificationSlice";
import { updateUserProfile } from "@/redux/slices/authSlice";
import {
  Bell,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Check,
  X,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BASE_URL } from "@/utils/constants";

interface NotificationCenterProps {
  destination: string; 
  title?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  destination,
  title = "Notifications",
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { list, loading } = useSelector((state: RootState) => state.notification);
  const { userProfile } = useSelector((state: RootState) => state.auth);

  const [cooldown, setCooldown] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // console.log("yes chal gya if :",JSON.parse(stored as string))
  const fetchNotificationHelper = () => {
    
    if (title === "dashboardAlerts" && userProfile) {
      dispatch(fetchNotifications({ 
        receiverId: userProfile._id, 
        status: "unread" as const 
      }));
    } else if (destination) {
      dispatch(fetchNotifications({ 
        destination: destination, 
        status: "unread" as const 
      }));
    } else {
      console.log('⚠️ No valid fetch criteria - title:', title, 'destination:', destination);
    }
  }
  useEffect(() => {
    fetchNotificationHelper();
  }, [dispatch, destination]);

  // Filter notifications based on destination for better accuracy
  const filteredNotifications = React.useMemo(() => {
    if (title === "dashboardAlerts") {
      // For dashboard alerts, show all notifications for the user
      return list;
    } else if (destination) {
      // For specific destinations, only show notifications that exactly match
      return list.filter(notification => {
        // For Purchase Order page, only show RFQ to PO notifications
        if (destination === "purchase.orders") {
          return notification.destination === "purchase.orders" && 
                 notification.type === "rfqToPurchaseOrder";
        }
        // For other destinations, use exact match
        return notification.destination === destination;
      });
    }
    return list;
  }, [list, destination, title]);

  // Auto-open logic for pending invites
  useEffect(() => {
    if (!loading && filteredNotifications.length > 0 && !hasAutoOpened) {
      const hasPendingInvite = filteredNotifications.some((n: any) => n.type === 'invite' && n.inviteResponse === 'pending');
      if (hasPendingInvite) {
        setIsOpen(true);
        setHasAutoOpened(true); // Prevent repeated opening
      }
    }
  }, [filteredNotifications, loading, hasAutoOpened]);

  // Handle Cooldown Timer logic
  useEffect(() => {
    if (cooldown > 0) {
      intervalRef.current = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cooldown]);

  const handleRefresh = () => {
    if (cooldown > 0) return;
    fetchNotificationHelper();
    setCooldown(30);
  };

  const handleInviteResponse = async (notificationId: string, response: "accepted" | "rejected") => {
    try {
      const result = await dispatch(respondToInvite({ notificationId, response })).unwrap();
      
      // If invite was accepted and we got updated user data, update the auth state
      if (response === "accepted" && result.updatedUser) {
        dispatch(updateUserProfile({ updatedUser: result.updatedUser }));
      }
      
      // Refresh notifications to update the UI
      fetchNotificationHelper();
    } catch (error) {
      console.error('Failed to respond to invite:', error);
    }
  };

  const handleMaterialRequestResponse = async (notificationId: string, response: "accepted" | "rejected") => {
    try {
      const result = await dispatch(respondToMaterialRequest({ notificationId, response })).unwrap();
      
      if (response === "accepted") {
        // Show success message
        
        // Close the notification center first
        setIsOpen(false);
        
        // Fetch the notification data directly from database and trigger auto-fill
        try {
          const apiUrl = BASE_URL || 'http://localhost:4000';
          const notificationResponse = await fetch(`${apiUrl}/notifications/${notificationId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json();
            
            if (notificationData.materialData) {
              // Dispatch a custom event to trigger immediate auto-fill
              const autoFillEvent = new CustomEvent('rfqAutoFill', {
                detail: notificationData.materialData
              });
              window.dispatchEvent(autoFillEvent);
            } else {
              alert("✅ Material request accepted! However, no material data was found. Please create RFQ manually.");
            }
          } else {
            alert("✅ Material request accepted! However, failed to fetch material data. Please create RFQ manually.");
          }
        } catch (fetchError) {
          alert("✅ Material request accepted! However, failed to fetch material data. Please create RFQ manually.");
        }
      } else {
        alert("Material request rejected successfully.");
      }
      
      // Refresh notifications to update the UI
      fetchNotificationHelper();
    } catch (error) {
      console.error('Failed to respond to material request:', error);
      alert("Failed to process material request response. Please try again.");
    }
  };

  const handleMaterialPurchaseResponse = (notificationId: string, response: "accepted" | "rejected") => {
    dispatch(respondToMaterialPurchase({ notificationId, response }));
  };

  // Handle RFQ to Purchase Order notification accept/reject
  const handleRfqToPoResponse = async (notificationId: string, response: "accepted" | "rejected") => {
    try {
      // Use the new RFQ to PO response endpoint
      const apiUrl = BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/purchase/orders/rfq-to-po-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notificationId, response })
      });

      if (res.ok) {
        const result = await res.json();
        
        if (response === "accepted") {
          console.log("✅ RFQ to PO notification accepted successfully");
          
          // Close the notification center first
          setIsOpen(false);
          
          // Dispatch custom event for Purchase Order autofill
          if (result.materialData) {
            const autoFillEvent = new CustomEvent('rfq_to_po_autofill', {
              detail: result.materialData
            });
            window.dispatchEvent(autoFillEvent);
            
            console.log("🎯 RFQ to PO autofill event dispatched with material data");
          } else {
            console.warn("⚠️ No material data found in RFQ notification");
            alert("✅ RFQ accepted! However, no material data was found. Please create Purchase Order manually.");
          }
        } else {
          console.log("❌ RFQ to PO notification rejected");
          alert("RFQ notification rejected successfully.");
        }
        
        // Refresh notifications to update the UI
        fetchNotificationHelper();
      } else {
        const errorData = await res.json();
        console.error("❌ RFQ to PO response error:", errorData);
        alert(errorData.message || 'Failed to process RFQ notification response');
      }
    } catch (error) {
      console.error('Failed to respond to RFQ to PO notification:', error);
      alert("Failed to process RFQ notification response. Please try again.");
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
      fetchNotificationHelper();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const unreadCount = filteredNotifications.filter((n: any) => n.status === "unread").length;

  // Debug logging for notifications
  useEffect(() => {
    console.log('🔍 NotificationCenter - Current state:', {
      destination,
      title,
      listLength: list.length,
      filteredLength: filteredNotifications.length,
      unreadCount,
      loading,
      allNotifications: list.map(n => ({
        id: n._id,
        type: n.type,
        itemName: n.itemName,
        status: n.status,
        destination: n.destination
      })),
      filteredNotifications: filteredNotifications.map(n => ({
        id: n._id,
        type: n.type,
        itemName: n.itemName,
        status: n.status,
        destination: n.destination
      }))
    });
  }, [list, filteredNotifications, destination, title, loading]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[80vh] sm:h-[600px] p-0 gap-0 bg-white">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <DialogTitle>{title}</DialogTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {unreadCount} New
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={cooldown > 0 || loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""} ${
                  cooldown > 0 ? "text-gray-300" : "text-gray-600"
                }`}
              />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-0 bg-gray-50/50">
          {loading && list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <RefreshCcw className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Checking for updates...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-200 mb-4" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification: any) => {
                const isInvite = notification.type === 'invite';
                const isPendingInvite = isInvite && notification.inviteResponse === 'pending';
                const isMaterialPurchase = notification.type === 'rawMaterialPurchase';
                const isPendingMaterialPurchase = isMaterialPurchase && notification.inviteResponse === 'pending';
                const isMaterialRequest = notification.type === 'general';
                const isPendingMaterialRequest = isMaterialRequest && notification.inviteResponse === 'pending';
                const isLowStockNotification = notification.type === 'low_stock_raw_material' || notification.type === 'low_stock_product';
                const isRfqToPoNotification = notification.type === 'rfqToPurchaseOrder';
                const isPendingRfqToPoNotification = isRfqToPoNotification && notification.inviteResponse === 'pending';
                const isMaterialAvailableNotification = notification.type === 'material_available';

                // Debug logging
                console.log('🔍 Notification debug:', {
                  id: notification._id,
                  type: notification.type,
                  inviteResponse: notification.inviteResponse,
                  isMaterialRequest,
                  isPendingMaterialRequest,
                  isRfqToPoNotification,
                  isPendingRfqToPoNotification,
                  isMaterialAvailableNotification,
                  itemName: notification.itemName,
                  destination: notification.destination,
                  source: notification.source
                });

                return (
                  <div
                    key={notification._id}
                    className={`p-4 transition-colors bg-white hover:bg-gray-50 ${
                      notification.status === "unread" ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-1 p-2 rounded-full shrink-0 ${
                          isInvite ? "bg-purple-100 text-purple-600" :
                          notification.type === "deadline_reminder" ? "bg-red-100 text-red-600" :
                          isLowStockNotification ? "bg-yellow-100 text-yellow-600" :
                          isMaterialRequest ? "bg-blue-100 text-blue-600" :
                          isRfqToPoNotification ? "bg-green-100 text-green-600" :
                          isMaterialAvailableNotification ? "bg-emerald-100 text-emerald-600" :
                          notification.source?.includes("procurement") ? "bg-orange-100 text-orange-600" :
                          notification.source?.includes("delivery") ? "bg-green-100 text-green-600" :
                          "bg-blue-100 text-blue-600"
                      }`}>
                        {isInvite ? <UserPlus className="h-4 w-4" /> : 
                         notification.type === "deadline_reminder" ? <Bell className="h-4 w-4" /> :
                         isLowStockNotification ? <AlertCircle className="h-4 w-4" /> :
                         isMaterialAvailableNotification ? <CheckCircle className="h-4 w-4" /> :
                         <AlertCircle className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                             {isInvite ? "Organization Invitation" : 
                              notification.type === "deadline_reminder" ? notification.title :
                              isLowStockNotification ? notification.title :
                              isMaterialRequest ? "Material Request for RFQ" :
                              isRfqToPoNotification ? "RFQ Ready for Purchase Order" :
                              isMaterialAvailableNotification ? "Material Available in Inventory" :
                              (notification.itemName ? `Item: ${notification.itemName}` : "New Update")}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 break-words">
                          {notification.type === "deadline_reminder" ? 
                            notification.message : 
                            (notification.remark || "No additional remarks provided.")}
                        </p>
                        
                        {/* Material Information for RFQ/Procurement notifications */}
                        {notification.materialData && notification.destination === "rfq.purchase" && (
                          <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-xs text-orange-800 space-y-1">
                              <div className="flex justify-between items-center">
                                <span><strong>Quantity Required:</strong> {notification.materialData.quantity} {notification.materialData.unit}</span>
                                {notification.materialData.procurementContext?.urgency === 'High' && (
                                  <Badge variant="destructive" className="text-[10px] h-4 px-1">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              {notification.materialData.sourceTask && notification.materialData.sourceTask !== 'N/A' && (
                                <div><strong>Source Task:</strong> {notification.materialData.sourceTask}</div>
                              )}
                              {notification.materialData.projectName && notification.materialData.projectName !== 'N/A' && (
                                <div><strong>Project:</strong> {notification.materialData.projectName}</div>
                              )}
                              {notification.materialData.requiredDate && (
                                <div><strong>Required By:</strong> {new Date(notification.materialData.requiredDate).toLocaleDateString()}</div>
                              )}
                              {notification.materialData.financialInfo?.estimatedCost && notification.materialData.financialInfo.estimatedCost > 0 && (
                                <div><strong>Estimated Cost:</strong> ₹{notification.materialData.financialInfo.estimatedCost.toLocaleString()}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Material Information for Delivery notifications */}
                        {notification.materialData && notification.destination === "delivery.inventory" && (
                          <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-xs text-green-800 space-y-1">
                              <div><strong>Quantity to Deliver:</strong> {notification.materialData.quantity} {notification.materialData.unit}</div>
                              {notification.materialData.sourceTask && notification.materialData.sourceTask !== 'N/A' && (
                                <div><strong>Destination Task:</strong> {notification.materialData.sourceTask}</div>
                              )}
                              {notification.materialData.projectName && notification.materialData.projectName !== 'N/A' && (
                                <div><strong>Project:</strong> {notification.materialData.projectName}</div>
                              )}
                              {notification.materialData.requiredDate && (
                                <div><strong>Required By:</strong> {new Date(notification.materialData.requiredDate).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* RFQ Sent Information */}
                         {/* {notification.materialData && notification.source === "purchase.rfq" && notification.materialData.materials && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-800 space-y-1">
                              <div><strong>Items in RFQ:</strong> {notification.materialData.totalItems}</div>
                              <div><strong>Vendors Contacted:</strong> {notification.materialData.vendorsSent}/{notification.materialData.totalVendors}</div>
                              <div><strong>Total Estimated Value:</strong> ₹{notification.materialData.totalEstimatedValue?.toLocaleString()}</div>
                              {notification.materialData.deliveryDate && (
                                <div><strong>Required Delivery:</strong> {new Date(notification.materialData.deliveryDate).toLocaleDateString()}</div>
                              )}
                              {notification.materialData.materials && notification.materialData.materials.length > 0 && (
                                <div className="mt-2">
                                  <strong>Materials:</strong>
                                  <ul className="mt-1 space-y-1">
                                    {notification.materialData.materials.slice(0, 3).map((material: any, index: number) => (
                                      <li key={index} className="flex justify-between">
                                        <span>{material.name}</span>
                                        <span>{material.quantity} {material.unit}</span>
                                      </li>
                                    ))}
                                    {notification.materialData.materials.length > 3 && (
                                      <li className="text-gray-600">...and {notification.materialData.materials.length - 3} more items</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                         */}
                        {/* RFQ to PO Information */}
                        {notification.materialData && notification.type === "rfqToPurchaseOrder" && (
                          <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-xs text-green-800 space-y-1">
                              <div><strong>RFQ Number:</strong> {notification.materialData.rfqNumber}</div>
                              <div><strong>Materials Count:</strong> {notification.materialData.materials?.length || 0}</div>
                              <div><strong>Item Type:</strong> {notification.materialData.itemType}</div>
                              {notification.materialData.deliveryDate && (
                                <div><strong>Delivery Date:</strong> {new Date(notification.materialData.deliveryDate).toLocaleDateString()}</div>
                              )}
                              {notification.materialData.materials && notification.materialData.materials.length > 0 && (
                                <div className="mt-2">
                                  <strong>Materials:</strong>
                                  <ul className="mt-1 space-y-1">
                                    {notification.materialData.materials.slice(0, 3).map((material: any, index: number) => (
                                      <li key={index} className="flex justify-between">
                                        <span>{material.name}</span>
                                        <span>{material.quantity} {material.uom}</span>
                                      </li>
                                    ))}
                                    {notification.materialData.materials.length > 3 && (
                                      <li className="text-gray-600">...and {notification.materialData.materials.length - 3} more items</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Material Available Information */}
                        {isMaterialAvailableNotification && notification.materialData && (
                          <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="text-xs text-emerald-800 space-y-1">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                <span><strong>Material Available:</strong></span>
                              </div>
                              <div><strong>Quantity:</strong> {notification.materialData.quantity} {notification.materialData.unit}</div>
                              <div><strong>Source:</strong> {notification.materialData.source}</div>
                              {notification.materialData.addedDate && (
                                <div><strong>Added:</strong> {new Date(notification.materialData.addedDate).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Stock Information for materials with low stock */}
                        {notification.materialData?.stockInfo?.isLowStock && (
                          <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-xs text-red-800 flex items-center gap-2">
                              <AlertCircle className="h-3 w-3" />
                              <span><strong>Low Stock Alert:</strong> Only {notification.materialData.stockInfo.currentStock} units available</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Deadline Reminder Info */}
                        {notification.type === "deadline_reminder" && notification.metadata && (
                          <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-xs text-red-800 space-y-1">
                              <div><strong>Project:</strong> {notification.metadata.projectName}</div>
                              <div><strong>Task:</strong> {notification.metadata.wbsName}</div>
                              <div><strong>Deadline:</strong> {new Date(notification.metadata.deadline).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Low Stock Information */}
                        {isLowStockNotification && notification.metadata && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="text-xs text-yellow-800 space-y-1">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" />
                                <span><strong>Stock Alert:</strong></span>
                              </div>
                              <div><strong>Current Stock:</strong> {notification.metadata.currentStock} {notification.metadata.unitOfMeasure || 'units'}</div>
                              {notification.type === 'low_stock_raw_material' && (
                                <div><strong>Reorder Level:</strong> {notification.metadata.reorderLevel} {notification.metadata.unitOfMeasure || 'units'}</div>
                              )}
                              {notification.type === 'low_stock_product' && (
                                <div><strong>Minimum Stock:</strong> {notification.metadata.minStock} units</div>
                              )}
                              {notification.metadata.itemCode && (
                                <div><strong>Item Code:</strong> {notification.metadata.itemCode}</div>
                              )}
                              {notification.metadata.sku && (
                                <div><strong>SKU:</strong> {notification.metadata.sku}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Invite Actions */}
                        {/* {!isInvite && !isMaterialRequest && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleInviteResponse(notification._id, "accepted")}
                            >
                              <Check className="h-3 w-3 mr-1" /> Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-3 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleInviteResponse(notification._id, "rejected")}
                            >
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )} */}

                        {/* Material Purchase Actions */}
                        {/* {isPendingMaterialPurchase && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleMaterialPurchaseResponse(notification._id, "accepted")}
                            >
                              <Check className="h-3 w-3 mr-1" /> Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-3 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleMaterialPurchaseResponse(notification._id, "rejected")}
                            >
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )} */}

                        {/* Material Request Actions */}
                        {isPendingMaterialRequest && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleMaterialRequestResponse(notification._id, "accepted")}
                            >
                              <Check className="h-3 w-3 mr-1" /> Accept & Auto-fill RFQ
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-3 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleMaterialRequestResponse(notification._id, "rejected")}
                              >
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}

                        {/* RFQ to PO Actions */}
                        {/* {isPendingRfqToPoNotification && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleRfqToPoResponse(notification._id, "accepted")}
                            >
                              <Check className="h-3 w-3 mr-1" /> Accept & Auto-fill PO
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-3 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRfqToPoResponse(notification._id, "rejected")}
                            >
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )} */}

                        {isInvite && !isPendingInvite && (
                           <div className="mt-2">
                             <Badge variant={notification.inviteResponse === 'accepted' ? 'default' : 'destructive'} className="text-[10px]">
                               {notification.inviteResponse === 'accepted' ? 'Accepted' : 'Rejected'}
                             </Badge>
                           </div>
                        )}

                        {isMaterialPurchase && !isPendingMaterialPurchase && (
                           <div className="mt-2">
                             <Badge variant={notification.inviteResponse === 'accepted' ? 'default' : 'destructive'} className="text-[10px]">
                               {notification.inviteResponse === 'accepted' ? 'Accepted' : 'Rejected'}
                             </Badge>
                           </div>
                        )}
                        
                        {isMaterialRequest && !isPendingMaterialRequest && (
                           <div className="mt-2">
                             <Badge variant={notification.inviteResponse === 'accepted' ? 'default' : 'destructive'} className="text-[10px]">
                               {notification.inviteResponse === 'accepted' ? 'Accepted - RFQ Ready' : 'Rejected'}
                             </Badge>
                           </div>
                        )}
                        
                        {isRfqToPoNotification && !isPendingRfqToPoNotification && (
                           <div className="mt-2">
                             <Badge variant={notification.inviteResponse === 'accepted' ? 'default' : 'destructive'} className="text-[10px]">
                               {notification.inviteResponse === 'accepted' ? 'Accepted - PO Ready' : 'Rejected'}
                             </Badge>
                           </div>
                        )}
                        
                        
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenter;