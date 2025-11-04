"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface SpiritConfigData {
  categories: string[];
  scoringScale: {
    min: number;
    max: number;
  };
  realtimePublicDisplay: boolean;
  submissionWindowHours: number;
}

const DEFAULT_CATEGORIES = [
  "Rules Knowledge",
  "Fouls and Body Contact",
  "Fair-Mindedness",
  "Positive Attitude",
  "Communication",
];

const DEFAULT_CONFIG: SpiritConfigData = {
  categories: [...DEFAULT_CATEGORIES],
  scoringScale: {
    min: 0,
    max: 4,
  },
  realtimePublicDisplay: false,
  submissionWindowHours: 24,
};

export default function SpiritScoreConfig() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SpiritConfigInner />
    </Suspense>
  );
}

function SpiritConfigInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");

  const [configData, setConfigData] =
    useState<SpiritConfigData>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] =
    useState<SpiritConfigData>(DEFAULT_CONFIG);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing configuration on component mount
  useEffect(() => {
    fetchSpiritConfig();
  }, [tournamentId]);

  // Check for changes
  useEffect(() => {
    const hasChanged =
      JSON.stringify(configData) !== JSON.stringify(originalConfig);
    setHasChanges(hasChanged);
  }, [configData, originalConfig]);

  const fetchSpiritConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const url = tournamentId
        ? `/api/admin/setup/spirit-config?tournamentId=${tournamentId}`
        : `/api/admin/setup/spirit-config`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          // No config exists yet, use defaults
          console.log("No existing config found, using defaults");
          setConfigData(DEFAULT_CONFIG);
          setOriginalConfig(DEFAULT_CONFIG);
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch spirit configuration");
      }

      const data = await response.json();

      // Validate and set the fetched data
      const fetchedConfig: SpiritConfigData = {
        categories: data.categories || DEFAULT_CATEGORIES,
        scoringScale: data.scoringScale || DEFAULT_CONFIG.scoringScale,
        realtimePublicDisplay:
          data.realtimePublicDisplay ?? DEFAULT_CONFIG.realtimePublicDisplay,
        submissionWindowHours:
          data.submissionWindowHours || DEFAULT_CONFIG.submissionWindowHours,
      };

      setConfigData(fetchedConfig);
      setOriginalConfig(fetchedConfig);

      console.log("Fetched spirit config:", fetchedConfig);
    } catch (err) {
      console.error("Error fetching spirit config:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load configuration"
      );
      // Use defaults on error
      setConfigData(DEFAULT_CONFIG);
      setOriginalConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (index: number, value: string) => {
    const updatedCategories = [...configData.categories];
    updatedCategories[index] = value;
    setConfigData((prev) => ({
      ...prev,
      categories: updatedCategories,
    }));
  };

  const handleToggleChange = () => {
    setConfigData((prev) => ({
      ...prev,
      realtimePublicDisplay: !prev.realtimePublicDisplay,
    }));
  };

  const handleSubmissionWindowChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value) || 0;
    setConfigData((prev) => ({
      ...prev,
      submissionWindowHours: value,
    }));
  };

  const handleResetToDefaults = () => {
    setConfigData(DEFAULT_CONFIG);
    setSuccessMessage("Configuration reset to defaults");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRevertChanges = () => {
    setConfigData(originalConfig);
    setSuccessMessage("Changes reverted to saved configuration");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveConfiguration = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setError(null);

    try {
      // Validation
      const hasEmptyCategory = configData.categories.some(
        (cat) => cat.trim() === ""
      );
      if (hasEmptyCategory) {
        setError("Please fill in all category names");
        setIsSubmitting(false);
        return;
      }

      if (
        configData.submissionWindowHours < 1 ||
        configData.submissionWindowHours > 168
      ) {
        setError("Submission window must be between 1 and 168 hours");
        setIsSubmitting(false);
        return;
      }

      // Prepare payload
      const payload = {
        ...configData,
        ...(tournamentId && { tournamentId }),
      };

      console.log("Saving Spirit Score Configuration:", payload);

      const response = await fetch("/api/admin/setup/spirit-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }

      const result = await response.json();
      console.log("Configuration saved successfully:", result);

      // Update original config to match saved data
      setOriginalConfig(configData);
      setSuccessMessage(
        "Spirit score configuration saved successfully! Redirecting to roster review..."
      );

      // Redirect to roster review dashboard after 2 seconds
      setTimeout(() => {
        router.push(
          `/admin/registration/roster-review?tournamentId=${tournamentId}`
        );
      }, 2000);
    } catch (err) {
      console.error("Error saving configuration:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save configuration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            Loading Spirit Configuration...
          </h2>
          <p className="text-gray-500 mt-2">Fetching saved settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Spirit Score Configuration
            </h1>
            <p className="text-gray-600">
              Configure the spirit scoring categories and settings for your
              tournament
            </p>
            {tournamentId && (
              <p className="text-sm text-blue-600 mt-2">
                Tournament ID: {tournamentId}
              </p>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-800 font-medium">
                  You have unsaved changes
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Save your changes or revert to the last saved configuration
                </p>
              </div>
            </div>
          )}

          {/* Scoring Scale Display */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Standard Scoring Scale
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-blue-600">
                {configData.scoringScale.min} - {configData.scoringScale.max}
              </span>
              <span className="text-sm text-gray-700">
                (0 = Poor, 1 = Below Average, 2 = Average, 3 = Good, 4 =
                Excellent)
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              This scale will be used for all spirit score submissions
            </p>
          </div>

          {/* Spirit Categories */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Spirit Categories (Exactly 5 Required)
            </h2>
            <div className="space-y-3">
              {configData.categories.map((category, index) => (
                <div key={index}>
                  <label
                    htmlFor={`category-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category {index + 1} *
                  </label>
                  <input
                    type="text"
                    id={`category-${index}`}
                    value={category}
                    onChange={(e) =>
                      handleCategoryChange(index, e.target.value)
                    }
                    placeholder={`e.g., ${DEFAULT_CATEGORIES[index]}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Default categories: {DEFAULT_CATEGORIES.join(", ")}
            </p>
          </div>

          {/* Configuration Settings */}
          <div className="mb-8 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configuration Settings
            </h2>

            {/* Real-time Public Display Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
              <div>
                <label
                  htmlFor="realtimeDisplay"
                  className="text-sm font-medium text-gray-900 block"
                >
                  Real-time Public Display
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Spirit scores will be visible immediately after submission
                </p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  id="realtimeDisplay"
                  checked={configData.realtimePublicDisplay}
                  onChange={handleToggleChange}
                  className="sr-only peer"
                />
                <label
                  htmlFor="realtimeDisplay"
                  className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 cursor-pointer transition-colors"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      configData.realtimePublicDisplay
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            {/* Submission Window */}
            <div className="p-4 bg-gray-50 rounded-md">
              <label
                htmlFor="submissionWindow"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Submission Window (Hours) *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Deadline for teams to submit spirit scores after match
                completion
              </p>
              <input
                type="number"
                id="submissionWindow"
                min="1"
                max="168"
                value={configData.submissionWindowHours}
                onChange={handleSubmissionWindowChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 24-48 hours (Max: 168 hours / 1 week)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleSaveConfiguration}
              disabled={isSubmitting || !hasChanges}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                "Save Configuration"
              )}
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleRevertChanges}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Revert Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleResetToDefaults}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Info Footer */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Changes to spirit scoring configuration
              will apply to all future spirit score submissions. Existing
              submissions will not be affected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
