"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export const dynamic = 'force-dynamic';
import { IPlayer, IRoster } from "@/lib/types";

interface SelectedPlayer extends IPlayer {
  selected: boolean;
}

export default function RosterSubmitPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <RosterSubmitInner />
    </Suspense>
  );
}

function RosterSubmitInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Use default tournament if not provided in URL
  const tournamentId = searchParams.get("tournamentId") || "default-tournament";
  const teamId = searchParams.get("teamId");

  const getPlayerName = (player: IPlayer): string => {
    return String(player.profileData.name || player.name || "Unknown Player");
  };

  const getPlayerEmail = (player: IPlayer): string => {
    return String(player.profileData.email || player.email || "No email");
  };

  const getPlayerPosition = (player: IPlayer): string | null => {
    return player.profileData.position
      ? String(player.profileData.position)
      : null;
  };

  const [availablePlayers, setAvailablePlayers] = useState<SelectedPlayer[]>(
    []
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [minPlayers] = useState<number>(7);
  const [maxPlayers] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIXED: Use useCallback to avoid dependency issues
  const fetchTeamAndPlayers = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch team details
      const teamResponse = await fetch(
        `/api/public/teams/${teamId}?tournamentId=${tournamentId}`
      );
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamName(teamData.team.name);
      }

      // Fetch registered players for this tournament
      const playersResponse = await fetch(
        `/api/public/players?tournamentId=${tournamentId}&status=Approved`
      );

      if (!playersResponse.ok) {
        throw new Error("Failed to fetch players");
      }

      const playersData = await playersResponse.json();
      const players: SelectedPlayer[] = playersData.players.map(
        (player: IPlayer) => ({
          ...player,
          selected: false,
        })
      );

      setAvailablePlayers(players);

      // Fetch existing roster if any
      const rosterResponse = await fetch(
        `/api/public/rosters/${teamId}?tournamentId=${tournamentId}`
      );

      if (rosterResponse.ok) {
        const rosterData = await rosterResponse.json();
        if (rosterData.roster) {
          setSelectedPlayerIds(rosterData.roster.playerIds);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, teamId]);

  useEffect(() => {
    if (!teamId) {
      setError(
        "Team ID is required. Please complete player registration first."
      );
      setIsLoading(false);
      return;
    }

    fetchTeamAndPlayers();
  }, [tournamentId, teamId, fetchTeamAndPlayers]);

  const handlePlayerToggle = (playerId: string) => {
    setError(null);
    setSuccess(null);

    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        if (prev.length >= maxPlayers) {
          setError(`Maximum ${maxPlayers} players allowed`);
          return prev;
        }
        return [...prev, playerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.length === availablePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      const allPlayerIds = availablePlayers
        .slice(0, maxPlayers)
        .map((p) => p.id);
      setSelectedPlayerIds(allPlayerIds);
    }
  };

  const validateRoster = (): string | null => {
    if (selectedPlayerIds.length < minPlayers) {
      return `Please select at least ${minPlayers} players`;
    }

    if (selectedPlayerIds.length > maxPlayers) {
      return `Maximum ${maxPlayers} players allowed`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateRoster();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!tournamentId || !teamId) {
        throw new Error("Tournament ID and Team ID are required");
      }

      const rosterData: Partial<IRoster> = {
        teamId,
        tournamentId,
        playerIds: selectedPlayerIds,
        submissionDate: new Date(),
        status: "Submitted",
        minPlayers,
        maxPlayers,
      };

      const response = await fetch("/api/public/rosters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rosterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit roster");
      }

      setSuccess("Roster submitted successfully! Awaiting admin approval.");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/public/register/confirmation?teamId=${teamId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tournamentId || !teamId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
            <p className="text-gray-700">
              Invalid access. Please ensure you have the correct tournament and
              team IDs.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submit Team Roster
            </h1>
            <p className="text-gray-600">
              Team: <span className="font-semibold">{teamName}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Select {minPlayers}-{maxPlayers} players for your team roster
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Roster Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Selected Players: {selectedPlayerIds.length} / {maxPlayers}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Minimum required: {minPlayers}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  {selectedPlayerIds.length === availablePlayers.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(selectedPlayerIds.length / maxPlayers) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Available Players List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Available Players
              </h3>

              {availablePlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No approved players found for this tournament.</p>
                  <p className="text-sm mt-2">
                    Players must register and be approved before they can be
                    added to a roster.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {availablePlayers.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const isDisabled =
                      !isSelected && selectedPlayerIds.length >= maxPlayers;
                    const position = getPlayerPosition(player);

                    return (
                      <div
                        key={player.id}
                        className={`border rounded-lg p-4 transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : isDisabled
                            ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                            : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                        onClick={() =>
                          !isDisabled && handlePlayerToggle(player.id)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handlePlayerToggle(player.id)}
                              disabled={isDisabled}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {getPlayerName(player)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {getPlayerEmail(player)}
                              </p>
                              {position && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Position: {position}
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-blue-600 font-medium text-sm">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || selectedPlayerIds.length < minPlayers}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting
                  ? "Submitting Roster..."
                  : `Submit Roster (${selectedPlayerIds.length} players)`}
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
