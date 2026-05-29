"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SecurityTabProps {
  sessionTimeout: string;
  twoFAEnabled: boolean;
  onSessionTimeoutChange: (value: string) => void;
  onTwoFAChange: (value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

export function SecurityTab({
  sessionTimeout,
  twoFAEnabled,
  onSessionTimeoutChange,
  onTwoFAChange,
  onSave,
  onReset,
}: SecurityTabProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your security preferences and authentication methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="sessiontimeout">
            Session Timeout (minutes)
          </Label>
          <Input
            id="sessiontimeout"
            type="number"
            value={sessionTimeout}
            onChange={(e) => onSessionTimeoutChange(e.target.value)}
            className="mt-1 max-w-xs"
          />
          <p className="text-xs text-slate-500 mt-1">
            Automatically log out after inactivity
          </p>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-slate-200">
          <div>
            <p className="font-medium text-slate-900">
              Two-Factor Authentication
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={twoFAEnabled}
            onCheckedChange={onTwoFAChange}
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex gap-2 justify-end">
          <Button variant="outline" onClick={onReset}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-[#2563EB] hover:bg-blue-700 text-white"
          >
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
