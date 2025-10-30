'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"

interface TournamentFormData{
    tournamentName: string,
    tournamentId: string,
    startDate: string,
    endDate: string,
    registrationDeadline: string,
    venue: string,
    fields: string[],
    rules: string,
    format: string,
    maxTeams: number,
}

export default function TournamentDetailsPage() {
    const router = useRouter();
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
    const [formData,setFormData]=useState<TournamentFormData>({
        tournamentName: '',
        tournamentId: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        venue: '',
        fields: [''],
        rules: '',
        format: '',
        maxTeams: 16,
    })

    const [isSubmitting,setIsSubmitting]=useState(false);
    const [error,setError]=useState<string|null>(null);

    const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxTeams' ? parseInt(value) || 0 : value,
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
      // Validate fields
      const filteredFields = formData.fields.filter((field) => field.trim() !== '');
      if (filteredFields.length === 0) {
        throw new Error('Please add at least one field');
      }

      const tournamentData = {
        ...formData,
        fields: filteredFields,
      };

      // API call to save tournament
      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournamentData),
      });

      if (!response.ok) {
        // Try to parse JSON safely; if it's not JSON, parseResponseJSON will
        // throw a readable error or return null.
        try {
          const errorData = await parseResponseJSON(response);
          throw new Error(errorData?.message || 'Failed to create tournament');
        } catch (parseErr) {
          // If parsing fails, surface the parse error message (likely HTML/text)
          throw parseErr instanceof Error ? parseErr : new Error('Failed to create tournament');
        }
      }

       // Attempt to parse a successful JSON response safely
       const result = await parseResponseJSON(response);
       if (!result || !result.tournamentId) {
         throw new Error('Invalid server response: missing tournamentId');
       }

      // Redirect
      router.push(`/admin/setup/forms-setup?tournamentId=${result.tournamentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Create Tournament
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
              htmlFor="tournamentName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tournament Name *
            </label>
            <input
              type="text"
              id="tournamentName"
              name="tournamentName"
              required
              value={formData.tournamentName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Summer Championship 2025"
            />
          </div>

          {/* Tournament ID */}
          <div>
            <label
              htmlFor="tournamentId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tournament ID *
            </label>
            <input
              type="text"
              id="tournamentId"
              name="tournamentId"
              required
              value={formData.tournamentId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., SUMMER-2025"
              pattern="[A-Z0-9\-]+"
              title="Use uppercase letters, numbers, and hyphens only"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use uppercase letters, numbers, and hyphens
            </p>
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
                  placeholder={`Field ${index + 1} (e.g., Main Field, Field A)`}
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
              <option value="knockout">Knockout</option>
              <option value="round-robin">Round Robin</option>
              <option value="group-knockout">Group Stage + Knockout</option>
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
              {isSubmitting ? "Creating Tournament..." : "Create Tournament"}
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