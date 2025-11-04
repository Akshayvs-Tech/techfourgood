"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface TournamentFormData {
  name: string; 
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  venue: string;
  fields: string[];
  rules: string;
  format: string;
  maxTeams: number;
  status: "Setup" | "Active" | "Complete";
}

export default function TournamentDetailsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <TournamentDetailsPageInner />
    </Suspense>
  );
}

function TournamentDetailsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const isEditMode = !!tournamentId;

  const [formData, setFormData] = useState<TournamentFormData>({
    name: "", 
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    venue: "",
    fields: [""],
    rules: "",
    format: "",
    maxTeams: 16,
    status: "Setup", 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programManagers, setProgramManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedPmId, setSelectedPmId] = useState<string>("");

  // Load tournament data if editing
  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
    // Load program managers for assignment
    const loadPMs = async () => {
      try {
        const res = await fetch("/api/admin/program-managers");
        const j = await res.json();
        setProgramManagers(j.programManagers || []);
      } catch {}
    };
    loadPMs();
  }, [tournamentId]);

  const loadTournament = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          name: data.name || "",
          startDate: data.start_date ? new Date(data.start_date).toISOString().split("T")[0] : "",
          endDate: data.end_date ? new Date(data.end_date).toISOString().split("T")[0] : "",
          registrationDeadline: data.registration_deadline ? new Date(data.registration_deadline).toISOString().split("T")[0] : "",
          venue: data.venue || "",
          fields: data.fields && data.fields.length > 0 ? data.fields : [""],
          rules: data.rules || "",
          format: data.format || "",
          maxTeams: data.max_teams || 16,
          status: (data.status as "Setup" | "Active" | "Complete") || "Setup",
        });
      }
    } catch (err) {
      console.error("Error loading tournament:", err);
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxTeams" ? parseInt(value) || 0 : value,
    }));
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...formData.fields];
    newFields[index] = value;
    setFormData((prev) => ({ ...prev, fields: newFields }));
  };

  const addField = () => {
    setFormData((prev) => ({ ...prev, fields: [...prev.fields, ""] }));
  };

  const removeField = (index: number) => {
    if (formData.fields.length > 1) {
      const newFields = formData.fields.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, fields: newFields }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const filteredFields = formData.fields.filter(
        (field) => field.trim() !== ""
      );
      if (filteredFields.length === 0) {
        throw new Error("Please add at least one field");
      }

      // Convert string dates to Date objects for the API
      const tournamentData = {
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        rules: formData.rules,
        status: formData.status,
        // Additional fields for your app (not in ITournament interface)
        registrationDeadline: formData.registrationDeadline,
        venue: formData.venue,
        fields: filteredFields,
        format: formData.format,
        maxTeams: formData.maxTeams,
      };

     

      const response = await fetch("/api/admin/setup/tournament", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...tournamentData,
          id: tournamentId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? "update" : "create"} tournament`);
      }

      const result = await response.json();
      const savedTournamentId = result.tournament?.id || tournamentId;

      // Assign program manager if selected
      if (selectedPmId) {
        await fetch("/api/admin/tournament/assign-pm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournamentId: savedTournamentId, programManagerId: selectedPmId }),
        });
      }

      // Redirect to forms setup page or dedicated tournament dashboard
      if (!isEditMode) {
        router.push(`/admin/setup/forms-setup?tournamentId=${savedTournamentId}`);
      } else {
        router.push(`/admin/dashboard?tournamentId=${savedTournamentId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating tournament:", err); // For debugging
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {isEditMode ? "Edit Tournament" : "Create Tournament"}
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tournament Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Summer Championship 2025"
              />
            </div>

            {/* Dates Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="registrationDeadline"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Registration Deadline *
                </label>
                <input
                  type="date"
                  id="registrationDeadline"
                  name="registrationDeadline"
                  required
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  max={formData.startDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label
                htmlFor="venue"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Venue *
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                required
                value={formData.venue}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., City Sports Complex"
              />
            </div>

            {/* Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Playing Fields *
              </label>
              {formData.fields.map((field, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Field ${
                      index + 1
                    } (e.g., Main Field, Field A)`}
                  />
                  {formData.fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addField}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                + Add Field
              </button>
            </div>

            {/* Tournament Format */}
            <div>
              <label
                htmlFor="format"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tournament Format *
              </label>
              <select
                id="format"
                name="format"
                required
                value={formData.format}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Format</option>
                <option value="knockout">Knockout</option>
                <option value="round-robin">Round Robin</option>
                <option value="group-knockout">Group Stage + Knockout</option>
              </select>
            </div>

            {/* Program Manager Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Program Manager</label>
              <select
                value={selectedPmId}
                onChange={(e) => setSelectedPmId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Program Manager (optional)</option>
                {programManagers.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.full_name}</option>
                ))}
              </select>
            </div>

            {/* Max Teams */}
            <div>
              <label
                htmlFor="maxTeams"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Maximum Teams *
              </label>
              <input
                type="number"
                id="maxTeams"
                name="maxTeams"
                required
                min="2"
                max="64"
                value={formData.maxTeams}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rules */}
            <div>
              <label
                htmlFor="rules"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tournament Rules *
              </label>
              <textarea
                id="rules"
                name="rules"
                required
                rows={8}
                value={formData.rules}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tournament rules, regulations, and guidelines..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting
                  ? (isEditMode ? "Updating Tournament..." : "Creating Tournament...")
                  : (isEditMode ? "Save Changes" : "Save & Next: Forms Setup")}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
