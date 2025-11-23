import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchNotifications } from "@/redux/slices/notificationSlice";

import {
  Bell,
  RefreshCcw,
  X,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock
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
  destination: string; // e.g., "rfq.purchase" or "delivery.inventory"
  title?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  destination,
  title = "Notifications",
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Access real state from Redux
  const { list, loading } = useSelector((state: RootState) => state.notification);

  // State for cooldown timer
  const [cooldown, setCooldown] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Fetch: Triggered when component mounts or destination changes
  useEffect(() => {
    if (destination) {
      dispatch(fetchNotifications({ destination }));
    }
  }, [dispatch, destination]);

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

    // Dispatch real API call
    dispatch(fetchNotifications({ destination }));
    setCooldown(30); // Start 30s cooldown
  };

  // Filter unread count for badge
  const unreadCount = list.filter((n: any) => n.status === "unread").length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
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
              <Badge variant="secondary" className="ml-2">
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
              title="Refresh Notifications"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""} ${
                  cooldown > 0 ? "text-gray-300" : "text-gray-600"
                }`}
              />
            </Button>
            {cooldown > 0 && (
              <span className="text-xs text-gray-400 w-4 text-center">
                {cooldown}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-0">
          {loading && list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <RefreshCcw className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Checking for updates...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-200 mb-4" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No new notifications for {destination}</p>
            </div>
          ) : (
            <div className="divide-y">
              {list.map((notification: any) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    notification.status === "unread" ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-full ${
                        notification.source?.includes("procurement") ? "bg-orange-100 text-orange-600" :
                        notification.source?.includes("delivery") ? "bg-green-100 text-green-600" :
                        "bg-blue-100 text-blue-600"
                    }`}>
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 leading-none">
                           {notification.itemName ? `Item: ${notification.itemName}` : "New Update"}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {notification.remark || "No additional remarks provided."}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal text-gray-500">
                          From: {notification.source}
                        </Badge>
                        {notification.itemId && (
                           <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal text-gray-500">
                             ID: {notification.itemId.substring(0, 10)}...
                           </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-2 border-t bg-gray-50 text-center">
            <p className="text-[10px] text-gray-400">
                Auto-refresh disabled. Use the refresh button.
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenter;