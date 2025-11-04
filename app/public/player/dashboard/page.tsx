"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TeamSummary = {
  team_id: string;
  team_name: string;
  tournament_id: string;
  tournament_name: string;
  is_captain: boolean;
  player_count?: number;
  roster_submitted?: boolean;
  roster_status?: string;
  team_status?: string;
  rejection_reason?: string;
};

export default function PlayerDashboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) {
        setError("Please login to view your dashboard.");
        setLoading(false);
        return;
      }

      // Get player info
      const { data: player } = await supabase
        .from("players")
        .select("id, email, is_captain")
        .eq("email", email)
        .maybeSingle();

      if (!player) {
        setError("Player profile not found.");
        setLoading(false);
        return;
      }

      // Get teams the player is part of (without joins to avoid RLS issues)
      const { data: teamMembers, error: tmError } = await supabase
        .from("team_members")
        .select("team_id, tournament_id")
        .eq("player_id", player.id);

      if (tmError) {
        setError(tmError.message);
        setLoading(false);
        return;
      }

      if (!teamMembers || teamMembers.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      // Get unique team and tournament IDs
      const teamIds = [...new Set(teamMembers.map((tm) => tm.team_id))];
      const tournamentIds = [...new Set(teamMembers.map((tm) => tm.tournament_id))];

      // Fetch teams and tournaments separately
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, tournament_id, captain_email, status, rejection_reason")
        .in("id", teamIds);

      if (teamsError) {
        setError(`Failed to fetch teams: ${teamsError.message}`);
        setLoading(false);
        return;
      }

      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("id, name")
        .in("id", tournamentIds);

      if (tournamentsError) {
        setError(`Failed to fetch tournaments: ${tournamentsError.message}`);
        setLoading(false);
        return;
      }

      // Create lookup maps
      const teamsMap = new Map((teamsData || []).map((t) => [t.id, t]));
      const tournamentsMap = new Map((tournamentsData || []).map((t) => [t.id, t]));

      // Get team details and roster status
      const teamsWithDetails = await Promise.all(
        teamMembers.map(async (tm) => {
          const team = teamsMap.get(tm.team_id);
          const tournament = tournamentsMap.get(tm.tournament_id);

          if (!team || !tournament) {
            return null;
          }

          // Check if player is captain (by email match)
          const isCaptain = team.captain_email === player.email || player.is_captain;

          // Get player count - fetch actual records to ensure RLS allows access
          const { data: teamMembersData, error: countError } = await supabase
            .from("team_members")
            .select("id")
            .eq("team_id", team.id)
            .eq("tournament_id", tournament.id);
          
          const playerCount = teamMembersData?.length || 0;
          
          if (countError) {
            console.warn("Error counting team members:", countError);
          }

          // Get roster status and team status
          const { data: roster } = await supabase
            .from("team_rosters")
            .select("status")
            .eq("team_id", team.id)
            .eq("tournament_id", tournament.id)
            .maybeSingle();

          const rosterStatus = roster?.status || null;
          const rosterSubmitted = rosterStatus === "Submitted" || rosterStatus === "Approved" || rosterStatus === "Rejected";
          
          // Get team status
          const teamStatus = team.status || "pending";

          return {
            team_id: team.id,
            team_name: team.name,
            tournament_id: tournament.id,
            tournament_name: tournament.name,
            is_captain: isCaptain,
            player_count: playerCount || 0,
            roster_submitted: rosterSubmitted,
            roster_status: rosterStatus,
            team_status: teamStatus,
            rejection_reason: team.rejection_reason || undefined,
          };
        })
      );

      // Filter out null values
      const validTeams = teamsWithDetails.filter((t) => t !== null) as TeamSummary[];

      setTeams(validTeams);
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmitRoster = async (teamId: string, tournamentId: string) => {
    try {
      // Call API endpoint that uses service role to bypass RLS
      const response = await fetch("/api/public/rosters/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          tournamentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit roster");
      }

      // Refresh the page to show updated status
      window.location.reload();
    } catch (err) {
      console.error("Error submitting roster:", err);
      alert(err instanceof Error ? err.message : "Failed to submit roster. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading your teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600 mb-6">View your registered tournaments and teams</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {teams.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">You haven't registered for any tournaments yet.</p>
            <button
              onClick={() => router.push("/public/upcoming")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse Upcoming Tournaments
            </button>
          </div>
        )}

        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.team_id} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{team.team_name}</h2>
                  <p className="text-gray-600 mt-1">Tournament: {team.tournament_name}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>Players: {team.player_count}</span>
                    {team.is_captain && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Captain
                      </span>
                    )}
                  </div>
                </div>
                {team.is_captain && !team.roster_submitted && (
                  <button
                    onClick={() => handleSubmitRoster(team.team_id, team.tournament_id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  >
                    Submit Roster
                  </button>
                )}
                {team.roster_status === "Submitted" && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Roster Submitted (Pending Review)
                  </span>
                )}
                {team.roster_status === "Approved" && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✓ Roster Approved
                  </span>
                )}
                {team.roster_status === "Rejected" && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    ✗ Roster Rejected
                  </span>
                )}
              </div>

              {team.is_captain && !team.roster_submitted && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    As team captain, you can submit your team roster for admin approval once you have at least the minimum number of players.
                  </p>
                </div>
              )}
              
              {team.roster_status === "Approved" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Your team roster has been approved! You're all set for the tournament.
                  </p>
                </div>
              )}
              
              {team.roster_status === "Rejected" && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    ✗ Your team roster has been rejected.
                  </p>
                  {team.rejection_reason && (
                    <p className="text-sm text-red-600">
                      <strong>Reason:</strong> {team.rejection_reason}
                    </p>
                  )}
                  <p className="text-sm text-red-600 mt-2">
                    Please review the reason above and contact the tournament administrator if you have questions.
                  </p>
                </div>
              )}
              
              {team.roster_status === "Submitted" && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Your roster is currently under review by the tournament administrators. You will be notified once a decision has been made.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



