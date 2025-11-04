"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  MapPin,
  Clock,
  List,
} from "lucide-react";
import { format } from "date-fns";

// 1. Define the Session data structure
interface Session {
  id: number;
  programId: number;
  date: string;
  location: string;
  type: string;
}

// 2. Define the structure for the new session form
interface NewSessionForm {
  date: Date | undefined;
  time: string;
  location: string;
  type: string;
}

// 3. Main Component Logic
function SessionSchedulerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  const [existingSessions, setExistingSessions] = useState<Session[]>([]);
  const [formData, setFormData] = useState<NewSessionForm>({
    date: undefined,
    time: "09:00",
    location: "",
    type: "Training",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 4. Function to fetch existing sessions
  const fetchSessions = async () => {
    if (!programId) {
      setError("No program ID provided.");
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch existing sessions
      const response = await fetch(
        `/api/admin/coaching/sessions?programId=${programId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sessions.");
      }
      const data: Session[] = await response.json();
      setExistingSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Fetch sessions on page load
  useEffect(() => {
    fetchSessions();
  }, [programId]);

  // 6. Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 7. Handle new session submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.date || !formData.location || !formData.type || !formData.time) {
      setError("Please fill out all fields.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Combine date and time
    const [hours, minutes] = formData.time.split(':');
    const sessionDateTime = new Date(formData.date);
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes));

    try {
      // POST new session data
      const response = await fetch("/api/admin/coaching/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: programId,
          date: sessionDateTime.toISOString(),
          location: formData.location,
          type: formData.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session.");
      }

      // Reset form and refetch sessions to show the new one
      setFormData({
        date: undefined,
        time: "09:00",
        location: "",
        type: "Training",
      });
      fetchSessions(); // Refetch to update the list

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Handle deleting a session
  const handleDelete = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      // We need a DELETE method, let's add it to our API
      const response = await fetch("/api/admin/coaching/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete session.");
      }
      
      // Refetch sessions to update the list
      fetchSessions();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Session Scheduler</h1>
          <p className="text-lg text-gray-600">
            Create and manage training sessions for your program.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Create New Session Form */}
          <div className="md:col-span-1">
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Schedule New Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? (
                            format(formData.date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(d) => setFormData((p) => ({ ...p, date: d }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Main Field"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Session Type</Label>
                    <Input
                      id="type"
                      name="type"
                      placeholder="e.g., Training, Match, Fitness"
                      value={formData.type}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Session
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Column 2: Existing Sessions List */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Sessions</CardTitle>
                <CardDescription>
                  List of all upcoming and past sessions for this program.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : existingSessions.length === 0 ? (
                  <p className="text-center text-gray-500">No sessions scheduled yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {existingSessions.map((session) => (
                      <li
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-lg text-gray-900">
                            {format(new Date(session.date), "PPP p")}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <List className="h-4 w-4" />
                              {session.type}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => router.push(
                  `/admin/coaching-management/training/manage-attendance?programId=${programId}`
                )}>
                  Next: Manage Attendance
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// 9. Export with Suspense wrapper
export default function SessionSchedulerPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SessionSchedulerPage />
    </Suspense>
  )
}