"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface Field {
  id: string;
  name: string;
  location?: string;
}

interface Match {
  id: string;
  matchNumber: number;
  round: number;
  team1: string;
  team2: string;
  scheduledDate?: string;
  scheduledTime?: string;
  fieldId?: string;
  fieldName?: string;
  duration: number; // in minutes
}

interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

export default function MatchAssignmentPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <MatchAssignmentInner />
    </Suspense>
  );
}

function MatchAssignmentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tournamentId = searchParams.get("tournamentId");

  const [matches, setMatches] = useState<Match[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters and search
  const [selectedRound, setSelectedRound] = useState<number | "all">("all");
  const [selectedField, setSelectedField] = useState<string | "all">("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk assignment
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkTime, setBulkTime] = useState("");
  const [bulkField, setBulkField] = useState("");
  const [bulkInterval, setBulkInterval] = useState(90); // minutes between matches

  // Time slots (9 AM to 6 PM in 30-minute intervals)
  const timeSlots: TimeSlot[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute of [0, 30]) {
      if (hour === 18 && minute === 30) break;
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      timeSlots.push({
        hour,
        minute,
        label: `${h}:${minute.toString().padStart(2, "0")} ${ampm}`,
      });
    }
  }

  // Tournament dates (assuming 2 weeks from now)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 14);
  const tournamentDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    tournamentDates.push(date.toISOString().split("T")[0]);
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API calls
        // const [matchesRes, fieldsRes] = await Promise.all([
        //   fetch(`/api/admin/scheduling/matches?tournamentId=${tournamentId}`),
        //   fetch(`/api/admin/tournaments/fields?tournamentId=${tournamentId}`),
        // ]);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock fields data
        const mockFields: Field[] = [
          { id: "field-1", name: "Field 1", location: "Main Complex" },
          { id: "field-2", name: "Field 2", location: "Main Complex" },
          { id: "field-3", name: "Field 3", location: "South Side" },
          { id: "field-4", name: "Field 4", location: "South Side" },
        ];

        // Mock matches data
        const mockMatches: Match[] = Array.from({ length: 24 }, (_, i) => ({
          id: `match-${i + 1}`,
          matchNumber: i + 1,
          round: Math.floor(i / 8) + 1,
          team1: `Team ${((i * 2) % 16) + 1}`,
          team2: `Team ${((i * 2 + 1) % 16) + 1}`,
          duration: 75,
          scheduledDate: i < 8 ? tournamentDates[0] : undefined,
          scheduledTime: i < 8 ? timeSlots[i % 6].label : undefined,
          fieldId: i < 8 ? mockFields[i % 4].id : undefined,
          fieldName: i < 8 ? mockFields[i % 4].name : undefined,
        }));

        setFields(mockFields);
        setMatches(mockMatches);
      } catch (err) {
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const updateMatch = (matchId: string, updates: Partial<Match>) => {
    setMatches((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? {
              ...match,
              ...updates,
              fieldName: updates.fieldId
                ? fields.find((f) => f.id === updates.fieldId)?.name
                : match.fieldName,
            }
          : match
      )
    );
  };

  const clearMatchAssignment = (matchId: string) => {
    updateMatch(matchId, {
      scheduledDate: undefined,
      scheduledTime: undefined,
      fieldId: undefined,
      fieldName: undefined,
    });
  };

  const copyMatchDetails = (match: Match) => {
    if (match.scheduledDate && match.scheduledTime && match.fieldId) {
      setBulkDate(match.scheduledDate);
      setBulkTime(match.scheduledTime);
      setBulkField(match.fieldId);
      setSuccess("Match details copied! Apply to other matches below.");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatches((prev) =>
      prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId]
    );
  };

  const selectAllFiltered = () => {
    const filtered = getFilteredMatches();
    const allSelected = filtered.every((m) => selectedMatches.includes(m.id));
    if (allSelected) {
      setSelectedMatches([]);
    } else {
      setSelectedMatches(filtered.map((m) => m.id));
    }
  };

  const applyBulkAssignment = () => {
    if (!bulkDate || !bulkTime || !bulkField) {
      setError("Please select date, time, and field for bulk assignment.");
      return;
    }

    let currentTime = bulkTime;
    const sortedMatches = selectedMatches
      .map((id) => matches.find((m) => m.id === id)!)
      .sort((a, b) => a.matchNumber - b.matchNumber);

    sortedMatches.forEach((match, index) => {
      if (index > 0) {
        // Calculate next time slot
        currentTime = calculateNextTime(currentTime, bulkInterval);
      }

      updateMatch(match.id, {
        scheduledDate: bulkDate,
        scheduledTime: currentTime,
        fieldId: bulkField,
      });
    });

    setSelectedMatches([]);
    setBulkMode(false);
    setSuccess(`Successfully assigned ${sortedMatches.length} matches!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const calculateNextTime = (
    currentTime: string,
    intervalMinutes: number
  ): string => {
    // Parse current time
    const [time, period] = currentTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour24 =
      period === "PM" && hours !== 12
        ? hours + 12
        : hours === 12 && period === "AM"
        ? 0
        : hours;

    // Add interval
    let totalMinutes = hour24 * 60 + minutes + intervalMinutes;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;

    // Format back to 12-hour time
    const h = newHour % 12 || 12;
    const ampm = newHour < 12 ? "AM" : "PM";
    return `${h}:${newMinute.toString().padStart(2, "0")} ${ampm}`;
  };

  const autoAssignMatches = () => {
    const unassigned = matches.filter(
      (m) => !m.scheduledDate || !m.scheduledTime || !m.fieldId
    );

    let dateIndex = 0;
    let timeIndex = 0;
    let fieldIndex = 0;

    unassigned.forEach((match) => {
      updateMatch(match.id, {
        scheduledDate: tournamentDates[dateIndex],
        scheduledTime: timeSlots[timeIndex].label,
        fieldId: fields[fieldIndex].id,
      });

      // Cycle through fields first, then times, then dates
      fieldIndex = (fieldIndex + 1) % fields.length;
      if (fieldIndex === 0) {
        timeIndex = (timeIndex + 1) % timeSlots.length;
        if (timeIndex === 0) {
          dateIndex = (dateIndex + 1) % tournamentDates.length;
        }
      }
    });

    setSuccess(`Auto-assigned ${unassigned.length} matches!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const saveAssignments = async () => {
    const unassigned = matches.filter(
      (m) => !m.scheduledDate || !m.scheduledTime || !m.fieldId
    );

    if (unassigned.length > 0) {
      setError(
        `${unassigned.length} matches are not fully assigned. Please assign all matches before saving.`
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/scheduling/assign', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ tournamentId, matches }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess("Match assignments saved successfully! Redirecting...");
      setTimeout(() => {
        router.push(`/admin/scheduling/calendar?tournamentId=${tournamentId}`);
      }, 2000);
    } catch (err) {
      setError("Failed to save assignments. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getFilteredMatches = () => {
    return matches.filter((match) => {
      const roundMatch =
        selectedRound === "all" || match.round === selectedRound;
      const fieldMatch =
        selectedField === "all" || match.fieldId === selectedField;
      const dateMatch = !selectedDate || match.scheduledDate === selectedDate;
      const searchMatch =
        !searchQuery ||
        match.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.team2.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.matchNumber.toString().includes(searchQuery);

      return roundMatch && fieldMatch && dateMatch && searchMatch;
    });
  };

  const filteredMatches = getFilteredMatches();
  const assignedCount = matches.filter(
    (m) => m.scheduledDate && m.scheduledTime && m.fieldId
  ).length;

  if (!tournamentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Tournament ID Missing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please select a tournament to assign matches.
          </p>
          <Button onClick={() => router.push("/admin")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Match Assignment
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Assign fields and times to matches ({assignedCount}/
                {matches.length} assigned)
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={autoAssignMatches}
                disabled={assignedCount === matches.length}
              >
                <RefreshCw className="w-4 h-4" />
                Auto Assign
              </Button>
              <Button
                onClick={() => setBulkMode(!bulkMode)}
                variant={bulkMode ? "default" : "outline"}
              >
                {bulkMode ? "Exit Bulk Mode" : "Bulk Assign"}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(assignedCount / matches.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Bulk Assignment Panel */}
        {bulkMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Bulk Assignment ({selectedMatches.length} matches selected)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <select
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select date</option>
                  {tournamentDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <select
                  value={bulkTime}
                  onChange={(e) => setBulkTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.label} value={slot.label}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field
                </label>
                <select
                  value={bulkField}
                  onChange={(e) => setBulkField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select field</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interval (min)
                </label>
                <input
                  type="number"
                  value={bulkInterval}
                  onChange={(e) => setBulkInterval(parseInt(e.target.value))}
                  min="30"
                  max="180"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={applyBulkAssignment}
                disabled={
                  selectedMatches.length === 0 ||
                  !bulkDate ||
                  !bulkTime ||
                  !bulkField
                }
              >
                Apply to Selected Matches
              </Button>
              <Button variant="outline" onClick={selectAllFiltered}>
                {filteredMatches.every((m) => selectedMatches.includes(m.id))
                  ? "Deselect All"
                  : "Select All Filtered"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMatches([]);
                  setBulkMode(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by team or match number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedRound}
                onChange={(e) =>
                  setSelectedRound(
                    e.target.value === "all" ? "all" : parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Rounds</option>
                {Array.from(new Set(matches.map((m) => m.round)))
                  .sort((a, b) => a - b)
                  .map((round) => (
                    <option key={round} value={round}>
                      Round {round}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Fields</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Dates</option>
                {tournamentDates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery ||
            selectedRound !== "all" ||
            selectedField !== "all" ||
            selectedDate) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredMatches.length} of {matches.length} matches
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRound("all");
                  setSelectedField("all");
                  setSelectedDate("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Matches List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {bulkMode && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          filteredMatches.length > 0 &&
                          filteredMatches.every((m) =>
                            selectedMatches.includes(m.id)
                          )
                        }
                        onChange={selectAllFiltered}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Match
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Teams
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMatches.map((match) => (
                  <tr
                    key={match.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedMatches.includes(match.id)
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    {bulkMode && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedMatches.includes(match.id)}
                          onChange={() => toggleMatchSelection(match.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{match.matchNumber}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Round {match.round}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {match.team1}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          vs
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {match.team2}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={match.scheduledDate || ""}
                        onChange={(e) =>
                          updateMatch(match.id, {
                            scheduledDate: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select date</option>
                        {tournamentDates.map((date) => (
                          <option key={date} value={date}>
                            {new Date(date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={match.scheduledTime || ""}
                        onChange={(e) =>
                          updateMatch(match.id, {
                            scheduledTime: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select time</option>
                        {timeSlots.map((slot) => (
                          <option key={slot.label} value={slot.label}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={match.fieldId || ""}
                        onChange={(e) =>
                          updateMatch(match.id, { fieldId: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select field</option>
                        {fields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyMatchDetails(match)}
                          disabled={
                            !match.scheduledDate ||
                            !match.scheduledTime ||
                            !match.fieldId
                          }
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Copy details"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => clearMatchAssignment(match.id)}
                          disabled={
                            !match.scheduledDate &&
                            !match.scheduledTime &&
                            !match.fieldId
                          }
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Clear assignment"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMatches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No matches found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/admin/scheduling/builder?tournamentId=${tournamentId}`
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Builder
          </Button>

          <Button
            onClick={saveAssignments}
            disabled={isSaving || assignedCount < matches.length}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Assignments
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
