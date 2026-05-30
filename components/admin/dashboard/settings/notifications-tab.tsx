"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NotificationsTabProps {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  onEmailNotificationsChange: (value: boolean) => void;
  onWeeklyDigestChange: (value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

export function NotificationsTab({
  emailNotifications,
  weeklyDigest,
  onEmailNotificationsChange,
  onWeeklyDigestChange,
  onSave,
  onReset,
}: NotificationsTabProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you receive updates and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Email Notifications</p>
            <p className="text-sm text-slate-600 mt-1">
              Receive notifications via email
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={onEmailNotificationsChange}
          />
        </div>

        <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Weekly Digest</p>
            <p className="text-sm text-slate-600 mt-1">
              Get a summary of all activities every week
            </p>
          </div>
          <Switch
            checked={weeklyDigest}
            onCheckedChange={onWeeklyDigestChange}
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex gap-2 justify-end">
          <Button variant="outline" onClick={onReset}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
