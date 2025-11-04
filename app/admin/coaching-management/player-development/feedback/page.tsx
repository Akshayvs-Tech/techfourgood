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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, MessageSquare, User, Calendar } from "lucide-react";
import { format } from "date-fns";

// 1. Data Structures
interface Player {
  id: string;
  name: string;
}

// Full assessment record including session details
interface PlayerFeedback {
  sessionId: string;
  sessionDate: string;
  sessionLocation: string;
  comments: string;
  skill1Score: number;
  skill2Score: number;
  skill3Score: number;
  skill4Score: number;
  skill5Score: number;
}

// 2. Main Component Logic
function FeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  // State
  const [roster, setRoster] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [feedbackHistory, setFeedbackHistory] = useState<PlayerFeedback[]>([]);

  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch Roster on load
  useEffect(() => {
    if (!programId) {
      setError("No program ID provided.");
      setIsLoadingRoster(false);
      return;
    }

    const fetchRoster = async () => {
      setIsLoadingRoster(true);
      try {
        // This API exists and works
        const rosterRes = await fetch(
          `/api/admin/coaching/roster?programId=${programId}`
        );
        if (!rosterRes.ok) throw new Error("Failed to fetch program roster.");
        setRoster(await rosterRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoadingRoster(false);
      }
    };
    fetchRoster();
  }, [programId]);

  // 4. Fetch feedback history when a player is selected
  useEffect(() => {
    if (!selectedPlayerId) {
      setFeedbackHistory([]);
      return;
    }

    const fetchFeedback = async () => {
      setIsLoadingFeedback(true);
      setError(null);
      try {
        // --- THIS API NEEDS TO BE UPDATED ---
        const response = await fetch(
          `/api/admin/coaching/assessment?playerId=${selectedPlayerId}`
        );
        if (response.ok) {
          const data = await response.json();
          setFeedbackHistory(data);
        } else {
          setFeedbackHistory([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch feedback");
      } finally {
        setIsLoadingFeedback(false);
      }
    };
    fetchFeedback();
  }, [selectedPlayerId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Player Feedback History</h1>
          <p className="text-lg text-gray-600">
            Select a player to see all historical feedback and comments.
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
            <CardTitle>Select Player</CardTitle>
            <Select
              onValueChange={setSelectedPlayerId}
              disabled={isLoadingRoster}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a player from the roster..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingRoster ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  roster.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardHeader>
          
          {selectedPlayerId && (
            <CardContent>
              {isLoadingFeedback ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : feedbackHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No Feedback Found</h3>
                  <p>This player does not have any saved assessment comments yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {feedbackHistory.map((fb) => (
                    <div key={fb.sessionId} className="p-5 border bg-white rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center gap-2 font-semibold text-gray-800">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {format(new Date(fb.sessionDate), "PPP")}
                        </span>
                        <span className="text-sm text-gray-600">{fb.sessionLocation}</span>
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-md border">
                        {fb.comments || "No comments written for this session."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-end mt-8">
           <Button
            onClick={() => router.push(
              `/admin/coaching-management/analytics/performance-dashboard?programId=${programId}`
            )}
          >
            Next: Performance Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// 5. Export with Suspense wrapper
export default function FeedbackPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <FeedbackPage />
    </Suspense>
  )
}