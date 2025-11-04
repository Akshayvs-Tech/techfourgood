"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

type Tournament = {
  id: string;
  name: string;
  start_date: string; // ISO string in DB
  end_date: string;
  status: string;
};

export default function UpcomingTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name, start_date, end_date, status")
        .gte("start_date", today)
        .neq("status", "Complete")
        .order("start_date", { ascending: true });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setTournaments(data || []);
    };
    fetchUpcoming();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Tournaments</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="space-y-4">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={() => router.push(`/public/register/player?tournamentId=${t.id}`)}>
                Register
              </Button>
            </div>
          ))}
          {!loading && !error && tournaments.length === 0 && (
            <p className="text-gray-600">No upcoming tournaments found.</p>
          )}
        </div>
      </div>
    </div>
  );
}



