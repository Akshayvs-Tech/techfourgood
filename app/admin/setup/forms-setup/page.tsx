"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FormField {
  id: string;
  label: string; //"Full Name", "Date of Birth"
  fieldType: "text" | "email" | "date" | "select";
  options: string[];
  isRequired: boolean;
}

interface FormSetupData {
  tournamentId: string;
  fields: FormField[];
}

export default function FormsSetupPage() {
  const router = useRouter();
  // Safe JSON parser for responses (handles non-JSON/empty bodies)
  async function parseResponseJSON(resp: Response): Promise<any | null> {
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await resp.json();
      } catch (e) {
        const text = await resp.text();
        throw new Error(text || 'Invalid JSON in response');
      }
    }
    const text = await resp.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(text);
    }
  }
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");

  const [fields, setFields] = useState<FormField[]>([
    {
      id: "field-1",
      label: "Full Name",
      fieldType: "text",
      options: [],
      isRequired: true,
    },
    {
      id: "field-2",
      label: "Email",
      fieldType: "email",
      options: [],
      isRequired: true,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: "",
      fieldType: "text",
      options: [],
      isRequired: false,
    };
    setFields((prev) => [...prev, newField]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields((prev) => prev.filter((field) => field.id !== id));
    } else {
      setError("You must have at least one field.");
    }
  };

  const handleFieldChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === id) {
          if (type === "checkbox") {
            return { ...field, isRequired: (e.target as HTMLInputElement).checked };
          }
          if (name === "options") {
            return { ...field, options: value.split(',').map(opt => opt.trim()) };
          }
          return { ...field, [name]: value };
        }
        return field;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!tournamentId) {
        throw new Error("No Tournament ID found. Cannot save form.");
      }

      const hasEmptyLabel = fields.some(field => field.label.trim() === "");
      if (hasEmptyLabel) {
        throw new Error("All field labels must be filled out.");
      }

      const formData: FormSetupData = {
        tournamentId: tournamentId,
        fields: fields,
      };

      const response = await fetch("/api/admin/form-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        try {
          const errorData = await parseResponseJSON(response);
          throw new Error(errorData?.message || 'Failed to save form settings');
        } catch (parseErr) {
          throw parseErr instanceof Error ? parseErr : new Error('Failed to save form settings');
        }
      }

      const result = await parseResponseJSON(response);
      // On success, redirect to spirit-config. We expect the server to echo the tournamentId.
      router.push(`/admin/setup/spirit-config?tournamentId=${tournamentId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!tournamentId) {
    return (
       <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
         <div className="max-w-3xl mx-auto">
           <div className="bg-white shadow-md rounded-lg p-6 text-center">
             <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
             <p className="text-gray-700">
               No tournament ID was provided. Please go back to the Tournament Details
               page and start over.
             </p>
             <button
              type="button"
              onClick={() => router.push('/admin/setup/tournament-details')}
              className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Back to Tournament Details
            </button>
           </div>
         </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Form Builder
          </h1>
          <p className="text-gray-600 mb-6">
            Configure the fields for the public player registration form.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Label
                      </label>
                      <input
                        type="text"
                        name="label"
                        value={field.label}
                        onChange={(e) => handleFieldChange(field.id, e)}
                        placeholder="e.g., T-Shirt Size"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Type
                      </label>
                      <select
                        name="fieldType"
                        value={field.fieldType}
                        onChange={(e) => handleFieldChange(field.id, e)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Text (Short Answer)</option>
                        <option value="email">Email</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown (Select)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="options"
                        value={field.options.join(", ")}
                        onChange={(e) => handleFieldChange(field.id, e)}
                        placeholder="e.g., S, M, L, XL"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={field.fieldType !== "select"}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        name="isRequired"
                        checked={field.isRequired}
                        onChange={(e) => handleFieldChange(field.id, e)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`required-${field.id}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Required
                      </label>
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addField}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
            >
              + Add New Field
            </button>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? "Saving Form..." : "Save & Next: Spirit Config"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}