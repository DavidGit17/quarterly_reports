"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDefaultFormConfigs,
  getFormConfigs,
  saveFormConfigs,
  type DynamicFieldType,
  type FormFieldConfig,
  type ProjectFormConfigs,
} from "@/lib/form-storage";
import { Plus, Trash2 } from "lucide-react";

const fieldTypeOptions: DynamicFieldType[] = [
  "text",
  "textarea",
  "number",
  "file",
];

const normalizeFieldId = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function AdminFormBuilderPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<ProjectFormConfigs>({});
  const [selectedProject, setSelectedProject] = useState("Libya");
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    const savedConfigs = getFormConfigs();
    setConfigs(savedConfigs);

    const projectKeys = Object.keys(savedConfigs);
    if (projectKeys.length > 0) {
      setSelectedProject(projectKeys[0]);
    }
  }, []);

  const projectOptions = useMemo(() => Object.keys(configs), [configs]);

  const selectedFields: FormFieldConfig[] = configs[selectedProject] || [];

  const updateField = (
    fieldId: string,
    updates: Partial<Pick<FormFieldConfig, "label" | "type">>,
  ) => {
    setConfigs((prev) => {
      const updatedProjectFields = (prev[selectedProject] || []).map(
        (field) => {
          if (field.id !== fieldId) {
            return field;
          }

          const nextLabel = updates.label ?? field.label;
          return {
            ...field,
            ...updates,
            id: normalizeFieldId(nextLabel) || field.id,
          };
        },
      );

      return {
        ...prev,
        [selectedProject]: updatedProjectFields,
      };
    });
  };

  const addNewField = () => {
    setConfigs((prev) => {
      const currentProjectFields = prev[selectedProject] || [];
      const nextFieldNumber = currentProjectFields.length + 1;
      const fallbackLabel = `New Field ${nextFieldNumber}`;

      const newField: FormFieldConfig = {
        id: `new-field-${Date.now()}`,
        label: fallbackLabel,
        type: "text",
        required: true,
      };

      return {
        ...prev,
        [selectedProject]: [...currentProjectFields, newField],
      };
    });
  };

  const removeField = (fieldId: string) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedProject]: (prev[selectedProject] || []).filter(
        (field) => field.id !== fieldId,
      ),
    }));
  };

  const addProject = () => {
    const trimmedProjectName = newProjectName.trim();
    if (!trimmedProjectName) {
      return;
    }

    setConfigs((prev) => {
      if (prev[trimmedProjectName]) {
        return prev;
      }

      return {
        ...prev,
        [trimmedProjectName]: [],
      };
    });

    setSelectedProject(trimmedProjectName);
    setNewProjectName("");
  };

  const handleSave = () => {
    saveFormConfigs(configs);
    router.push("/dashboard");
  };

  const resetDefaults = () => {
    const defaults = getDefaultFormConfigs();
    setConfigs(defaults);
    setSelectedProject(Object.keys(defaults)[0] || "");
    saveFormConfigs(defaults);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sky-700 hover:underline text-sm font-medium"
            >
              ← Back
            </Link>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Admin Form Builder
            </h1>
          </div>
          <button
            type="button"
            onClick={resetDefaults}
            className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
          >
            Reset defaults
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Select project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-sky-600"
            >
              {projectOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Add project
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-sky-600"
                placeholder="Enter project name"
              />
              <button
                type="button"
                onClick={addProject}
                className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300"
              >
                Add project
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-900">
                  Field {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateField(field.id, { label: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-sky-600"
                    placeholder="Field label"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, {
                        type: e.target.value as DynamicFieldType,
                      })
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-sky-600"
                  >
                    {fieldTypeOptions.map((typeOption) => (
                      <option key={typeOption} value={typeOption}>
                        {typeOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addNewField}
            className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-medium"
          >
            <Plus className="h-4 w-4" /> Add New Field
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-md bg-sky-700 text-white text-sm font-medium hover:bg-sky-800"
          >
            Save Form Structure
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-md bg-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-300"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
