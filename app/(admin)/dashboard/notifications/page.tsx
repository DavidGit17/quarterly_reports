"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Trash2, Check } from "lucide-react";
import { formatIsoDateTime } from "@/lib/shared/date-format";

interface Notification {
  id: string;
  type: "report" | "approval" | "system" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "approval",
    title: "Report Approval Required",
    message: "Annual Sustainability Report (Spanish) is pending your approval",
    timestamp: "2024-02-20T10:30:00",
    read: false,
    actionUrl: "/dashboard/reports",
  },
  {
    id: "2",
    type: "report",
    title: "New Report Submitted",
    message: "Financial Performance Analysis report submitted by Michael Chen",
    timestamp: "2024-02-20T09:15:00",
    read: false,
  },
  {
    id: "3",
    type: "approval",
    title: "Approval Pending",
    message: "Operational Excellence Initiative report awaiting your review",
    timestamp: "2024-02-19T14:45:00",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "System Maintenance",
    message:
      "Scheduled maintenance will occur on February 25, 2024 at 2:00 AM UTC",
    timestamp: "2024-02-18T08:00:00",
    read: true,
  },
  {
    id: "5",
    type: "alert",
    title: "High Priority Alert",
    message: "5 reports require immediate attention and approval",
    timestamp: "2024-02-17T16:20:00",
    read: true,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reportNotifications, setReportNotifications] = useState(true);
  const [approvalNotifications, setApprovalNotifications] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleSavePreferences = () => {
    setSaveMessage("Preferences saved for this demo session.");
    window.setTimeout(() => setSaveMessage(""), 2500);
  };

  const getNotificationIcon = (type: string) => {
    const baseClasses = "w-2 h-2 rounded-full";
    switch (type) {
      case "approval":
        return <div className={`${baseClasses} bg-orange-500`}></div>;
      case "report":
        return <div className={`${baseClasses} bg-slate-1000`}></div>;
      case "alert":
        return <div className={`${baseClasses} bg-red-500`}></div>;
      case "system":
        return <div className={`${baseClasses} bg-slate-500`}></div>;
      default:
        return <div className={`${baseClasses} bg-slate-400`}></div>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "approval":
        return "Approval";
      case "report":
        return "Report";
      case "alert":
        return "Alert";
      case "system":
        return "System";
      default:
        return "Notification";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "approval":
        return "bg-orange-100 text-orange-800";
      case "report":
        return "bg-slate-100 text-slate-800";
      case "alert":
        return "bg-red-100 text-red-800";
      case "system":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };
  return (
    <>
      <main className="flex-1 p-4 md:p-6">
        <PageHeader
          title="Notifications"
          subtitle="Manage your notification preferences and view your notification history"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Notification Controls */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Recent Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-slate-700">{unreadCount}</Badge>
                )}
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all as read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-2xl p-4 transition-all ${
                      notification.read
                        ? "bg-white border-slate-200"
                        : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Indicator */}
                      <div className="mt-1.5 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-slate-900">
                                {notification.title}
                              </h4>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getTypeColor(
                                  notification.type,
                                )}`}
                              >
                                {getTypeLabel(notification.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              {formatIsoDateTime(notification.timestamp)}
                            </p>
                            {notification.actionUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleMarkAsRead(notification.id);
                                  router.push(notification.actionUrl!);
                                }}
                                className="mt-3 h-8 text-xs"
                              >
                                Open
                              </Button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                className="text-xs h-8 px-2"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <Bell className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 text-sm">
                  No notifications yet. Check back soon!
                </p>
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Preferences</CardTitle>
                <CardDescription className="text-xs">
                  Control how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Email Notifications
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="border-t border-slate-200"></div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Push Notifications
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Real-time browser alerts
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <div className="border-t border-slate-200"></div>

                  {/* Report Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Report Notifications
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        New report submissions
                      </p>
                    </div>
                    <Switch
                      checked={reportNotifications}
                      onCheckedChange={setReportNotifications}
                    />
                  </div>

                  <div className="border-t border-slate-200"></div>

                  {/* Approval Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Approval Notifications
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Pending approvals
                      </p>
                    </div>
                    <Switch
                      checked={approvalNotifications}
                      onCheckedChange={setApprovalNotifications}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  {saveMessage && (
                    <p className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                      {saveMessage}
                    </p>
                  )}
                  <Button
                    onClick={handleSavePreferences}
                    className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-sm"
                  >
                    Save Preferences
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNotifications(mockNotifications)}
                    className="mt-2 w-full text-sm"
                  >
                    Reset Demo Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
