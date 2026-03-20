"use client";

import { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Plus, Trash2, Upload, X } from "lucide-react";

type FieldType = "text" | "textarea" | "file" | "radio";

type ExtraFieldType = "text" | "textarea" | "file";

type FieldConfig = {
  id: string;
  number: number;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  options?: string[];
};

type AdditionalField = {
  id: string;
  label: string;
  type: ExtraFieldType;
  value: string;
  files?: File[];
};

const fields: FieldConfig[] = [
  {
    id: "field1",
    number: 1,
    label: "Language Name",
    type: "text",
    placeholder: "Enter your answer",
  },
  {
    id: "field2",
    number: 2,
    label: "Reporting Person",
    type: "text",
    placeholder: "Enter your answer",
  },
  {
    id: "field3",
    number: 3,
    label: "Reporting Date",
    type: "text",
    placeholder: "Please input date (M/d/yyyy)",
  },
  {
    id: "field4",
    number: 4,
    label: "Out comes from the Quarter just ended",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field5",
    number: 5,
    label: "Newly Added Books if any",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field6",
    number: 6,
    label: "Goals for the Next Quarter",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field7",
    number: 7,
    label: "Outputs: Vision Sharing and Mobilization",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field8",
    number: 8,
    label:
      "Outputs: Equip the local Church and Community for Church Based Bible Translation",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field9",
    number: 9,
    label: "Outputs: Bible Translation",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field10",
    number: 10,
    label: "Outputs: Engagement and Transformation",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field11",
    number: 11,
    label:
      "Project Impact ( Please make sure that the stories answer the Question who, what ,when, where , and Why.) Where relevant clearly indicate any conditions. Like Testimonies",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field12",
    number: 12,
    label:
      "Non-translation Activities. Bible listening Groups and Dedications etc..)",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field13",
    number: 13,
    label:
      "Tell about a Task or activity that helped the team or community Members to better understand God Scripture or the Gospel Message",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field14",
    number: 14,
    label: "Describe any other interesting developments or challenges.",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field15",
    number: 15,
    label:
      "Please provide prayer requests and updates that relate to the entire project. (By the project Coordinator ONLY)",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field16",
    number: 16,
    label: "Answered prayer request and Date",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field17",
    number: 17,
    label:
      "Please provide at least 10 photos (highest resolution available) or videos illustrating project activities and/or their impact on the project. Rename them saying what's happening in the Photo.",
    type: "file",
    description: "(Non-anonymous question)",
  },
  {
    id: "field18",
    number: 18,
    label:
      "Please provide additional photos/videos that show more project impact (rename each file to describe the activity shown).",
    type: "file",
    description: "(Non-anonymous question)",
  },
  {
    id: "field19",
    number: 19,
    label:
      "Describe any key developments and changes in the external environment of the project (country, region, district) that had an influence (positive or negative) on the project.",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field20",
    number: 20,
    label:
      "Describe how the team that is responsible for the implementation of the project is functioning.",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field21",
    number: 21,
    label:
      "Are there any other challenges that have an influence on the implementation of the project (partners, resources, logistics, etc.)? How do you plan to address those challenges?",
    type: "textarea",
    placeholder: "Enter your answer",
  },
  {
    id: "field22",
    number: 22,
    label:
      "Partners: List all of the Church names that are involved in the project so far.",
    type: "textarea",
    placeholder: "Enter your answer",
    description:
      "*This is a Cluster Question. You can assign different responses based on Language.",
  },
  {
    id: "field23",
    number: 23,
    label: "Upload updated progress chart:",
    type: "file",
    description: "(Non-anonymous question)",
  },
  {
    id: "field24",
    number: 24,
    label: "Upload Documents",
    type: "file",
    description: "(Non-anonymous question)",
  },
  {
    id: "field25",
    number: 25,
    label: "Is this report checked for Grammar corrections?!",
    type: "radio",
    options: ["Yes", "No", "Maybe"],
  },
  {
    id: "field26",
    number: 26,
    label: "Is this report checked and approved by TR manager?!",
    type: "radio",
    options: ["Yes", "No", "Maybe"],
  },
  {
    id: "field27",
    number: 27,
    label: "Any suggestions to improve this reporting form?!!",
    type: "textarea",
    placeholder: "Enter your answer",
  },
];

