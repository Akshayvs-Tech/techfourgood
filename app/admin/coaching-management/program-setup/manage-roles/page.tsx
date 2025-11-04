"use client";

import { useState, useEffect, Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  X,
  UserSearch,
  UserPlus,
  UserX,
} from "lucide-react";

// 1. Define Data Structures
interface ProgramRole {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  affiliations?: { teamName: string; tournamentName: string }[];
}

// 2. Main Component Logic
function ManageRolesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  // State for Roles & Schedules
  const [roles, setRoles] = useState<ProgramRole[]>([
    { id: "default-1", name: "Coach" },
    { id: "default-2", name: "Player" },
    { id: "default-3", name: "Program Manager" },
  ]);
  const [newRoleName, setNewRoleName] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  // State for Roster Management
  const [roster, setRoster] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<Record<string, boolean>>({});

  // General Page State
  const [programName, setProgramName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Coach Assignment (Program-level)
  const [coaches, setCoaches] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedCoachIds, setSelectedCoachIds] = useState<Record<string, boolean>>({});

  // 3. Main Data Fetch (Program Details + Roster)
  const fetchProgramData = async () => {
    if (!programId) {
      setError("No program ID provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch program details (roles, notes, etc.)
      const programRes = await fetch(
        `/api/admin/coaching/program?programId=${programId}`
      );
      if (!programRes.ok) throw new Error("Failed to fetch program data.");
      const programData = await programRes.json();

      setProgramName(programData.name);
      if (programData.roles && programData.roles.length > 0) {
        setRoles(
          programData.roles.map((r: string, i: number) => ({
            id: `role-${i}`,
            name: r,
          }))
        );
      }
      setScheduleNotes(programData.scheduleNotes || "");

      // Fetch program roster
      // --- THIS API (roster) DOES NOT EXIST YET ---
      const rosterRes = await fetch(
        `/api/admin/coaching/roster?programId=${programId}`
      );
      if (!rosterRes.ok) throw new Error("Failed to fetch program roster.");
      const rosterData: Player[] = await rosterRes.json();
      setRoster(rosterData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Run the main fetch on load
  useEffect(() => {
    fetchProgramData();
  }, [programId]);

  // Load coaches (global) for assignment
  useEffect(() => {
    const load = async () => {
      try {
        const cRes = await fetch(`/api/admin/coaches`);
        if (cRes.ok) {
          const j = await cRes.json();
          setCoaches(j.coaches || []);
        }
      } catch (e) {
        // non-fatal
      }
    };
    load();
  }, [programId]);

  // 4. Handlers for Roles
  const handleAddRole = () => {
    if (newRoleName.trim() === "") return;
    setRoles((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: newRoleName.trim() },
    ]);
    setNewRoleName("");
  };

  const handleRemoveRole = (id: string) => {
    setRoles((prev) => prev.filter((role) => role.id !== id));
  };

  // 5. Handlers for Roster
  
  // Search for players
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    startSearchTransition(async () => {
      try {
        const response = await fetch(`/api/admin/coaching/players?search=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data: Player[] = await response.json();
          // Filter out players already on the roster
          setSearchResults(data.filter((p) => !roster.some((r) => r.id === p.id)));
        }
      } catch (err) {
        console.error("Failed to search players:", err);
      }
    });
  }, [searchQuery, roster]);

  // Add a player to the roster
  const handleAddPlayer = async (player: Player) => {
    setRosterError(null);
    try {
      const response = await fetch("/api/admin/coaching/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, playerId: player.id, action: "add" }),
      });
      if (!response.ok) throw new Error("Failed to add player.");

      setRoster((prev) => [...prev, player]);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setRosterError(
        err instanceof Error ? err.message : "An error occurred"
      );
    }
  };

  // Add multiple selected players to roster
  const handleAddSelected = async () => {
    const toAdd = searchResults.filter((p) => selectedToAdd[p.id]);
    if (toAdd.length === 0) return;
    setRosterError(null);
    try {
      for (const player of toAdd) {
        const res = await fetch("/api/admin/coaching/roster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId, playerId: player.id, action: "add" }),
        });
        if (!res.ok) throw new Error("Failed to add some players");
      }
      setRoster((prev) => [...prev, ...toAdd]);
      setSelectedToAdd({});
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setRosterError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Remove a player from the roster
  const handleRemovePlayer = async (playerId: string) => {
    setRosterError(null);
    try {
      // --- THIS API (roster) DOES NOT EXIST YET ---
      const response = await fetch("/api/admin/coaching/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, playerId, action: "remove" }),
      });
      if (!response.ok) throw new Error("Failed to remove player.");

      setRoster((prev) => prev.filter((p) => p.id !== playerId));
    } catch (err) {
      setRosterError(
        err instanceof Error ? err.message : "An error occurred"
      );
    }
  };

  // 6. Handle saving general settings (Roles & Schedules)
  const handleSaveSettings = async (redirect: boolean = false) => {
    setError(null);
    setIsSaving(true);
    try {
      // This POSTs to the API route we already updated
      const response = await fetch("/api/admin/coaching/program", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: programId,
          roles: roles.map((r) => r.name), // Send just an array of names
          scheduleNotes: scheduleNotes,
        }),
      });
      
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || "Failed to save settings");
      }

      if (redirect) {
        // Redirect to the next step: Session Scheduler
        router.push(
          `/admin/coaching-management/training/session-scheduler?programId=${programId}`
        );
      } else {
        alert("Settings saved!");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Render UI
  if (isLoading && !programName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Program Setup</h1>
          <p className="text-lg text-blue-700 font-medium">{programName}</p>
        </div>

        {/* General Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* --- Card 1: Define Roles --- */}
        <Card>
          <CardHeader>
            <CardTitle>Define Program Roles</CardTitle>
            <CardDescription>
              Create roles for this program, e.g., "Coach", "Player", "Parent".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter new role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
              />
              <Button onClick={handleAddRole}>
                <Plus className="h-4 w-4 mr-2" /> Add Role
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Current Roles:</Label>
              <div className="flex flex-wrap gap-2">
                {roles.length === 0 ? (
                  <p className="text-sm text-gray-500">No roles defined yet.</p>
                ) : (
                  roles.map((role) => (
                    <span
                      key={role.id}
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                    >
                      {role.name}
                      <button
                        onClick={() => handleRemoveRole(role.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title={`Remove ${role.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Card 2: Manage Schedules --- */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Program Manager Schedules</CardTitle>
            <CardDescription>
              Define schedules or add notes for program managers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="scheduleNotes">Schedule / Calendar Notes</Label>
            <Textarea
              id="scheduleNotes"
              placeholder="e.g., 'Weekly meetings every Monday at 10 AM', 'Full calendar available at link...'"
              rows={5}
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* --- Card 3: NEW Roster Management --- */}
        <Card>
          <CardHeader>
            <CardTitle>Create Team Roster</CardTitle>
            <CardDescription>
              Add players to this coaching program.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rosterError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {rosterError}
              </div>
            )}
            
            {/* Search Box */}
            <div>
              <Label htmlFor="playerSearch">Search for Players to Add</Label>
              <div className="relative">
                <Input
                  id="playerSearch"
                  placeholder="Type a player's name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <UserSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {/* Search Results */}
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {isSearching && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
                {searchResults.map((player) => {
                  const firstAff = player.affiliations && player.affiliations[0];
                  const extraCount = (player.affiliations?.length || 0) - 1;
                  return (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!selectedToAdd[player.id]}
                          onChange={(e) => setSelectedToAdd((m) => ({ ...m, [player.id]: e.target.checked }))}
                        />
                        <div>
                          <div className="font-medium">{player.name}</div>
                          {firstAff && (
                            <div className="text-xs text-gray-600">
                              {firstAff.teamName || "Team"} • {firstAff.tournamentName || "Tournament"}
                              {extraCount > 0 && ` (+${extraCount} more)`}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleAddPlayer(player)}>
                        <UserPlus className="h-4 w-4 mr-2" /> Add
                      </Button>
                    </div>
                  );
                })}
                {searchResults.length > 0 && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddSelected}>
                      <UserPlus className="h-4 w-4 mr-2" /> Add Selected
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Current Roster */}
            <div>
              <Label>Current Program Roster ({roster.length} Players)</Label>
              <div className="mt-2 space-y-2 p-3 border rounded-md bg-gray-50 max-h-72 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : roster.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No players have been added to this roster yet.
                  </p>
                ) : (
                  roster.map((player) => (
                    <div key={player.id} className="flex justify-between items-center p-3 bg-white shadow-sm rounded border">
                      <span className="font-medium">{player.name}</span>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleRemovePlayer(player.id)}>
                        <UserX className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Card 4: Assign Coaches to Program --- */}
        <Card>
          <CardHeader>
            <CardTitle>Assign Coaches</CardTitle>
            <CardDescription>
              Assign one or more coaches to this program. Assigned coaches will see all sessions under this program in their dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <Label>Coaches</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                  {coaches.length === 0 ? (
                    <p className="text-sm text-gray-500">No coaches yet.</p>
                  ) : (
                    coaches.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={!!selectedCoachIds[c.id]}
                          onChange={(e) => setSelectedCoachIds((m) => ({ ...m, [c.id]: e.target.checked }))}
                        />
                        <span className="font-medium">{c.full_name}</span>
                        <span className="text-xs text-gray-500">{c.email}</span>
                      </label>
                    ))
                  )}
                </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  setError(null);
                  const coachIds = Object.keys(selectedCoachIds).filter((k) => selectedCoachIds[k]);
                  try {
                    const res = await fetch("/api/admin/coaching/program/assign-coaches", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ programId, coachIds }),
                    });
                    if (!res.ok) throw new Error("Failed to assign coaches");
                    alert("Coaches assigned successfully");
                  } catch (e: any) {
                    setError(e?.message || "Failed to assign coaches");
                  }
                }}
              >
                Save Coach Assignments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Back
          </Button>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => handleSaveSettings(false)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Settings"}
            </Button>
            <Button
              onClick={() => handleSaveSettings(true)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next: Schedule Sessions"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. Export with Suspense wrapper
export default function ManageRolesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ManageRolesPage />
    </Suspense>
  )
}