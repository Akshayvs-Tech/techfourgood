"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  //   Users,
  Grid3x3,
  List,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Shuffle,
  ArrowUpDown,
  Calendar,
  Info,
} from "lucide-react";

type TournamentFormat = "bracket" | "round-robin" | "pool-play";
type SeedingMethod = "manual" | "random" | "ranking";

interface Team {
  id: string;
  name: string;
  seedPosition?: number;
  players: number;
  contactEmail: string;
  registrationDate: string;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  team1?: string;
  team2?: string;
  scheduledTime?: string;
  field?: string;
}

export default function BracketBuilderPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <BracketBuilderInner />
    </Suspense>
  );
}

function BracketBuilderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tournamentId = searchParams.get("tournamentId");

  const [selectedFormat, setSelectedFormat] =
    useState<TournamentFormat>("bracket");
  const [seedingMethod, setSeedingMethod] = useState<SeedingMethod>("manual");
  const [teams, setTeams] = useState<Team[]>([]);
  const [seededTeams, setSeededTeams] = useState<Team[]>([]);
  const [generatedMatches, setGeneratedMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Format configurations
  const [numberOfPools, setNumberOfPools] = useState(2);
//   const [teamsPerPool, setTeamsPerPool] = useState(4);

  const formatOptions = [
    {
      id: "bracket" as TournamentFormat,
      label: "Single Elimination Bracket",
      description:
        "Teams compete in a knockout format. One loss eliminates a team.",
      icon: Trophy,
      minTeams: 4,
      maxTeams: 64,
      recommendedFor: "Quick tournaments with clear winners",
    },
    {
      id: "round-robin" as TournamentFormat,
      label: "Round Robin",
      description: "Every team plays against every other team once.",
      icon: List,
      minTeams: 3,
      maxTeams: 16,
      recommendedFor: "Fair competition where all teams play multiple games",
    },
    {
      id: "pool-play" as TournamentFormat,
      label: "Pool Play + Bracket",
      description:
        "Teams divided into pools, then top teams advance to bracket.",
      icon: Grid3x3,
      minTeams: 8,
      maxTeams: 32,
      recommendedFor: "Large tournaments with balanced play",
    },
  ];

  const seedingOptions = [
    {
      id: "manual" as SeedingMethod,
      label: "Manual Seeding",
      description: "Drag and drop teams to set seed positions",
      icon: ArrowUpDown,
    },
    {
      id: "random" as SeedingMethod,
      label: "Random Draw",
      description: "Randomly assign seed positions",
      icon: Shuffle,
    },
    {
      id: "ranking" as SeedingMethod,
      label: "By Ranking",
      description: "Seed based on team rankings or previous performance",
      icon: List,
    },
  ];

  // Load approved teams
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/admin/teams/approved?tournamentId=${tournamentId}`);
        // const data = await response.json();

        // Mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockTeams: Team[] = [
          {
            id: "1",
            name: "Thunder Bolts",
            players: 12,
            contactEmail: "thunder@example.com",
            registrationDate: "2024-01-15",
          },
          {
            id: "2",
            name: "Lightning Strike",
            players: 11,
            contactEmail: "lightning@example.com",
            registrationDate: "2024-01-16",
          },
          {
            id: "3",
            name: "Storm Chasers",
            players: 13,
            contactEmail: "storm@example.com",
            registrationDate: "2024-01-17",
          },
          {
            id: "4",
            name: "Wind Runners",
            players: 10,
            contactEmail: "wind@example.com",
            registrationDate: "2024-01-18",
          },
          {
            id: "5",
            name: "Sky Warriors",
            players: 12,
            contactEmail: "sky@example.com",
            registrationDate: "2024-01-19",
          },
          {
            id: "6",
            name: "Cloud Nine",
            players: 11,
            contactEmail: "cloud@example.com",
            registrationDate: "2024-01-20",
          },
          {
            id: "7",
            name: "Hurricane Force",
            players: 14,
            contactEmail: "hurricane@example.com",
            registrationDate: "2024-01-21",
          },
          {
            id: "8",
            name: "Tornado Twist",
            players: 12,
            contactEmail: "tornado@example.com",
            registrationDate: "2024-01-22",
          },
        ];

        setTeams(mockTeams);
        setSeededTeams(
          mockTeams.map((team, index) => ({ ...team, seedPosition: index + 1 }))
        );
      } catch (err) {
        setError("Failed to load teams. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (tournamentId) {
      fetchTeams();
    }
  }, [tournamentId]);

  const handleRandomSeeding = () => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    setSeededTeams(
      shuffled.map((team, index) => ({ ...team, seedPosition: index + 1 }))
    );
    setSuccess("Teams randomly seeded!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleManualSeeding = (fromIndex: number, toIndex: number) => {
    const newSeeding = [...seededTeams];
    const [movedTeam] = newSeeding.splice(fromIndex, 1);
    newSeeding.splice(toIndex, 0, movedTeam);
    setSeededTeams(
      newSeeding.map((team, index) => ({ ...team, seedPosition: index + 1 }))
    );
  };

  const moveSeed = (teamId: string, direction: "up" | "down") => {
    const currentIndex = seededTeams.findIndex((t) => t.id === teamId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === seededTeams.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    handleManualSeeding(currentIndex, newIndex);
  };

  const generateMatches = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/admin/scheduling/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          format: selectedFormat,
          teams: seededTeams,
          pools: selectedFormat === "pool-play" ? numberOfPools : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate matches");

      const data = await response.json();
      setGeneratedMatches(data.matches);
      setShowPreview(true);
      setSuccess("Matches generated successfully!");
    } catch (err) {
      // Mock match generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let matches: Match[] = [];

      if (selectedFormat === "bracket") {
        // Generate single elimination bracket
        const rounds = Math.ceil(Math.log2(seededTeams.length));
        let matchId = 1;

        for (let round = 1; round <= rounds; round++) {
          const matchesInRound = Math.pow(2, rounds - round);
          for (let i = 0; i < matchesInRound; i++) {
            matches.push({
              id: `match-${matchId}`,
              round,
              matchNumber: i + 1,
              team1: round === 1 ? seededTeams[i * 2]?.name : undefined,
              team2: round === 1 ? seededTeams[i * 2 + 1]?.name : undefined,
            });
            matchId++;
          }
        }
      } else if (selectedFormat === "round-robin") {
        // Generate round-robin matches
        let matchId = 1;
        for (let i = 0; i < seededTeams.length; i++) {
          for (let j = i + 1; j < seededTeams.length; j++) {
            matches.push({
              id: `match-${matchId}`,
              round: 1,
              matchNumber: matchId,
              team1: seededTeams[i].name,
              team2: seededTeams[j].name,
            });
            matchId++;
          }
        }
      } else if (selectedFormat === "pool-play") {
        // Generate pool play matches
        const poolSize = Math.ceil(seededTeams.length / numberOfPools);
        let matchId = 1;

        for (let pool = 0; pool < numberOfPools; pool++) {
          const poolTeams = seededTeams.slice(
            pool * poolSize,
            (pool + 1) * poolSize
          );

          // Round-robin within pool
          for (let i = 0; i < poolTeams.length; i++) {
            for (let j = i + 1; j < poolTeams.length; j++) {
              matches.push({
                id: `match-${matchId}`,
                round: pool + 1,
                matchNumber: matchId,
                team1: poolTeams[i].name,
                team2: poolTeams[j].name,
              });
              matchId++;
            }
          }
        }
      }

      setGeneratedMatches(matches);
      setShowPreview(true);
      setSuccess("Matches generated successfully!");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSchedule = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/scheduling/save', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     tournamentId,
      //     format: selectedFormat,
      //     matches: generatedMatches,
      //   }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess("Schedule saved successfully! Redirecting...");
      setTimeout(() => {
        router.push(`/admin/scheduling/calendar?tournamentId=${tournamentId}`);
      }, 2000);
    } catch (err) {
      setError("Failed to save schedule. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!tournamentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Tournament ID Missing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please select a tournament to build the schedule.
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
          <p className="text-gray-600 dark:text-gray-300">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tournament Schedule Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Select tournament format, seed teams, and generate matches
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {!showPreview ? (
          <>
            {/* Step 1: Format Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Tournament Format
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formatOptions.map((format) => {
                  const Icon = format.icon;
                  const isDisabled =
                    teams.length < format.minTeams ||
                    teams.length > format.maxTeams;

                  return (
                    <button
                      key={format.id}
                      onClick={() =>
                        !isDisabled && setSelectedFormat(format.id)
                      }
                      disabled={isDisabled}
                      className={`p-5 rounded-lg border-2 text-left transition-all ${
                        selectedFormat === format.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : isDisabled
                          ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Icon
                          className={`w-6 h-6 flex-shrink-0 ${
                            selectedFormat === format.id
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {format.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {format.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                        <p>
                          Teams: {format.minTeams}-{format.maxTeams}
                        </p>
                        <p className="italic">{format.recommendedFor}</p>
                      </div>

                      {isDisabled && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          Need {format.minTeams}-{format.maxTeams} teams
                          (current: {teams.length})
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pool Play Configuration */}
              {selectedFormat === "pool-play" && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Pool Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Number of Pools
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={numberOfPools}
                        onChange={(e) =>
                          setNumberOfPools(parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Teams per Pool (approx)
                      </label>
                      <input
                        type="number"
                        value={Math.ceil(teams.length / numberOfPools)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Seeding Method */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Choose Seeding Method
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {seedingOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSeedingMethod(option.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        seedingMethod === option.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mb-2 ${
                          seedingMethod === option.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {seedingMethod === "random" && (
                <Button onClick={handleRandomSeeding} className="mb-4">
                  <Shuffle className="w-4 h-4" />
                  Randomize Seeds
                </Button>
              )}

              {/* Seeding List */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Team Seeding ({seededTeams.length} teams)
                </h4>
                <div className="space-y-2">
                  {seededTeams.map((team, index) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full font-semibold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {team.players} players
                        </p>
                      </div>
                      {seedingMethod === "manual" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveSeed(team.id, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-5 h-5 rotate-[-90deg] text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => moveSeed(team.id, "down")}
                            disabled={index === seededTeams.length - 1}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-5 h-5 rotate-90 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={generateMatches}
                disabled={isGenerating || seededTeams.length === 0}
                size="lg"
                className="min-w-[200px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Generate Matches
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Match Preview */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Match Schedule Preview
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {generatedMatches.length} matches generated for{" "}
                  {formatOptions.find((f) => f.id === selectedFormat)?.label}
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Setup
              </Button>
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Next Steps:</p>
                <p>
                  After saving, you'll be able to assign times and fields to
                  each match in the calendar view.
                </p>
              </div>
            </div>

            {/* Matches by Round */}
            <div className="space-y-6">
              {Array.from(new Set(generatedMatches.map((m) => m.round))).map(
                (round) => {
                  const roundMatches = generatedMatches.filter(
                    (m) => m.round === round
                  );
                  return (
                    <div key={round}>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {selectedFormat === "bracket"
                          ? `Round ${round} ${
                              round ===
                              Math.max(...generatedMatches.map((m) => m.round))
                                ? "(Finals)"
                                : round ===
                                  Math.max(
                                    ...generatedMatches.map((m) => m.round)
                                  ) -
                                    1
                                ? "(Semi-Finals)"
                                : ""
                            }`
                          : selectedFormat === "pool-play"
                          ? `Pool ${round}`
                          : "All Matches"}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roundMatches.map((match) => (
                          <div
                            key={match.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              Match #{match.matchNumber}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm font-medium text-gray-900 dark:text-white">
                                  {match.team1 || "TBD"}
                                </div>
                              </div>
                              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                vs
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm font-medium text-gray-900 dark:text-white">
                                  {match.team2 || "TBD"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Modify Setup
              </Button>
              <Button
                onClick={saveSchedule}
                disabled={isGenerating}
                size="lg"
                className="min-w-[200px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
