import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchNotifications } from "@/redux/slices/notificationSlice";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function NotificationHeader() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: notifications } = useSelector((state: RootState) => state.notification);
  const [open, setOpen] = useState(false);
  const organisationId = localStorage.getItem("organisationId");

  useEffect(() => {
    if (organisationId) {
      dispatch(fetchNotifications({ receiverId: organisationId, status: "unread" }));
    }
  }, [dispatch, organisationId]);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div
                key={notification._id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  notification.status === "unread" ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.itemName || "Notification"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.remark}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {notification.source}
                    </p>
                  </div>
                  {notification.status === "unread" && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full ml-2" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(notification.createdAt), "MMM dd, HH:mm")}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
