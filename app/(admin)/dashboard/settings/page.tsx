"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Bell, Database } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const initialSettings = {
  email: "admin@company.com",
  name: "John Administrator",
  timezone: "utc",
  dateFormat: "mm/dd/yyyy",
  sessionTimeout: "30",
  twoFAEnabled: true,
  emailNotifications: true,
  weeklyDigest: true,
};

export default function SettingsPage() {
  const [email, setEmail] = useState(initialSettings.email);
  const [name, setName] = useState(initialSettings.name);
  const [timezone, setTimezone] = useState(initialSettings.timezone);
  const [dateFormat, setDateFormat] = useState(initialSettings.dateFormat);
  const [sessionTimeout, setSessionTimeout] = useState(
    initialSettings.sessionTimeout,
  );
  const [twoFAEnabled, setTwoFAEnabled] = useState(initialSettings.twoFAEnabled);
  const [emailNotifications, setEmailNotifications] = useState(
    initialSettings.emailNotifications,
  );
  const [weeklyDigest, setWeeklyDigest] = useState(initialSettings.weeklyDigest);
  const [savedMessage, setSavedMessage] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const currentSettings = {
    email,
    name,
    timezone,
    dateFormat,
    sessionTimeout,
    twoFAEnabled,
    emailNotifications,
    weeklyDigest,
  };

  const showSaved = (message: string) => {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(""), 2500);
  };

  const resetSettings = () => {
    setEmail(initialSettings.email);
    setName(initialSettings.name);
    setTimezone(initialSettings.timezone);
    setDateFormat(initialSettings.dateFormat);
    setSessionTimeout(initialSettings.sessionTimeout);
    setTwoFAEnabled(initialSettings.twoFAEnabled);
    setEmailNotifications(initialSettings.emailNotifications);
    setWeeklyDigest(initialSettings.weeklyDigest);
  };

  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportData = () => {
    const rows = [
      ["Setting", "Value"],
      ...Object.entries(currentSettings).map(([key, value]) => [
        key,
        String(value),
      ]),
    ];
    downloadFile(
      rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n"),
      "settings-export.csv",
      "text/csv",
    );
  };

  const createBackup = () => {
    downloadFile(
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          settings: currentSettings,
          note: "Demo backup generated from mock settings.",
        },
        null,
        2,
      ),
      "quarterly-reports-backup.json",
      "application/json",
    );
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account, system, and notification preferences"
      />
      {savedMessage && (
        <div className="mb-4 max-w-4xl rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {savedMessage}
        </div>
      )}

      <Tabs defaultValue="account" className="max-w-4xl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="gap-2 flex items-center">
            <User className="w-4 h-4 hidden md:inline" />
            <span className="hidden md:inline">Account</span>
            <span className="md:hidden">Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 flex items-center">
            <Lock className="w-4 h-4 hidden md:inline" />
            <span className="hidden md:inline">Security</span>
            <span className="md:hidden">Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 flex items-center"
          >
            <Bell className="w-4 h-4 hidden md:inline" />
            <span className="hidden md:inline">Notify</span>
            <span className="md:hidden">Notify</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2 flex items-center">
            <Database className="w-4 h-4 hidden md:inline" />
            <span className="hidden md:inline">Data</span>
            <span className="md:hidden">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="asia-kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="america-new-york">
                        America/New York
                      </SelectItem>
                      <SelectItem value="europe-london">
                        Europe/London
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-2 justify-end">
                <Button variant="outline" onClick={resetSettings}>
                  Cancel
                </Button>
                <Button
                  onClick={() => showSaved("Account settings saved.")}
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
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
                  onChange={(e) => setSessionTimeout(e.target.value)}
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
                  onCheckedChange={setTwoFAEnabled}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-2 justify-end">
                <Button variant="outline" onClick={resetSettings}>
                  Cancel
                </Button>
                <Button
                  onClick={() => showSaved("Security settings saved.")}
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you receive updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    Email Notifications
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
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
                  onCheckedChange={setWeeklyDigest}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-2 justify-end">
                <Button variant="outline" onClick={resetSettings}>
                  Cancel
                </Button>
                <Button
                  onClick={() => showSaved("Notification settings saved.")}
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your data and export/backup options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 bg-slate-100 rounded-lg">
                <p className="font-medium text-slate-900">Export All Data</p>
                <p className="text-sm text-slate-800">
                  Download all your reports and settings in CSV format
                </p>
                <Button variant="outline" className="mt-2" onClick={exportData}>
                  Export Data
                </Button>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">Backup Database</p>
                <p className="text-sm text-slate-600">
                  Create a backup of your entire database
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={createBackup}
                >
                  Create Backup
                </Button>
              </div>

              <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="font-medium text-red-900">Danger Zone</p>
                <p className="text-sm text-red-800">
                  Delete all your data permanently (cannot be undone)
                </p>
                <Button
                  variant="destructive"
                  className="mt-2"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Delete All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Demo Data</AlertDialogTitle>
            <AlertDialogDescription>
              This resets the mock settings in this browser session. No real
              database records will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetSettings();
                showSaved("Demo settings reset.");
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Demo Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
