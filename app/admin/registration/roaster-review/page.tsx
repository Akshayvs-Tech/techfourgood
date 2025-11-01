"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ITeam, IRoster, IPlayer } from "@/lib/types";

interface RosterWithDetails extends IRoster {
  team: ITeam;
  players: IPlayer[];
}

export default function RosterReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");

  const [rosters, setRosters] = useState<RosterWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoster, setSelectedRoster] =
    useState<RosterWithDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"Pending" | "All">(
    "Pending"
  );

  const fetchRosters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const statusParam =
        filterStatus === "All" ? "" : `&status=${filterStatus}`;
      const response = await fetch(
        `/api/admin/rosters?tournamentId=${tournamentId}${statusParam}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch rosters");
      }

      const data = await response.json();
      setRosters(data.rosters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rosters");
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, filterStatus]);

  useEffect(() => {
    if (!tournamentId) {
      setError("Tournament ID is required");
      setIsLoading(false);
      return;
    }

    fetchRosters();
  }, [tournamentId, fetchRosters]);

  const handleOpenModal = (
    roster: RosterWithDetails,
    action: "approve" | "reject"
  ) => {
    setSelectedRoster(roster);
    setActionType(action);
    setRejectionReason("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRoster(null);
    setRejectionReason("");
  };

  const handleSubmitAction = async () => {
    if (!selectedRoster) return;

    if (actionType === "reject" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/rosters/${selectedRoster.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: actionType,
          rejectionReason:
            actionType === "reject" ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update roster");
      }

      // Refresh the list
      await fetchRosters();
      handleCloseModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-800",
      Submitted: "bg-blue-100 text-blue-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Draft: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.Draft
        }`}
      >
        {status}
      </span>
    );
  };

  if (!tournamentId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
            <p className="text-gray-700">
              No tournament ID provided. Please select a tournament first.
            </p>
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Roster Review
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Review and approve team rosters for the tournament
                </p>
              </div>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as "Pending" | "All")
                  }
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending Only</option>
                  <option value="All">All Rosters</option>
                </select>
                <button
                  type="button"
                  onClick={fetchRosters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading rosters...</p>
              </div>
            </div>
          ) : rosters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium">No rosters found</p>
              <p className="text-sm mt-1">
                {filterStatus === "Pending"
                  ? "No pending rosters to review"
                  : "No rosters submitted yet"}
              </p>
            </div>
          ) : (
            /* Rosters Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rosters.map((roster) => (
                    <tr key={roster.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {roster.team.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {roster.team.contactEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {roster.playerIds.length} players
                        </div>
                        {roster.minPlayers && roster.maxPlayers && (
                          <div className="text-xs text-gray-500">
                            Required: {roster.minPlayers}-{roster.maxPlayers}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(roster.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(roster.submissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {roster.status === "Submitted" ||
                        roster.status === "Pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(roster, "approve")}
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenModal(roster, "reject")}
                              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRoster(roster);
                                setShowModal(true);
                                setActionType("approve");
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-xs">
                            {roster.status === "Approved" && "✓ Approved"}
                            {roster.status === "Rejected" && "✗ Rejected"}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Approval/Rejection */}
      {showModal && selectedRoster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {actionType === "approve" ? "Approve" : "Reject"} Roster
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Team: {selectedRoster.team.name}
              </p>
            </div>

            <div className="px-6 py-4">
              {/* Team Details */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Team Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Contact:</span>{" "}
                    {selectedRoster.team.contactEmail}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    {getStatusBadge(selectedRoster.team.rosterStatus)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Submitted:</span>{" "}
                    {new Date(selectedRoster.submissionDate).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Player List */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Players ({selectedRoster.playerIds.length})
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {selectedRoster.players.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedRoster.players.map((player) => (
                        <li
                          key={player.id}
                          className="text-sm bg-white p-3 rounded border border-gray-200"
                        >
                          <div className="font-medium text-gray-900">
                            {String(
                              player.profileData.name ||
                                player.name ||
                                "Unknown"
                            )}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {String(
                              player.profileData.email || player.email || ""
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No player details available
                    </p>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {actionType === "reject" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                    placeholder="Explain why this roster is being rejected..."
                    required
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSubmitAction}
                disabled={
                  isSubmitting ||
                  (actionType === "reject" && !rejectionReason.trim())
                }
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {isSubmitting
                  ? "Processing..."
                  : actionType === "approve"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
