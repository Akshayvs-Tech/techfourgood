"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Users,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Check,
  X,
  Download,
  RefreshCw,
  Info,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Share2,
} from "lucide-react";

interface Player {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  gender: string;
  dateOfBirth: string;
}

interface Team {
  id: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  tournamentId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  players: Player[];
  rejectionReason?: string;
}

interface Tournament {
  id: string;
  name: string;
  registrationDeadline: string;
}

export default function RosterReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Selected team for detail view
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Registration link
  const [linkCopied, setLinkCopied] = useState(false);
  const registrationUrl = tournamentId
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/public/register/player?tournamentId=${tournamentId}`
    : "";

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  useEffect(() => {
    applyFilters();
  }, [teams, statusFilter, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API calls
      const [tournamentRes, teamsRes] = await Promise.all([
        fetch(`/api/admin/tournament/${tournamentId}`),
        fetch(`/api/admin/registration/teams?tournamentId=${tournamentId}`),
      ]);

      if (!tournamentRes.ok || !teamsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const tournamentData = await tournamentRes.json();
      const teamsData = await teamsRes.json();

      setTournament(tournamentData);
      setTeams(teamsData);
    } catch (err) {
      console.error("Error fetching data:", err);

      // Mock data for testing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockTournament: Tournament = {
        id: tournamentId!,
        name: "Summer Ultimate Championship 2024",
        registrationDeadline: "2024-11-25",
      };

      const mockTeams: Team[] = [
        {
          id: "team-1",
          teamName: "Thunder Bolts",
          captainName: "John Smith",
          captainEmail: "john@thunderbolts.com",
          captainPhone: "+1234567890",
          tournamentId: tournamentId!,
          status: "pending",
          submittedAt: "2024-11-01T10:30:00Z",
          players: [
            {
              id: "p1",
              fullName: "John Smith",
              email: "john@example.com",
              contactNumber: "+1234567890",
              gender: "Male",
              dateOfBirth: "1995-05-15",
            },
            {
              id: "p2",
              fullName: "Jane Doe",
              email: "jane@example.com",
              contactNumber: "+1234567891",
              gender: "Female",
              dateOfBirth: "1996-08-20",
            },
            {
              id: "p3",
              fullName: "Mike Johnson",
              email: "mike@example.com",
              contactNumber: "+1234567892",
              gender: "Male",
              dateOfBirth: "1994-03-10",
            },
            {
              id: "p4",
              fullName: "Sarah Williams",
              email: "sarah@example.com",
              contactNumber: "+1234567893",
              gender: "Female",
              dateOfBirth: "1997-11-25",
            },
            {
              id: "p5",
              fullName: "Tom Brown",
              email: "tom@example.com",
              contactNumber: "+1234567894",
              gender: "Male",
              dateOfBirth: "1995-07-08",
            },
            {
              id: "p6",
              fullName: "Emily Davis",
              email: "emily@example.com",
              contactNumber: "+1234567895",
              gender: "Female",
              dateOfBirth: "1996-12-30",
            },
            {
              id: "p7",
              fullName: "Chris Wilson",
              email: "chris@example.com",
              contactNumber: "+1234567896",
              gender: "Male",
              dateOfBirth: "1993-09-18",
            },
          ],
        },
        {
          id: "team-2",
          teamName: "Lightning Strike",
          captainName: "Alice Johnson",
          captainEmail: "alice@lightning.com",
          captainPhone: "+1234567897",
          tournamentId: tournamentId!,
          status: "approved",
          submittedAt: "2024-10-28T14:20:00Z",
          players: Array.from({ length: 8 }, (_, i) => ({
            id: `p${i + 10}`,
            fullName: `Player ${i + 1}`,
            email: `player${i + 1}@lightning.com`,
            contactNumber: `+123456789${i}`,
            gender: i % 2 === 0 ? "Male" : "Female",
            dateOfBirth: "1995-01-01",
          })),
        },
        {
          id: "team-3",
          teamName: "Storm Chasers",
          captainName: "Bob Williams",
          captainEmail: "bob@stormchasers.com",
          captainPhone: "+1234567898",
          tournamentId: tournamentId!,
          status: "pending",
          submittedAt: "2024-11-02T09:15:00Z",
          players: Array.from({ length: 10 }, (_, i) => ({
            id: `p${i + 20}`,
            fullName: `Player ${i + 1}`,
            email: `player${i + 1}@storm.com`,
            contactNumber: `+123456789${i}`,
            gender: i % 2 === 0 ? "Male" : "Female",
            dateOfBirth: "1996-06-15",
          })),
        },
        {
          id: "team-4",
          teamName: "Wind Runners",
          captainName: "Carol Martinez",
          captainEmail: "carol@windrunners.com",
          captainPhone: "+1234567899",
          tournamentId: tournamentId!,
          status: "rejected",
          submittedAt: "2024-10-30T16:45:00Z",
          rejectionReason:
            "Incomplete roster - only 5 players submitted (minimum 7 required)",
          players: Array.from({ length: 5 }, (_, i) => ({
            id: `p${i + 30}`,
            fullName: `Player ${i + 1}`,
            email: `player${i + 1}@wind.com`,
            contactNumber: `+123456789${i}`,
            gender: i % 2 === 0 ? "Male" : "Female",
            dateOfBirth: "1994-04-20",
          })),
        },
      ];

      setTournament(mockTournament);
      setTeams(mockTeams);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...teams];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((team) => team.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.teamName.toLowerCase().includes(query) ||
          team.captainName.toLowerCase().includes(query) ||
          team.captainEmail.toLowerCase().includes(query)
      );
    }

    setFilteredTeams(filtered);
  };

  const handleApproveTeam = async (teamId: string) => {
    await handleStatusUpdate(teamId, "approved");
  };

  const handleRejectTeam = async (teamId: string) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }
    await handleStatusUpdate(teamId, "rejected", rejectionReason);
    setRejectionReason("");
  };

  const handleStatusUpdate = async (
    teamId: string,
    newStatus: "approved" | "rejected",
    reason?: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/admin/registration/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          status: newStatus,
          rejectionReason: reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${newStatus} team`);
      }

      const result = await response.json();
      console.log("Status update result:", result);

      // Update local state - update the team in the list
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, status: newStatus, rejectionReason: reason }
            : team
        )
      );

      // Show success message
      const teamName = teams.find((t) => t.id === teamId)?.teamName || "Team";
      setSuccessMessage(
        `"${teamName}" ${
          newStatus === "approved" ? "approved" : "rejected"
        } successfully! ${
          newStatus === "approved"
            ? "Approval email has been sent to the team captain."
            : "Rejection notification has been sent to the team captain."
        }`
      );

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

      // Close the modal
      setSelectedTeam(null);

      // The filtered view will automatically update due to applyFilters() effect
    } catch (err) {
      console.error("Error updating team status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating team status"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const copyRegistrationLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const shareRegistrationLink = async () => {
    const shareData = {
      title: `Register for ${tournament?.name}`,
      text: `Join us for ${tournament?.name}! Register your team now.`,
      url: registrationUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      copyRegistrationLink();
    }
  };

  const getStatusBadge = (status: Team["status"]) => {
    const styles = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };

    const labels = {
      pending: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const pendingCount = teams.filter((t) => t.status === "pending").length;
  const approvedCount = teams.filter((t) => t.status === "approved").length;
  const rejectedCount = teams.filter((t) => t.status === "rejected").length;

  if (!tournamentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Tournament ID Missing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please select a tournament to review rosters.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go to  Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Loading team rosters...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Roster Review Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review and approve team registrations for {tournament?.name}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-200">
              {successMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-200">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {/* Public Registration Link */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Public Registration Link
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Share this link with teams to register
              </p>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 font-mono text-xs break-all">
                  {registrationUrl}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyRegistrationLink}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={shareRegistrationLink}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => window.open(registrationUrl, "_blank")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Teams
              </h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {teams.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Review
              </h3>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved
              </h3>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rejected
              </h3>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by team name, captain name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "approved"
                      | "rejected"
                  )
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={fetchData}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {(statusFilter !== "all" || searchQuery) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredTeams.length} of {teams.length} teams
              </p>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Teams List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {filteredTeams.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {searchQuery || statusFilter !== "all"
                  ? "No teams match your filters"
                  : "No team registrations yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Team Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Captain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {team.teamName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white">
                            {team.captainName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {team.captainEmail}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {team.captainPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {team.players.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(team.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(team.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Team Detail Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedTeam.teamName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review team roster and approve or reject registration
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Captain Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Team Captain
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Name
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedTeam.captainName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Email
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedTeam.captainEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Phone
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedTeam.captainPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roster */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Team Roster ({selectedTeam.players.length} players)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            #
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Phone
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Gender
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            DOB
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedTeam.players.map((player, index) => (
                          <tr key={player.id}>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {player.fullName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {player.email}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {player.contactNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {player.gender}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(
                                player.dateOfBirth
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedTeam.status === "rejected" &&
                  selectedTeam.rejectionReason && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                        Rejection Reason
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {selectedTeam.rejectionReason}
                      </p>
                    </div>
                  )}

                {/* Actions */}
                {selectedTeam.status === "pending" && (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleApproveTeam(selectedTeam.id)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Approve Team
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason (required if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={() => handleRejectTeam(selectedTeam.id)}
                        disabled={isProcessing || !rejectionReason.trim()}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject Team
                      </button>
                    </div>
                  </div>
                )}

                {selectedTeam.status === "approved" && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-green-700 dark:text-green-200 font-medium">
                      This team has been approved
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