const initialFormData = fields.reduce<Record<string, string>>((acc, field) => {
  if (field.type !== "file") {
    acc[field.id] = "";
  }
  return acc;
}, {});

// Separate component to handle search params
function SubmitReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProject = searchParams.get("project") || "";
  const quarter = searchParams.get("quarter") || "";

  const [formData, setFormData] =
    useState<Record<string, string>>(initialFormData);
  const [fileData, setFileData] = useState<Record<string, File[]>>({});
  const [projectName, setProjectName] = useState(selectedProject);
  const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>(
    [],
  );
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<ExtraFieldType>("text");
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const datePickerRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const extraFileInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const submitRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const displayProject = projectName.trim() || "Project";
  const displayQuarter = quarter.trim() || "Quarter";

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const formatDateFromNative = (value: string) => {
    if (!value) {
      return "";
    }

    const [year, month, day] = value.split("-");
    return `${Number(month)}/${Number(day)}/${year}`;
  };

  const openCalendarPicker = (fieldId: string) => {
    const picker = datePickerRefs.current[fieldId];

    if (!picker) {
      return;
    }

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }

    picker.click();
  };

  const handleDateInputChange = (fieldId: string, value: string) => {
    handleInputChange(fieldId, formatDateInput(value));
  };

  const handleFileChange = (field: string, files: FileList | null) => {
    const selectedFiles = Array.from(files || []);
    setFileData((prev) => ({
      ...prev,
      [field]: selectedFiles.slice(0, 10),
    }));
  };

  const syncFileInput = (
    inputElement: HTMLInputElement | null,
    files: File[],
  ) => {
    if (!inputElement) {
      return;
    }

    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    inputElement.files = dataTransfer.files;
  };

  const removeUploadedFile = (fieldId: string, fileIndex: number) => {
    setFileData((prev) => {
      const currentFiles = prev[fieldId] || [];
      const updatedFiles = currentFiles.filter(
        (_, index) => index !== fileIndex,
      );

      syncFileInput(fileInputRefs.current[fieldId], updatedFiles);

      return {
        ...prev,
        [fieldId]: updatedFiles,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSubmitPopup(true);

    if (submitRedirectTimerRef.current) {
      clearTimeout(submitRedirectTimerRef.current);
    }

    submitRedirectTimerRef.current = setTimeout(() => {
      router.push("/my-reports");
    }, 1800);
  };

  const handleSubmitPopupContinue = () => {
    if (submitRedirectTimerRef.current) {
      clearTimeout(submitRedirectTimerRef.current);
    }
    router.push("/my-reports");
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      return;
    }

    setAdditionalFields((prev) => [
      ...prev,
      {
        id: `extra-${Date.now()}`,
        label: newFieldLabel.trim(),
        type: newFieldType,
        value: "",
      },
    ]);
    setNewFieldLabel("");
    setNewFieldType("text");
    setShowAddField(false);
  };

  const handleAdditionalFieldValueChange = (id: string, value: string) => {
    setAdditionalFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, value } : field)),
    );
  };

  const handleAdditionalFieldFileChange = (
    id: string,
    files: FileList | null,
  ) => {
    const selectedFiles = Array.from(files || []).slice(0, 10);
    setAdditionalFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, files: selectedFiles } : field,
      ),
    );
  };

  const removeAdditionalFieldFile = (fieldId: string, fileIndex: number) => {
    setAdditionalFields((prev) =>
      prev.map((field) => {
        if (field.id !== fieldId) {
          return field;
        }

        const existingFiles = field.files || [];
        const updatedFiles = existingFiles.filter(
          (_, index) => index !== fileIndex,
        );

        syncFileInput(extraFileInputRefs.current[fieldId], updatedFiles);

        return {
          ...field,
          files: updatedFiles,
        };
      }),
    );
  };

  const removeAdditionalField = (fieldId: string) => {
    setAdditionalFields((prev) => prev.filter((field) => field.id !== fieldId));
    delete extraFileInputRefs.current[fieldId];
  };

  const inputBaseClass =
    "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-b focus:border-sky-600";

  const isDateField = (field: FieldConfig) =>
    field.type === "text" && /date/i.test(field.label);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/select"
            className="text-sky-700 hover:underline text-sm font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Quarterly Report Submission
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-6">
          <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
            {displayProject} {displayQuarter} Report
          </h2>
          <p className="text-lg text-slate-700 mb-6">
            Hi, Coordinator. When you submit this form, the owner will see your
            name and email address.
          </p>
          <p className="text-2xl text-red-600 leading-none">*</p>
          <p className="text-xl font-medium text-slate-800 mt-1">Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <label
              htmlFor="projectName"
              className="block text-base font-semibold text-slate-900 mb-2"
            >
              Project Name <span className="text-red-600">*</span>
            </label>
            <p className="text-sm text-slate-500 mb-2">
              Coordinator enters this value.
            </p>
            <input
              id="projectName"
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={inputBaseClass}
              placeholder="Enter project name"
            />
          </div>

          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
            >
              <label
                htmlFor={field.id}
                className="block text-base font-semibold text-slate-900 mb-3"
              >
                {field.number}. {field.label}{" "}
                <span className="text-red-600">*</span>
              </label>
              {field.description && (
                <p className="text-sm text-slate-500 mb-3 whitespace-pre-line">
                  {field.description}
                </p>
              )}

              {field.type === "textarea" && (
                <textarea
                  id={field.id}
                  required
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={`${inputBaseClass} min-h-24 resize-y`}
                  placeholder={field.placeholder || "Enter your answer"}
                />
              )}

              {field.type === "text" && (
                <div className="relative">
                  <input
                    id={field.id}
                    type="text"
                    required
                    value={formData[field.id] || ""}
                    onChange={(e) =>
                      isDateField(field)
                        ? handleDateInputChange(field.id, e.target.value)
                        : handleInputChange(field.id, e.target.value)
                    }
                    onInput={(e) => {
                      if (!isDateField(field)) {
                        return;
                      }

                      const target = e.target as HTMLInputElement;
                      handleDateInputChange(field.id, target.value);
                    }}
                    onBlur={(e) => {
                      if (!isDateField(field)) {
                        return;
                      }

                      handleDateInputChange(field.id, e.target.value);
                    }}
                    inputMode={isDateField(field) ? "numeric" : undefined}
                    maxLength={isDateField(field) ? 10 : undefined}
                    className={`${inputBaseClass} ${isDateField(field) ? "pr-9" : ""}`}
                    placeholder={field.placeholder || "Enter your answer"}
                  />
                  {isDateField(field) && (
                    <>
                      <button
                        type="button"
                        onClick={() => openCalendarPicker(field.id)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                        aria-label="Open calendar"
                      >
                        <CalendarDays className="h-4 w-4" />
                      </button>
                      <input
                        ref={(element) => {
                          datePickerRefs.current[field.id] = element;
                        }}
                        type="date"
                        tabIndex={-1}
                        className="sr-only"
                        onChange={(e) =>
                          handleInputChange(
                            field.id,
                            formatDateFromNative(e.target.value),
                          )
                        }
                      />
                    </>
                  )}
                </div>
              )}

              {field.type === "file" && (
                <div className="space-y-4">
                  <label
                    htmlFor={field.id}
                    className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold cursor-pointer"
                  >
                    <Upload className="h-4 w-4" /> Upload file
                  </label>
                  <input
                    id={field.id}
                    ref={(element) => {
                      fileInputRefs.current[field.id] = element;
                    }}
                    type="file"
                    multiple
                    required
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,image/*,video/*,audio/*"
                    onChange={(e) => handleFileChange(field.id, e.target.files)}
                    className="sr-only"
                  />
                  {fileData[field.id] && fileData[field.id].length > 0 && (
                    <div className="space-y-2">
                      {fileData[field.id].map((file, index) => (
                        <div
                          key={`${field.id}-${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 text-sm text-slate-800"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(field.id, index)}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-4 w-4" /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    File number limit: 10
                  </p>
                  <p className="text-xs text-slate-500">
                    Single file size limit: 1GB
                  </p>
                  <p className="text-xs text-slate-500">
                    Allowed file types: Word, Excel, PPT, PDF, Image, Video,
                    Audio
                  </p>
                  {fileData[field.id] && fileData[field.id].length > 0 && (
                    <p className="text-xs text-slate-800">
                      {fileData[field.id].length} file(s) selected
                    </p>
                  )}
                </div>
              )}

              {field.type === "radio" && (
                <div className="space-y-2">
                  {field.options?.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-sm text-slate-800"
                    >
                      <input
                        type="radio"
                        name={field.id}
                        required
                        value={option}
                        checked={formData[field.id] === option}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.value)
                        }
                        className="h-4 w-4 accent-sky-700"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {additionalFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <label className="block text-base font-semibold text-slate-900">
                  {fields.length + index + 1}. {field.label}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeAdditionalField(field.id)}
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-red-600"
                  aria-label={`Remove field ${field.label}`}
                >
                  <Trash2 className="h-4 w-4" /> Remove field
                </button>
              </div>
              {field.type === "textarea" && (
                <textarea
                  required
                  value={field.value}
                  onChange={(e) =>
                    handleAdditionalFieldValueChange(field.id, e.target.value)
                  }
                  className={`${inputBaseClass} min-h-24 resize-y`}
                  placeholder="Enter your answer"
                />
              )}

              {field.type === "text" && (
                <textarea
                  required
                  value={field.value}
                  onChange={(e) =>
                    handleAdditionalFieldValueChange(field.id, e.target.value)
                  }
                  className={`${inputBaseClass} min-h-20 resize-y`}
                  placeholder="Enter your answer"
                />
              )}

              {field.type === "file" && (
                <div className="space-y-4">
                  <label
                    htmlFor={`extra-file-${field.id}`}
                    className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold cursor-pointer"
                  >
                    <Upload className="h-4 w-4" /> Upload file
                  </label>
                  <input
                    id={`extra-file-${field.id}`}
                    ref={(element) => {
                      extraFileInputRefs.current[field.id] = element;
                    }}
                    type="file"
                    required
                    multiple
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,image/*,video/*,audio/*"
                    onChange={(e) =>
                      handleAdditionalFieldFileChange(field.id, e.target.files)
                    }
                    className="sr-only"
                  />
                  {field.files && field.files.length > 0 && (
                    <div className="space-y-2">
                      {field.files.map((file, index) => (
                        <div
                          key={`${field.id}-${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 text-sm text-slate-800"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              removeAdditionalFieldFile(field.id, index)
                            }
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-4 w-4" /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {field.files && field.files.length > 0 && (
                    <p className="text-xs text-slate-800">
                      {field.files.length} file(s) selected
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {!showAddField ? (
            <button
              type="button"
              onClick={() => setShowAddField(true)}
              className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-medium"
            >
              <Plus className="h-4 w-4" /> Add more field
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
              <div>
                <label
                  htmlFor="newFieldLabel"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  New field label <span className="text-red-600">*</span>
                </label>
                <input
                  id="newFieldLabel"
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className={inputBaseClass}
                  placeholder="Enter field label"
                />
              </div>
              <div>
                <label
                  htmlFor="newFieldType"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Field type
                </label>
                <select
                  id="newFieldType"
                  value={newFieldType}
                  onChange={(e) =>
                    setNewFieldType(e.target.value as ExtraFieldType)
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-sky-600"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Paragraph</option>
                  <option value="file">File upload</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-4 py-2 rounded-md bg-sky-700 text-white text-sm font-medium hover:bg-sky-800"
                >
                  Add field
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddField(false);
                    setNewFieldLabel("");
                    setNewFieldType("text");
                  }}
                  className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="flex-1 bg-sky-700 text-white py-3 rounded-md font-medium hover:bg-sky-800 transition-colors"
            >
              Submit
            </button>
            <Link
              href="/select"
              className="flex-1 bg-slate-200 text-slate-900 py-3 rounded-md font-medium text-center hover:bg-slate-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {showSubmitPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Report submitted successfully
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                Redirecting to submitted reports history...
              </p>
              <button
                type="button"
                onClick={handleSubmitPopupContinue}
                className="w-full bg-sky-700 text-white py-2.5 rounded-md font-medium hover:bg-sky-800 transition-colors"
              >
                Go to History now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubmitReportPage() {
  return (
    <Suspense>
      <SubmitReportContent />
    </Suspense>
  );
}
