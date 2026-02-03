import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import api from '@/utils/axiosApi';
import { useDispatch, useSelector } from "react-redux";
import {
    deleteNotification,
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from "@/redux/slices/notificationSidebarSlice"
import { RootState, AppDispatch } from "@/redux/store";

const NotificationSidebar = ({ open, onOpenChange, onUnreadChange }) => {

    // const unreadCount = notifications?.filter(n => !n.read).length || 0;
    const dispatch = useDispatch<AppDispatch>();

    const { list: notifications, unreadCount, loading } =
        useSelector((state: RootState) => state.notifications);

    const organisationId =
        typeof window !== "undefined"
            ? localStorage.getItem("organisationId")
            : null;

    const markAsRead = (id: string) => {
        dispatch(markNotificationRead(id));
    };

    const markAllAsRead = () => {
        dispatch(markAllNotificationsRead());
    };

    const removeNotification = (id: string) => {
        dispatch(deleteNotification(id));
    };
useEffect(() => {
  if (open && notifications.length === 0) {
    dispatch(fetchNotifications());
  }
}, [open, notifications.length, dispatch]);


    useEffect(() => {
        onUnreadChange?.(unreadCount);
    }, [unreadCount, onUnreadChange]);

    const getTypeColor = (type) => {
        const colors = {
            mention: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            update: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
            success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            alert: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            message: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
            reminder: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        };
        return colors[type] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Crimson+Pro:wght@400;500&display=swap');
        
        .notification-item {
          font-family: 'Crimson Pro', serif;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .notification-item::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }
        
        .notification-item:hover::after {
          transform: scaleY(1);
        }
        
        .notification-item:hover {
          transform: translateX(4px);
          background: rgba(255, 255, 255, 0.8);
        }
        
        .notification-header {
          font-family: 'Playfair Display', serif;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .action-button {
          transition: all 0.2s ease;
        }
        
        .action-button:hover {
          transform: scale(1.1);
        }
        
        .action-button:active {
          transform: scale(0.95);
        }
        
        .slide-in {
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:w-[480px] p-0 bg-white border-l-2 border-slate-200">
                    <SheetHeader className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="notification-header text-3xl font-bold flex items-center gap-3">
                                <Bell className="h-7 w-7 text-slate-700" />
                                Notifications
                            </SheetTitle>
                            {unreadCount > 0 && markAllAsRead && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-slate-500 mt-2">
                                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </SheetHeader>

                    <ScrollArea className="h-[calc(100vh-120px)]">
                        <div className="p-4 space-y-2">
                            {!notifications || notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="bg-slate-100 rounded-full p-6 mb-4">
                                        <Bell className="h-12 w-12 text-slate-400" />
                                    </div>
                                    <p className="text-lg font-medium text-slate-700 mb-1">All caught up!</p>
                                    <p className="text-sm text-slate-500">No new notifications</p>
                                </div>
                            ) : (
                                notifications.map((notification, index) => (
                                    <div
                                        key={notification._id}
                                        className="notification-item slide-in rounded-xl p-4 border border-slate-200 bg-white shadow-sm"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-2 rounded-lg border ${getTypeColor(notification.type)}`}>
                                                <Bell className="h-4 w-4" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className="font-semibold text-slate-900 text-base leading-tight">
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.isRead && (
                                                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                                    )}
                                                </div>

                                                <p className="text-sm text-slate-600 leading-relaxed mb-2">
                                                    {notification.message}
                                                </p>

                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {new Date(notification.createdAt).toLocaleString()}
                                                    </span>

                                                    <div className="flex items-center gap-1">
                                                        {!notification.isRead && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => markAsRead(notification._id)}
                                                                className="action-button h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {(
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeNotification(notification._id)}
                                                                className="action-button h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default NotificationSidebar;