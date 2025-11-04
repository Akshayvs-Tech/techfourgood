"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Check, X, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";

// 1. Data Structures
interface Player {
  id: string;
  name: string;
}

// Based on ISession.ts
interface Session {
  id: string;
  date: string;
  location: string;
  type: string;
}

// Based on IAttendance.ts
type AttendanceStatus = "Present" | "Absent";
interface AttendanceRecord {
  playerId: string;
  status: AttendanceStatus;
}

// 2. Main Component Logic
function ManageAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [roster, setRoster] = useState<Player[]>([]);
  
  // Use a Map for efficient attendance tracking
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch all sessions for this program
  useEffect(() => {
    if (!programId) {
      setError("No program ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/coaching/sessions?programId=${programId}`
        );
        if (!response.ok) throw new Error("Failed to fetch sessions.");
        const data: Session[] = await response.json();
        setSessions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [programId]);

  // 4. Fetch roster and existing attendance when a session is selected
  useEffect(() => {
    if (!selectedSessionId || !programId) {
      setRoster([]);
      setAttendance(new Map());
      return;
    }

    const fetchRosterAndAttendance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- API CALL TO FETCH ROSTER ---
        const rosterRes = await fetch(
          `/api/admin/coaching/roster?programId=${programId}`
        );
        if (!rosterRes.ok) throw new Error("Failed to fetch program roster.");
        const rosterData: Player[] = await rosterRes.json();
        setRoster(rosterData);

        // --- API CALL TO FETCH ATTENDANCE ---
        const attendanceRes = await fetch(
          `/api/admin/coaching/attendance?sessionId=${selectedSessionId}`
        );
        if (!attendanceRes.ok) throw new Error("Failed to fetch attendance records.");
        const attendanceData: AttendanceRecord[] = await attendanceRes.json();
        
        // Convert array to Map for easy lookup
        const attendanceMap = new Map<string, AttendanceStatus>();
        for (const record of attendanceData) {
          attendanceMap.set(record.playerId, record.status);
        }
        setAttendance(attendanceMap);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRosterAndAttendance();
  }, [selectedSessionId, programId]);

  // 5. Handle changing a player's status
  const handleStatusChange = (playerId: string, status: AttendanceStatus) => {
    setAttendance((prev) => new Map(prev).set(playerId, status));
  };

  // 6. Handle saving the attendance sheet
  const handleSaveAttendance = async () => {
    setError(null);
    setIsSaving(true);
    
    // Convert Map back to array for API
    const attendanceData: AttendanceRecord[] = Array.from(attendance.entries()).map(
      ([playerId, status]) => ({
        sessionId: selectedSessionId,
        playerId,
        status,
      })
    );
    
    try {
      // POST to the attendance API
      const response = await fetch("/api/admin/coaching/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          attendanceData: attendanceData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save attendance.");
      
      alert("Attendance saved successfully!");

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };
  
  // 7. Memoize attendance counts for display
  const attendanceCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    attendance.forEach((status) => {
      if (status === "Present") present++;
      if (status === "Absent") absent++;
    });
    return { present, absent, unaccounted: roster.length - present - absent };
  }, [attendance, roster]);


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Attendance</h1>
          <p className="text-lg text-gray-600">
            Select a session to mark player attendance.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Select a Session</CardTitle>
            <Select
              onValueChange={setSelectedSessionId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    {format(new Date(session.date), "PPP p")} - {session.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          
          {/* Attendance List (only shows if a session is selected) */}
          {selectedSessionId && (
            <>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : roster.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No players found on this program's roster.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                      <span className="flex items-center gap-1 text-green-600">
                        <UserCheck className="h-4 w-4" /> Present: {attendanceCounts.present}
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <UserX className="h-4 w-4" /> Absent: {attendanceCounts.absent}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        Unaccounted: {attendanceCounts.unaccounted}
                      </span>
                    </div>
                  
                    {/* Player List */}
                    <ul className="space-y-3">
                      {roster.map((player) => {
                        const status = attendance.get(player.id);
                        return (
                          <li
                            key={player.id}
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                          >
                            <span className="font-medium text-gray-900">{player.name}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(player.id, "Present")}
                                variant={status === "Present" ? "default" : "outline"}
                                className={status === "Present" ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                <Check className="h-4 w-4 mr-2" /> Present
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(player.id, "Absent")}
                                variant={status === "Absent" ? "default" : "outline"}
                                className={status === "Absent" ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                <X className="h-4 w-4 mr-2" /> Absent
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveAttendance}
                  disabled={isSaving || isLoading || roster.length === 0}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Save Attendance"
                  )}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-end mt-8">
           <Button
            onClick={() => router.push(
              `/admin/coaching-management/player-development/skill-assessment?programId=${programId}`
            )}
          >
            Next: Skill Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}

// 8. Export with Suspense wrapper
export default function ManageAttendancePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ManageAttendancePage />
    </Suspense>
  )
}