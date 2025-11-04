"use client";

import { useState, useEffect, Suspense } from "react";
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
import { Loader2, Plus, Trash2, AlertCircle, X } from "lucide-react";

// 1. Define the structure for a Role
interface ProgramRole {
  id: string; // Use a unique ID for React keys
  name: string;
}

// 2. Main Component Logic
function ManageRolesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  const [roles, setRoles] = useState<ProgramRole[]>([
    // Default roles
    { id: "default-1", name: "Coach" },
    { id: "default-2", name: "Player" },
    { id: "default-3", name: "Program Manager" },
  ]);
  const [newRoleName, setNewRoleName] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  
  const [programName, setProgramName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch existing program data (name and roles)
  useEffect(() => {
    if (!programId) {
      setError("No program ID provided. Please go back.");
      setIsLoading(false);
      return;
    }

    const fetchProgramData = async () => {
      setIsLoading(true);
      try {
        // Use the GET route to retrieve program settings
        const response = await fetch(
          `/api/admin/coaching/program?programId=${programId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch program data.");
        }
        const data = await response.json();
        
        setProgramName(data.name);
        if (data.roles && data.roles.length > 0) {
          setRoles(data.roles.map((role: string | { name: string }, index: number) => ({
            id: `role-${index}`,
            name: typeof role === 'string' ? role : role.name,
          })));
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgramData();
  }, [programId]);

  // 4. Handlers for adding/removing roles
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

  // 5. Handle saving all settings
  const handleSaveSettings = async (redirect: boolean = false) => {
    setError(null);
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/admin/coaching/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: programId,
          roles: roles.map(r => r.name),
          scheduleNotes: scheduleNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save settings");
      }
      
      if (redirect) {
        router.push(
          `/admin/coaching-management/training/session-scheduler?programId=${programId}`
        );
      } else {
        alert("Settings saved!");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Render UI
  if (isLoading) {
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

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Card 1: Define Roles */}
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
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

        {/* Card 2: Manage Schedules */}
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
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              onClick={() => handleSaveSettings(true)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save & Next: Schedule Sessions"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. Export with Suspense wrapper
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