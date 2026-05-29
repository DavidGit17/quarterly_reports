"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface DataTabProps {
  isDeleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  onExport: () => void;
  onBackup: () => void;
  onReset: () => void;
}

export function DataTab({
  isDeleteDialogOpen,
  onDeleteDialogChange,
  onExport,
  onBackup,
  onReset,
}: DataTabProps) {
  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your data and export/backup options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 p-4 bg-slate-100 rounded-2xl">
            <p className="font-medium text-slate-900">Export All Data</p>
            <p className="text-sm text-slate-800">
              Download all your reports and settings in CSV format
            </p>
            <Button variant="outline" className="mt-2" onClick={onExport}>
              Export Data
            </Button>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl">
            <p className="font-medium text-slate-900">Backup Database</p>
            <p className="text-sm text-slate-600">
              Create a backup of your entire database
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={onBackup}
            >
              Create Backup
            </Button>
          </div>

          <div className="space-y-2 p-4 bg-red-50 rounded-2xl border border-red-200">
            <p className="font-medium text-red-900">Danger Zone</p>
            <p className="text-sm text-red-800">
              Delete all your data permanently (cannot be undone)
            </p>
            <Button
              variant="destructive"
              className="mt-2"
              onClick={() => onDeleteDialogChange(true)}
            >
              Delete All Data
            </Button>
          </div>
        </CardContent>
      </Card>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteDialogChange}
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
              onClick={onReset}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Demo Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
