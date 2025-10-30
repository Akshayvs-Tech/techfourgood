"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  "",
  "",
  "",
  "",
  "",
];

export default function SpiritScoreConfig() {
  const router = useRouter();
  const [configData, setConfigData] = useState<SpiritConfigData>({
    categories: [...DEFAULT_CATEGORIES],
    scoringScale: {
      min: 0,
      max: 4,
    },
    realtimePublicDisplay: false,
    submissionWindowHours: 24,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setConfigData({
      categories: [...DEFAULT_CATEGORIES],
      scoringScale: {
        min: 0,
        max: 4,
      },
      realtimePublicDisplay: false,
      submissionWindowHours: 24,
    });
    setSuccessMessage("Configuration reset to defaults");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveConfiguration = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      
      const hasEmptyCategory = configData.categories.some(
        (cat) => cat.trim() === ""
      );
      if (hasEmptyCategory) {
        alert("Please fill in all category names");
        setIsSubmitting(false);
        return;
      }

      console.log("Spirit Score Configuration:", configData);

       
      const response = await fetch("/api/admin/setup/spirit-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      const result = await response.json();
      console.log("Configuration saved successfully:", result);

      setSuccessMessage("Spirit score configuration saved successfully!");

      //redirect
    //   setTimeout(() => {
    //     router.push("/admin/setup/teams");
    //   }, 2000);

    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Spirit Score Configuration
          </h1>
          <p className="text-gray-600 mb-6">
            Configure the spirit scoring categories and settings for your
            tournament
          </p>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Scoring Scale Display */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Standard Scoring Scale
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-blue-600">0 - 4</span>
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
                    placeholder={`e.g., ${
                      index === 0
                        ? "Rules Knowledge"
                        : index === 1
                        ? "Fouls and Body Contact"
                        : index === 2
                        ? "Fair-Mindedness"
                        : index === 3
                        ? "Positive Attitude"
                        : "Communication"
                    }`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              ))}
            </div>
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
                Recommended: 24-48 hours
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSaveConfiguration}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? "Saving Configuration..." : "Save Configuration"}
            </button>
            <button
              type="button"
              onClick={handleResetToDefaults}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
