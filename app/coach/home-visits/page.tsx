'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CoachHomeVisitsList() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (q?: string) => {
    setLoading(true);
    const res = await fetch(`/api/coach/players${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    const j = await res.json();
    setPlayers(j.players || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home Visits</h1>
          <p className="text-sm text-gray-600">Browse all players across programs and tournaments</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Players: {players.length}</span>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-2">
          <input className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Search players by name or email" value={search} onChange={(e)=>setSearch(e.target.value)} />
          <button className="border rounded-md px-4 bg-gray-50 hover:bg-gray-100" onClick={()=>load(search)}>Search</button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i)=> (
            <div key={i} className="animate-pulse bg-white border rounded-xl h-28" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map(p => (
            <Link key={p.id} href={`/coach/home-visits/${p.id}`} className="block bg-white border rounded-xl p-4 hover:shadow transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.full_name}</div>
                  <div className="text-xs text-gray-500">{p.email}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Player</span>
              </div>
              {p.contact_number && <div className="text-sm text-gray-600 mt-2">{p.contact_number}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


