"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

// TypeScript Interfaces
interface PlayerData {
  fullName: string;
  email: string;
  password: string;
  contactNumber: string;
  gender: string;
  dateOfBirth: string;
}

interface RosterPlayer {
  fullName: string;
  email: string;
  contactNumber: string;
  gender: string;
  dateOfBirth: string;
}

interface TeamRosterData {
  teamName: string;
  joinExistingTeam: string;
  rosterPlayers: RosterPlayer[];
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Use default tournament if not provided in URL
  const tournamentId = searchParams.get("tournamentId") || "default-tournament";

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Player data state
  const [playerData, setPlayerData] = useState<PlayerData>({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    gender: "",
    dateOfBirth: "",
  });

  // Team roster data state
  const [teamRosterData, setTeamRosterData] = useState<TeamRosterData>({
    teamName: "",
    joinExistingTeam: "",
    rosterPlayers: [],
  });

  // Additional player form for roster
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState<RosterPlayer>({
    fullName: "",
    email: "",
    contactNumber: "",
    gender: "",
    dateOfBirth: "",
  });

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission confirmation
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Placeholder existing teams
  const existingTeams = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"];

  // Validation for Step 1
  const validatePlayerData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!playerData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!playerData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!playerData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (playerData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!playerData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(playerData.contactNumber.replace(/\D/g, ""))) {
      newErrors.contactNumber = "Contact number must be 10 digits";
    }

    if (!playerData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!playerData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 2
  const validateTeamRoster = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!teamRosterData.teamName.trim() && !teamRosterData.joinExistingTeam) {
      newErrors.team = "Please create a team name or join an existing team";
    }

    const totalPlayers = teamRosterData.rosterPlayers.length;
    if (totalPlayers < 5) {
      newErrors.roster = `Roster must have at least 5 players (currently ${totalPlayers})`;
    } else if (totalPlayers > 10) {
      newErrors.roster = `Roster cannot exceed 10 players (currently ${totalPlayers})`;
    }

