import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchNotifications, respondToInvite } from "@/redux/slices/notificationSlice";
import { updateUserProfile } from "@/redux/slices/authSlice";
import {
  Bell,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Check,
  X,
  Package,
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

export default function NotificationHeader() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { list: notifications, loading } = useSelector((state: RootState) => state.notification);
  const { userProfile } = useSelector((state: RootState) => state.auth);
  
  const [cooldown, setCooldown] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const organisationId = localStorage.getItem("organisationId");

  // Determine destination based on current page
  const currentDestination = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/purchase/rfq")) return "rfq.purchase";
    if (path.includes("/inventory/operations/deliveries")) return "delivery.inventory";
    if (path === "/" || path.includes("/dashboard")) return "dashboard";
    if (path.includes("/wbs")) return "wbs";
    if (path.includes("/scheduling")) return "scheduling";
    // Add MRS page destination mapping - check for various MRS related paths
    if (path.includes("/procurement") || 
        path.includes("/material-request") || 
        path.includes("/mrs") ||
        path.includes("/material") ||
        path.toLowerCase().includes("procurement")) return "mrs.material-requests";
    return null;
  }, [location.pathname]);

  // Fetch notifications
  const fetchNotificationHelper = () => {
    if (!userProfile) {
      console.log('❌ No user profile found');
      return;
    }
    
    console.log('🔔 Fetching notifications for user:', userProfile._id, 'org:', organisationId, 'on page:', currentDestination);
    console.log('🌐 Current path:', location.pathname);
    console.log('👤 Full user profile:', {
      id: userProfile._id,
      email: userProfile.email,
      name: userProfile.fullname,
      organisationId: userProfile.organisationId
    });
    
    // Make a single call that gets both invite notifications and page-specific notifications
    const filters: any = { status: "unread" };
    
    // Add user ID to get invite notifications for this user
    filters.receiverId = userProfile._id;
    
    // Add destination filter if on a specific page
    if (currentDestination) {
      filters.destination = currentDestination;
    }
    
    console.log('📍 Fetching notifications with filters:', filters);
    dispatch(fetchNotifications(filters));
  };

  useEffect(() => {
    fetchNotificationHelper();
  }, [dispatch, currentDestination, userProfile, organisationId]);

  // Refetch when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔔 Dialog opened - refetching notifications');
      fetchNotificationHelper();
    }
  }, [isOpen]);

  // Auto-refresh notifications every 5 seconds for testing (COMMENTED OUT FOR PRODUCTION)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (userProfile) {
  //       console.log('🔄 Auto-refreshing notifications...');
  //       fetchNotificationHelper();
  //     }
  //   }, 5000); // Refresh every 5 seconds

  //   return () => clearInterval(interval);
  // }, [userProfile]);

  // Filter notifications based on current page
  const filteredNotifications = useMemo(() => {
    console.log('🔍 Filtering notifications:', {
      total: notifications.length,
      currentDestination,
      notifications: notifications.map(n => ({ 
        id: n._id, 
        type: n.type, 
        destination: n.destination, 
        status: n.status,
        title: n.title || n.itemName 
      }))
    });
    
    // Show only page-specific notifications
    if (currentDestination) {
      // On specific pages: show ONLY that page's notifications
      const pageNotifications = notifications.filter(n => n.destination === currentDestination);
      
      // Also show material_available notifications on dashboard for visibility
      if (currentDestination === "dashboard") {
        const materialNotifications = notifications.filter(n => n.type === "material_available");
        return [...pageNotifications, ...materialNotifications].filter((notification, index, self) => 
          index === self.findIndex(n => n._id === notification._id)
        );
      }
      
      return pageNotifications;
    } else {
      // On dashboard/general pages: show general notifications + material_available notifications
      return notifications.filter(n => 
        !n.destination || n.destination === "dashboard" || n.type === "material_available"
      );
    }
  }, [notifications, currentDestination]);

  // Auto-open logic for pending invites
  useEffect(() => {
    if (!loading && filteredNotifications.length > 0 && !hasAutoOpened) {
      const hasPendingInvite = filteredNotifications.some((n: any) => n.type === 'invite' && n.inviteResponse === 'pending');
      if (hasPendingInvite) {
        setIsOpen(true);
        setHasAutoOpened(true);
      }
    }
  }, [filteredNotifications, loading, hasAutoOpened]);

  // Handle Cooldown Timer
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

  const handleMarkAllAsRead = async () => {
    try {
      setClearingAll(true);
      console.log('� Clear A ll button clicked');
      console.log('📋 Current state:', {
        userProfile: userProfile?._id,
        currentDestination,
        unreadCount,
        loading
      });

      // Get all notification IDs that are currently visible in the modal
      const visibleNotificationIds = allNotifications.map(notification => notification._id);
      
      console.log('📋 Marking these notifications as read:', {
        count: visibleNotificationIds.length,
        ids: visibleNotificationIds
      });

      if (visibleNotificationIds.length === 0) {
        console.log('⚠️ No notifications to clear');
        return;
      }

      // Mark each notification as read individually
      for (const notificationId of visibleNotificationIds) {
        try {
          await handleMarkAsRead(notificationId);
        } catch (error: any) {
          console.error('❌ Error marking notification as read:', notificationId, error);
        }
      }
      
      console.log('✅ Finished marking all notifications as read');
      
      // Refresh notifications to update the UI
      setTimeout(() => {
        fetchNotificationHelper();
      }, 500);
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error);
      alert('Error clearing notifications: ' + (error.message || 'Unknown error'));
    } finally {
      setClearingAll(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const apiUrl = BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        // Refresh notifications
        fetchNotificationHelper();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Debug: Show real notifications only
  const allNotifications = filteredNotifications;
  const unreadCount = allNotifications.filter((n: any) => n.status === "unread").length;
  
  console.log('🔔 NotificationHeader Debug:', {
    currentPath: location.pathname,
    currentDestination,
    totalNotifications: notifications.length,
    filteredNotifications: filteredNotifications.length,
    allNotifications: allNotifications.length,
    unreadCount,
    userProfile: userProfile?._id,
    organisationId,
    loading,
    notificationTypes: notifications.map(n => n.type),
    materialAvailableCount: notifications.filter(n => n.type === 'material_available').length
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6 text-gray-600" />
          {/* Show notification count - force show if any notifications exist */}
          {(unreadCount > 0 || allNotifications.length > 0) && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : Math.max(unreadCount, allNotifications.length)}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] flex flex-col h-[85vh] sm:h-[650px] p-0 gap-0 bg-white rounded-xl shadow-2xl">
        <DialogHeader className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">Notifications</DialogTitle>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-600 mt-0.5">{unreadCount} unread messages</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  console.log('🔔 Clear All button clicked - event triggered');
                  console.log('🔔 Button state:', { loading, unreadCount, disabled: loading || unreadCount === 0 });
                  console.log('🔔 About to call handleMarkAllAsRead...');
                  handleMarkAllAsRead();
                }}
                disabled={loading || unreadCount === 0 || clearingAll}
                className="h-9 px-3 hover:bg-red-100 rounded-lg text-xs bg-red-50 border border-red-200"
                title="Clear All Notifications"
              >
                {clearingAll ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Clear All ({unreadCount})
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={cooldown > 0 || loading}
                className="h-9 w-9 p-0 hover:bg-white/50 rounded-lg"
                title={cooldown > 0 ? `Wait ${cooldown}s` : "Refresh"}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""} ${
                    cooldown > 0 ? "text-gray-400" : "text-gray-700"
                  }`}
                />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-0 bg-gray-50/50">
          {loading && filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <RefreshCcw className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Checking for updates...</p>
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-200 mb-4" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No new notifications for this page</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allNotifications.map((notification: any) => {
                const isInvite = notification.type === 'invite';
                const isPendingInvite = isInvite && notification.inviteResponse === 'pending';
                // [!code focus:1] Check for material request type
                const isMaterialRequest = notification.type === 'material_request';
                const isMaterialAvailable = notification.type === 'material_available';
                console.log("here we go=",notification)
                return (
                  <div
                    key={notification._id}
                    className={`p-4 transition-all duration-200 border-l-4 ${
                      notification.status === "unread" 
                        ? "bg-blue-50/50 border-blue-500 hover:bg-blue-50" 
                        : "bg-white border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon Section */}
                      <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 shadow-sm ${
                          isInvite ? "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700" :
                          notification.type === "deadline_reminder" ? "bg-gradient-to-br from-red-100 to-red-200 text-red-700" :
                          // [!code focus:2] Add styling for Material Request
                          isMaterialRequest ? "bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700" :
                          isMaterialAvailable ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700" :
                          notification.source?.includes("procurement") ? "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700" :
                          notification.source?.includes("purchase") ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700" :
                          notification.source?.includes("delivery") ? "bg-gradient-to-br from-green-100 to-green-200 text-green-700" :
                          "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
                      }`}>
                        {isInvite ? <UserPlus className="h-4 w-4" /> : 
                         notification.type === "deadline_reminder" ? <Bell className="h-4 w-4" /> :
                         // [!code focus:1] Add Package Icon
                         isMaterialRequest ? <Package className="h-4 w-4" /> :
                         isMaterialAvailable ? <CheckCircle className="h-4 w-4" /> :
                         <AlertCircle className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                              {isInvite ? "Organization Invitation" : 
                               notification.type === "deadline_reminder" ? notification.title :
                               isMaterialAvailable ? "Material Available in Inventory" :
                               // [!code focus:1] Use title (which contains "Material Request from X") or fallback
                               (notification.title || notification.itemName || "New Update")}
                            </p>
                            {notification.status === "unread" && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-full">
                                NEW
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0 font-medium">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ""}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 break-words leading-relaxed whitespace-pre-line">
                          {notification.type === "deadline_reminder" ? 
                            notification.message : 
                            (notification.remark || "No additional remarks provided.")}
                        </p>
                        
                        {/* Material Available Information */}
                        {isMaterialAvailable && notification.materialData && (
                          <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="text-xs text-emerald-900 space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                <span className="font-semibold text-emerald-800">✅ Material Available</span>
                              </div>
                              <div><strong>Quantity:</strong> {notification.materialData.quantity} {notification.materialData.unit}</div>
                              <div><strong>Source:</strong> {notification.materialData.source}</div>
                              {notification.materialData.addedDate && (
                                <div><strong>Added:</strong> {new Date(notification.materialData.addedDate).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Enhanced Material Information for RFQ/Procurement notifications */}
                        {notification.materialData && notification.destination === "rfq.purchase" && (
                          <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-xs text-orange-900 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-orange-800">📦 Quantity Required: {notification.materialData.quantity} {notification.materialData.unit}</span>
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
                              {notification.materialData.materialSpecs && (
                                <div className="mt-2 pt-2 border-t border-orange-200">
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    {notification.materialData.materialSpecs.itemCode && notification.materialData.materialSpecs.itemCode !== 'N/A' && (
                                      <div><strong>Item Code:</strong> {notification.materialData.materialSpecs.itemCode}</div>
                                    )}
                                    {notification.materialData.materialSpecs.hsn && notification.materialData.materialSpecs.hsn !== 'N/A' && (
                                      <div><strong>HSN:</strong> {notification.materialData.materialSpecs.hsn}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Material Information for Delivery notifications */}
                        {notification.materialData && notification.destination === "delivery.inventory" && (
                          <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-xs text-green-900 space-y-2">
                              <div className="font-semibold text-green-800">🚚 Quantity to Deliver: {notification.materialData.quantity} {notification.materialData.unit}</div>
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
                        {notification.materialData && notification.source === "purchase.rfq" && notification.materialData.materials && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-900 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-blue-800">📋 RFQ Details</span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1 text-blue-700 border-blue-300">
                                  {notification.materialData.vendorsSent}/{notification.materialData.totalVendors} Vendors
                                </Badge>
                              </div>
                              <div><strong>Items:</strong> {notification.materialData.totalItems}</div>
                              <div><strong>Total Value:</strong> ₹{notification.materialData.totalEstimatedValue?.toLocaleString()}</div>
                              {notification.materialData.deliveryDate && (
                                <div><strong>Required Delivery:</strong> {new Date(notification.materialData.deliveryDate).toLocaleDateString()}</div>
                              )}
                              {notification.materialData.materials && notification.materialData.materials.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  <strong>Materials:</strong>
                                  <div className="mt-1 space-y-1">
                                    {notification.materialData.materials.slice(0, 2).map((material: any, index: number) => (
                                      <div key={index} className="flex justify-between text-[11px]">
                                        <span>{material.name}</span>
                                        <span className="font-medium">{material.quantity} {material.unit}</span>
                                      </div>
                                    ))}
                                    {notification.materialData.materials.length > 2 && (
                                      <div className="text-gray-600 text-[11px]">...and {notification.materialData.materials.length - 2} more items</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Legacy Material Request Metadata */}
                        {isMaterialRequest && notification.metadata && !notification.materialData && (
                           <div className="mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                             <div className="text-xs text-indigo-900 space-y-1">
                               <div className="flex justify-between">
                                 <span><strong>WBS:</strong> {notification.metadata.wbsName}</span>
                                 <span><strong>Quantity:</strong> {notification.metadata.requestedQty} {notification.metadata.requestedUnit || 'units'}</span>
                               </div>
                               <div><strong>Requester:</strong> {notification.metadata.requestedBy}</div>
                               {notification.metadata.remarks && (
                                 <div><strong>Remarks:</strong> {notification.metadata.remarks}</div>
                               )}
                             </div>
                           </div>
                        )}

                        {/* Stock Alert for low stock materials */}
                        {notification.materialData?.stockInfo?.isLowStock && (
                          <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-xs text-red-800 flex items-center gap-2">
                              <AlertCircle className="h-3 w-3" />
                              <span><strong>Low Stock Alert:</strong> Only {notification.materialData.stockInfo.currentStock} units available</span>
                            </div>
                          </div>
                        )}
                        {/* Invite Actions */}
                        {isPendingInvite && (
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
                        )}

                        {isInvite && !isPendingInvite && (
                           <div className="mt-2">
                             <Badge variant={notification.inviteResponse === 'accepted' ? 'default' : 'destructive'} className="text-[10px]">
                               {notification.inviteResponse === 'accepted' ? 'Accepted' : 'Rejected'}
                             </Badge>
                           </div>
                        )}
                        
                        {!isInvite && (
                          <div className="flex items-center justify-between gap-2 mt-2">
                            {notification.source && (
                              <Badge variant="outline" className="text-[10px] h-5 px-2 font-medium text-gray-600 bg-gray-50 border-gray-200">
                                {notification.source}
                              </Badge>
                            )}
                            {notification.status === "unread" && !notification.isReminder && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-3 text-xs text-blue-600 hover:bg-blue-50"
                                onClick={() => handleMarkAsRead(notification._id)}
                              >
                                <Check className="h-3 w-3 mr-1" /> Mark as Read
                              </Button>
                            )}
                            {notification.isReminder && (
                              <Badge variant="outline" className="text-[10px] h-5 px-2 font-medium text-red-600 bg-red-50 border-red-200">
                                Upcoming Deadline
                              </Badge>
                            )}
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
}
