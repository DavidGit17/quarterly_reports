"use client";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccountTabProps {
  name: string;
  email: string;
  timezone: string;
  dateFormat: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onDateFormatChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export function AccountTab({
  name,
  email,
  timezone,
  dateFormat,
  onNameChange,
  onEmailChange,
  onTimezoneChange,
  onDateFormatChange,
  onSave,
  onReset,
}: AccountTabProps) {
  return (
    <Card className="rounded-2xl">
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
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="asia-kolkata">Asia/Kolkata</SelectItem>
                <SelectItem value="america-new-york">
                  America/New York
                </SelectItem>
                <SelectItem value="europe-london">Europe/London</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date Format</Label>
            <Select value={dateFormat} onValueChange={onDateFormatChange}>
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
