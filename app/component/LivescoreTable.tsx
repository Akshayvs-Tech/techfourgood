"use client";
import { useState, useEffect } from "react";

type Match = {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
};

export default function LivescoreTable() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch live scores from API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/liveops'); // Replace with your actual API endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        setMatches(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchMatches, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-10 w-full flex flex-col items-center bg-transparent border-0">
      <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">🏆 Live Scores</h2>

      <div className="w-[90%] max-w-4xl overflow-hidden rounded-2xl shadow-lg bg-white/10 backdrop-blur-md border border-white/20">
        {loading ? (
          <div className="py-10 text-center text-white">
            <p className="text-lg">Loading live scores...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-400">
            <p className="text-lg">Error: {error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-10 text-center text-white">
            <p className="text-lg">No matches available</p>
          </div>
        ) : (
          <table className="min-w-full text-white text-center">
            <thead className="bg-white/20 uppercase text-sm tracking-wider">
              <tr>
                <th className="py-3 px-4">Match</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, index) => (
                <tr key={index} className="border-t border-white/20 hover:bg-white/10 transition">
                  <td className="py-3 px-4">{match.teamA} <span className="p-2 font-bold">v/s</span> {match.teamB}</td>
                  <td className="py-3 px-4 font-bold text-lg">{match.scoreA} - {match.scoreB}</td>
                  <td className="py-3 px-4 italic">{match.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