    // Validate all roster players have required fields
    teamRosterData.rosterPlayers.forEach((player, index) => {
      if (!player.fullName.trim()) {
        newErrors[`rosterPlayer${index}`] = `Player ${index + 1} is missing full name`;
      }
      if (!player.email.trim()) {
        newErrors[`rosterPlayer${index}`] = `Player ${index + 1} is missing email`;
      }
      if (!player.contactNumber.trim()) {
        newErrors[`rosterPlayer${index}`] = `Player ${index + 1} is missing contact number`;
      }
      if (!player.gender) {
        newErrors[`rosterPlayer${index}`] = `Player ${index + 1} is missing gender`;
      }
      if (!player.dateOfBirth) {
        newErrors[`rosterPlayer${index}`] = `Player ${index + 1} is missing date of birth`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Step 1 submission
  const handlePlayerRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validatePlayerData()) {
      try {
        // Create player account with password
        const response = await fetch("/api/auth/player/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: playerData.fullName,
            email: playerData.email,
            password: playerData.password,
            contactNumber: playerData.contactNumber,
            gender: playerData.gender,
            dateOfBirth: playerData.dateOfBirth,
            tournamentId: tournamentId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to create player account");
        }

        // Log in the player automatically
        const { supabase } = await import("@/lib/supabaseClient");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: playerData.email,
          password: playerData.password,
        });

        if (signInError) {
          console.warn("Auto-login failed:", signInError);
        }

      // Save progress - player is now in the flow for this tournament
      // Add captain as first roster player
      setTeamRosterData({
        ...teamRosterData,
        rosterPlayers: [{
          fullName: playerData.fullName,
          email: playerData.email,
          contactNumber: playerData.contactNumber,
          gender: playerData.gender,
          dateOfBirth: playerData.dateOfBirth,
        }],
      });

        setCurrentStep(2);
        setErrors({});
      } catch (err) {
        console.error("Player registration error:", err);
        setErrors({
          submit: err instanceof Error ? err.message : "Failed to create account. Please try again.",
        });
      }
    }
  };

  // Handle adding additional players to roster
  const handleAddPlayer = () => {
    // Validate new player data
    if (!newPlayer.fullName.trim()) {
      setErrors({ playerForm: "Full name is required" });
      return;
    }
    if (!newPlayer.email.trim()) {
      setErrors({ playerForm: "Email is required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPlayer.email)) {
      setErrors({ playerForm: "Invalid email format" });
      return;
    }
    if (!newPlayer.contactNumber.trim()) {
      setErrors({ playerForm: "Contact number is required" });
      return;
    }
    if (!newPlayer.gender) {
      setErrors({ playerForm: "Gender is required" });
      return;
    }
    if (!newPlayer.dateOfBirth) {
      setErrors({ playerForm: "Date of birth is required" });
      return;
    }

    // Check if email already exists in roster
    const emailExists = teamRosterData.rosterPlayers.some(
      (p) => p.email.toLowerCase() === newPlayer.email.toLowerCase()
    );
    if (emailExists) {
      setErrors({ playerForm: "This email is already in the roster" });
      return;
    }

    if (teamRosterData.rosterPlayers.length < 10) {
      setTeamRosterData({
        ...teamRosterData,
        rosterPlayers: [...teamRosterData.rosterPlayers, { ...newPlayer }],
      });
      // Reset form
      setNewPlayer({
        fullName: "",
        email: "",
        contactNumber: "",
        gender: "",
        dateOfBirth: "",
      });
      setShowPlayerForm(false);
      setErrors({});
    }
  };

  // Handle removing a player from roster
  const handleRemovePlayer = (index: number) => {
    const updatedRoster = teamRosterData.rosterPlayers.filter(
      (_, i) => i !== index
    );
    setTeamRosterData({
      ...teamRosterData,
      rosterPlayers: updatedRoster,
    });
  };

  // Handle Step 2 submission
  const handleRosterSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateTeamRoster()) {
      setIsSubmitted(true); // Show loading state

      try {
        // Save player and team data to database
        console.log("Team Roster Submission Data:", {
          playerData,
          teamRosterData,
          tournamentId,
        });

        // Call API to create/register the team
        const response = await fetch("/api/public/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerData,
            teamRosterData,
            tournamentId, // This is now guaranteed to have a value (default or from URL)
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to register team");
        }

        const result = await response.json();
        const teamId = result.teamId; // Get the created team ID

        // Redirect to player dashboard
        router.push(`/public/player/dashboard`);
      } catch (error) {
        console.error("Registration error:", error);
        setErrors({ submit: "Failed to register team. Please try again." });
        setIsSubmitted(false);
      }
    }
  };

  // Handle team selection change
  const handleTeamSelection = (value: string) => {
    setTeamRosterData({
      ...teamRosterData,
      joinExistingTeam: value,
      teamName: value ? "" : teamRosterData.teamName,
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-green-600"
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
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Registration Complete! 🎉
            </h1>
            <p className="text-green-100">
              Your team registration has been submitted successfully
            </p>
          </div>

          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {teamRosterData.joinExistingTeam || teamRosterData.teamName}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Team Size:</span>
                    <p className="font-semibold text-gray-900">
                      {teamRosterData.rosterPlayers.length} players
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-semibold text-yellow-600">
                      Pending Approval
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-left">
                  <h4 className="font-medium text-blue-900 mb-1">
                    What is Next?
                  </h4>
                  <p className="text-sm text-blue-700">
                    Your registration is now under review by the tournament
                    director. You will receive an email confirmation once your
                    team is approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setIsSubmitted(false);
                  setPlayerData({
                    fullName: "",
                    email: "",
                    password: "",
                    contactNumber: "",
                    gender: "",
                    dateOfBirth: "",
                  });
                  setTeamRosterData({
                    teamName: "",
                    joinExistingTeam: "",
                    rosterPlayers: [],
                  });
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg"
              >
                Register Another Player
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6 rounded-lg font-medium"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join Our Tournament
          </h1>
          <p className="text-xl text-gray-600">
            Complete your registration in just 2 simple steps
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold text-lg transition-all duration-300 ${
                  currentStep === 1
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                    : "bg-green-600 border-green-600 text-white shadow-lg"
                }`}
              >
                {currentStep === 1 ? "1" : "✓"}
              </div>
              <span
                className={`ml-4 font-semibold text-lg ${
                  currentStep === 1 ? "text-blue-600" : "text-green-600"
                }`}
              >
                Player Information
              </span>
            </div>

            <div className="w-24 h-1 mx-6 bg-gray-300 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  currentStep === 2
                    ? "bg-blue-600 w-full"
                    : "bg-transparent w-0"
                }`}
              />
            </div>

            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold text-lg transition-all duration-300 ${
                  currentStep === 2
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                2
              </div>
              <span
                className={`ml-4 font-semibold text-lg transition-all duration-300 ${
                  currentStep === 2 ? "text-blue-600" : "text-gray-500"
                }`}
              >
                Team Registration
              </span>
            </div>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Step {currentStep} of 2
            </span>
          </div>
        </div>

        {/* Step 1: Player Registration */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Player Information
              </h2>
              <p className="text-blue-100 mt-1">
                Tell us about yourself to get started
              </p>
            </div>

            <form onSubmit={handlePlayerRegistration} className="p-8 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={playerData.fullName}
                  onChange={(e) =>
                    setPlayerData({ ...playerData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={playerData.email}
                    onChange={(e) =>
                      setPlayerData({ ...playerData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={playerData.password}
                    onChange={(e) =>
                      setPlayerData({ ...playerData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="Enter your password (min 6 characters)"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <label
                  htmlFor="contactNumber"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="contactNumber"
                    value={playerData.contactNumber}
                    onChange={(e) =>
                      setPlayerData({
                        ...playerData,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {errors.contactNumber && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.contactNumber}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gender */}
                <div className="space-y-2">
                  <label
                    htmlFor="gender"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    value={playerData.gender}
                    onChange={(e) =>
                      setPlayerData({ ...playerData, gender: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-sm text-red-600 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={playerData.dateOfBirth}
                    onChange={(e) =>
                      setPlayerData({
                        ...playerData,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.submit}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Continue to Team Registration
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Team Roster Submission */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Team Registration
              </h2>
              <p className="text-green-100 mt-1">
                Create or join a team and build your roster
              </p>
            </div>

            <form onSubmit={handleRosterSubmission} className="p-8 space-y-8">
              {/* Team Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Team Selection
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Create New Team */}
                  <div className="space-y-2">
                    <label
                      htmlFor="teamName"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Create New Team
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="teamName"
                        value={teamRosterData.teamName}
                        onChange={(e) =>
                          setTeamRosterData({
                            ...teamRosterData,
                            teamName: e.target.value,
                            joinExistingTeam: "",
                          })
                        }
                        disabled={!!teamRosterData.joinExistingTeam}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="Enter your team name"
                      />
                      {teamRosterData.teamName && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg
                            className="h-5 w-5 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Join Existing Team */}
                  <div className="space-y-2">
                    <label
                      htmlFor="existingTeam"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Or Join Existing Team
                    </label>
                    <select
                      id="existingTeam"
                      value={teamRosterData.joinExistingTeam}
                      onChange={(e) => handleTeamSelection(e.target.value)}
                      disabled={!!teamRosterData.teamName}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">Select a team</option>
                      {existingTeams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Choose one option: create a new team or join an existing one
                  </div>
                </div>

                {errors.team && (
                  <p className="text-sm text-red-600 flex items-center justify-center bg-red-50 p-3 rounded-lg">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.team}
                  </p>
                )}
              </div>

              {/* Roster Builder */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Team Roster Builder
                </h3>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium text-blue-900">
                        Roster Requirements
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        teamRosterData.rosterPlayers.length >= 5 &&
                        teamRosterData.rosterPlayers.length <= 10
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {teamRosterData.rosterPlayers.length} / 10 players
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    • Minimum: 5 players required • Maximum: 10 players allowed
                    • You are automatically added as the first team member
                  </p>
                </div>

                {/* Current Roster */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Current Team Members
                  </h4>

                  {teamRosterData.rosterPlayers.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        No team members added yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamRosterData.rosterPlayers.map((player, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <div className="ml-3">
                              <span className="text-gray-900 font-medium block">
                                {player.fullName}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {player.email} • {player.contactNumber}
                              </div>
                            </div>
                            {index === 0 && (
                              <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                You
                              </span>
                            )}
                          </div>
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Player */}
                {teamRosterData.rosterPlayers.length < 10 && (
                  <div className="space-y-4">
                    {!showPlayerForm ? (
                      <button
                        type="button"
                        onClick={() => setShowPlayerForm(true)}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Team Member
                      </button>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Add New Team Member</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlayerForm(false);
                              setNewPlayer({
                                fullName: "",
                                email: "",
                                contactNumber: "",
                                gender: "",
                                dateOfBirth: "",
                              });
                              setErrors({});
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {errors.playerForm && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.playerForm}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Full Name */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={newPlayer.fullName}
                              onChange={(e) => setNewPlayer({ ...newPlayer, fullName: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              placeholder="Enter full name"
                            />
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={newPlayer.email}
                              onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              placeholder="player@example.com"
                            />
                          </div>

                          {/* Contact Number */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={newPlayer.contactNumber}
                              onChange={(e) => setNewPlayer({ ...newPlayer, contactNumber: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>

                          {/* Gender */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={newPlayer.gender}
                              onChange={(e) => setNewPlayer({ ...newPlayer, gender: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          {/* Date of Birth */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={newPlayer.dateOfBirth}
                              onChange={(e) => setNewPlayer({ ...newPlayer, dateOfBirth: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            type="button"
                            onClick={handleAddPlayer}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
                          >
                            Add to Roster
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setShowPlayerForm(false);
                              setNewPlayer({
                                fullName: "",
                                email: "",
                                contactNumber: "",
                                gender: "",
                                dateOfBirth: "",
                              });
                              setErrors({});
                            }}
                            variant="outline"
                            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {errors.roster && (
                  <p className="text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-lg">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.roster}
                  </p>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6 rounded-lg font-medium flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    />
                  </svg>
                  Back to Player Info
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Submit Team Registration
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
