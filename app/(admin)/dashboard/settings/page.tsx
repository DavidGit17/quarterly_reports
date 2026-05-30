"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Bell, Database } from "lucide-react";

const AccountTab = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/settings/account-tab"
    ).then((mod) => ({ default: mod.AccountTab })),
);

const SecurityTab = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/settings/security-tab"
    ).then((mod) => ({ default: mod.SecurityTab })),
);

const NotificationsTab = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/settings/notifications-tab"
    ).then((mod) => ({ default: mod.NotificationsTab })),
);

const DataTab = dynamic(
  () =>
    import(
      "@/components/admin/dashboard/settings/data-tab"
    ).then((mod) => ({ default: mod.DataTab })),
);

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
    <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
      <PageHeader
        title="Settings"
        subtitle="Manage your account, system, and notification preferences"
      />
      {savedMessage && (
        <div className="mb-4 max-w-4xl rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
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

        <TabsContent value="account">
          <AccountTab
            name={name}
            email={email}
            timezone={timezone}
            dateFormat={dateFormat}
            onNameChange={setName}
            onEmailChange={setEmail}
            onTimezoneChange={setTimezone}
            onDateFormatChange={setDateFormat}
            onSave={() => showSaved("Account settings saved.")}
            onReset={resetSettings}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab
            sessionTimeout={sessionTimeout}
            twoFAEnabled={twoFAEnabled}
            onSessionTimeoutChange={setSessionTimeout}
            onTwoFAChange={setTwoFAEnabled}
            onSave={() => showSaved("Security settings saved.")}
            onReset={resetSettings}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab
            emailNotifications={emailNotifications}
            weeklyDigest={weeklyDigest}
            onEmailNotificationsChange={setEmailNotifications}
            onWeeklyDigestChange={setWeeklyDigest}
            onSave={() => showSaved("Notification settings saved.")}
            onReset={resetSettings}
          />
        </TabsContent>

        <TabsContent value="data">
          <DataTab
            isDeleteDialogOpen={isDeleteDialogOpen}
            onDeleteDialogChange={setIsDeleteDialogOpen}
            onExport={exportData}
            onBackup={createBackup}
            onReset={() => {
              resetSettings();
              showSaved("Demo settings reset.");
            }}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
