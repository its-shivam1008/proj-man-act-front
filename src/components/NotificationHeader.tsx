import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchNotifications, respondToInvite } from "@/redux/slices/notificationSlice";
import {
  Bell,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Check,
  X
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const organisationId = localStorage.getItem("organisationId");

  // Determine destination based on current page
  const currentDestination = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/purchase/rfq")) return "rfq.purchase";
    if (path.includes("/inventory/operations/deliveries")) return "delivery.inventory";
    if (path === "/" || path.includes("/dashboard")) return "dashboard";
    return null;
  }, [location.pathname]);

  // Fetch notifications
  const fetchNotificationHelper = () => {
    if (currentDestination === "dashboard" && userProfile) {
      dispatch(fetchNotifications({ receiverId: userProfile?._id }));
    } else if (currentDestination) {
      dispatch(fetchNotifications({ destination: currentDestination }));
    } else if (organisationId) {
      dispatch(fetchNotifications({ receiverId: organisationId, status: "unread" }));
    }
  };

  useEffect(() => {
    fetchNotificationHelper();
  }, [dispatch, currentDestination, userProfile, organisationId]);

  // Refetch when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchNotificationHelper();
    }
  }, [isOpen]);

  // Filter notifications based on current page
  const filteredNotifications = useMemo(() => {
    if (!currentDestination) return notifications;
    return notifications.filter((n) => n.destination === currentDestination);
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

  const handleInviteResponse = (notificationId: string, response: "accepted" | "rejected") => {
    dispatch(respondToInvite({ notificationId, response }));
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

  const unreadCount = filteredNotifications.filter((n: any) => n.status === "unread").length;

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
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-200 mb-4" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No new notifications for this page</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification: any) => {
                const isInvite = notification.type === 'invite';
                const isPendingInvite = isInvite && notification.inviteResponse === 'pending';

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
                      {/* Icon */}
                      <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 shadow-sm ${
                          isInvite ? "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700" :
                          notification.source?.includes("procurement") ? "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700" :
                          notification.source?.includes("purchase") ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700" :
                          notification.source?.includes("delivery") ? "bg-gradient-to-br from-green-100 to-green-200 text-green-700" :
                          "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
                      }`}>
                        {isInvite ? <UserPlus className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                              {isInvite ? "Organization Invitation" : (notification.itemName || "New Update")}
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
                        
                        <p className="text-sm text-gray-700 break-words leading-relaxed">
                          {notification.remark || "No additional remarks provided."}
                        </p>
                        
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
                            {notification.status === "unread" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-3 text-xs text-blue-600 hover:bg-blue-50"
                                onClick={() => handleMarkAsRead(notification._id)}
                              >
                                <Check className="h-3 w-3 mr-1" /> Mark as Read
                              </Button>
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
