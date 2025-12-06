import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchNotifications, respondToInvite, markAsRead } from "@/redux/slices/notificationSlice";

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
    }
  }
  useEffect(() => {
    fetchNotificationHelper();
  }, [dispatch, destination]);

  // Auto-open logic for pending invites
  useEffect(() => {
    if (!loading && list.length > 0 && !hasAutoOpened) {
      const hasPendingInvite = list.some((n: any) => n.type === 'invite' && n.inviteResponse === 'pending');
      if (hasPendingInvite) {
        setIsOpen(true);
        setHasAutoOpened(true); // Prevent repeated opening
      }
    }
  }, [list, loading, hasAutoOpened]);

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

  const handleInviteResponse = (notificationId: string, response: "accepted" | "rejected") => {
    dispatch(respondToInvite({ notificationId, response }));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
      fetchNotificationHelper();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const unreadCount = list.filter((n: any) => n.status === "unread").length;

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
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-200 mb-4" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {list.map((notification: any) => {
                const isInvite = notification.type === 'invite';
                const isPendingInvite = isInvite && notification.inviteResponse === 'pending';

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
                          notification.source?.includes("procurement") ? "bg-orange-100 text-orange-600" :
                          notification.source?.includes("delivery") ? "bg-green-100 text-green-600" :
                          "bg-blue-100 text-blue-600"
                      }`}>
                        {isInvite ? <UserPlus className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                             {isInvite ? "Organization Invitation" : (notification.itemName ? `Item: ${notification.itemName}` : "New Update")}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 break-words">
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
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal text-gray-500">
                              {notification.source}
                            </Badge>
                            {/* Always show Mark as Read button for non-invite notifications */}
                            {notification.status === "unread" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleMarkAsRead(notification._id)}
                              >
                                <CheckCheck className="h-3 w-3 mr-1" /> Mark as Read
                              </Button>
                            ) : (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <CheckCheck className="h-3 w-3" /> Read
                              </span>
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
};

export default NotificationCenter;