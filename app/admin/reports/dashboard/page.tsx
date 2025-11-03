"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Player {
  fullName: string;
  email: string;
  // Add other player details if needed
}

interface PendingTeam {
  teamId: string;
  teamName: string;
  tournamentId: string; // To filter by tournament
  status: "Pending Approval" | "Approved" | "Rejected";
  rosterPlayers: Player[];
  // You might also want captain details, etc.
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Function to fetch pending teams
  const fetchPendingTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This is a NEW API route you need to create
      // It should GET all teams where status === 'Pending Approval'
      const response = await fetch("/api/admin/pending-teams");

      if (!response.ok) {
        throw new Error("Failed to fetch pending teams.");
      }
      
      const data: PendingTeam[] = await response.json();
      setPendingTeams(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Fetch teams when the component mounts
  useEffect(() => {
    fetchPendingTeams();
  }, []);

  // 4. Handle Approve/Reject actions
  const handleTeamStatusUpdate = async (
    teamId: string,
    newStatus: "Approved" | "Rejected"
  ) => {
    try {
      // This is the SECOND NEW API route you need to create
      // It should be a POST or PUT to update a team's status
      const response = await fetch("/api/admin/update-roster-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newStatus.toLowerCase()} team.`);
      }

      // If successful, remove the team from the UI for immediate feedback
      setPendingTeams((prevTeams) =>
        prevTeams.filter((team) => team.teamId !== teamId)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred.");
    }
  };

  // 5. Render Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Loading Pending Registrations...
          </h2>
          <p className="text-gray-500">Fetching data, please wait.</p>
        </div>
      </div>
    );
  }

  // 6. Render Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            An Error Occurred
          </h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button
            onClick={fetchPendingTeams}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // 7. Render Main Content
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 p-6 bg-white shadow-md rounded-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Team Registration Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Review and approve new team registrations.
          </p>
        </div>

        {/* Pending Teams List */}
        {pendingTeams.length === 0 ? (
          // No teams pending
          <div className="text-center bg-white rounded-lg shadow-md p-12 border border-gray-200">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              All Caught Up!
            </h3>
            <p className="mt-2 text-gray-500">
              There are no new teams awaiting approval.
            </p>
          </div>
        ) : (
          // Display list of pending teams
          <div className="space-y-6">
            {pendingTeams.map((team) => (
              <div
                key={team.teamId}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h2 className="text-2xl font-bold text-blue-700">
                      {team.teamName}
                    </h2>
                    <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full mt-2 sm:mt-0">
                      Pending Approval
                    </span>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      Roster ({team.rosterPlayers.length} Players)
                    </h4>
                    <ul className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {team.rosterPlayers.map((player, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center text-gray-700"
                        >
                          <span>{player.fullName}</span>
                          <span className="text-sm text-gray-500">
                            {player.email}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleTeamStatusUpdate(team.teamId, "Approved")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg"
                    >
                      Approve Team
                    </Button>
                    <Button
                      onClick={() => handleTeamStatusUpdate(team.teamId, "Rejected")}
                      variant="outline"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600 font-medium py-3 px-6 rounded-lg"
                    >
                      Reject Team
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}