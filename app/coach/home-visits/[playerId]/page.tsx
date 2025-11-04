'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PlayerHomeVisits() {
  const params: any = useParams();
  const playerId = Array.isArray(params?.playerId) ? params.playerId[0] : params?.playerId;
  const [data, setData] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [otherInfo, setOtherInfo] = useState('');
  const [visits, setVisits] = useState<any[]>([]);
  const [visitDate, setVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/coach/players/${playerId}`);
    const j = await res.json();
    setData(j);
    setAddress(j?.extra?.address || '');
    setOtherInfo(j?.extra?.other_info ? JSON.stringify(j.extra.other_info, null, 2) : '');
    const vr = await fetch(`/api/coach/players/${playerId}/visits`);
    const vj = await vr.json();
    setVisits(vj.visits || []);
  };

  useEffect(() => { if (playerId) load(); }, [playerId]);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const saveExtras = async () => {
    setSaving(true);
    try {
      await fetch(`/api/coach/players/${playerId}/extra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ address, otherInfo: safeJson(otherInfo), coachId: null })
      });
    } finally {
      setSaving(false);
      load();
    }
  };

  const addVisit = async () => {
    if (!visitDate) return;
    setSaving(true);
    try {
      await fetch(`/api/coach/players/${playerId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ coachId: null, visitDate, notes })
      });
      setVisitDate('');
      setNotes('');
    } finally {
      setSaving(false);
      load();
    }
  };

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data?.player?.full_name}</h1>
          <p className="text-sm text-gray-600">Player profile and home visit records</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Player Details</h2>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <div>Email: {data?.player?.email}</div>
              <div>Phone: {data?.player?.contact_number || '-'}</div>
              <div>Gender: {data?.player?.gender || '-'}</div>
              <div>DOB: {data?.player?.date_of_birth || '-'}</div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Teams</h2>
            <div className="flex flex-wrap gap-2">
              {(data?.teams || []).length === 0 ? (
                <span className="text-sm text-gray-500">No teams</span>
              ) : (
                (data?.teams || []).map((t:any)=> (
                  <span key={t.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{t.name}</span>
                ))
              )}
            </div>
          </section>

          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Tournaments</h2>
            <ul className="list-disc pl-5 text-sm">
              {(data?.tournaments || []).map((t: any) => (
                <li key={t.id}>{t.name} {(t.start_date || t.end_date) ? `(${t.start_date || ''}${t.end_date ? ' - ' + t.end_date : ''})` : ''}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Home Visit Records</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{visits.length} total</span>
            </div>
            <div className="space-y-2">
              {visits.length === 0 ? <p className="text-sm text-gray-500">No visits yet</p> : visits.map((v:any)=> (
                <div key={v.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{v.visit_date}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{v.coaches?.full_name || 'Coach'}</span>
                  </div>
                  {v.notes && <div className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{v.notes}</div>}
                </div>
              ))}
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-2">
              <input type="date" className="border rounded-md px-2 py-2" value={visitDate} onChange={(e)=>setVisitDate(e.target.value)} />
              <input type="text" className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Notes" value={notes} onChange={(e)=>setNotes(e.target.value)} />
              <button className="border rounded-md px-3 py-2 bg-gray-50 hover:bg-gray-100" onClick={addVisit} disabled={saving}>New Visit</button>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Additional Details</h2>
            <label className="text-sm text-gray-700">Address</label>
            <textarea className="border rounded-md w-full px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200" rows={3} value={address} onChange={(e)=>setAddress(e.target.value)} />
            <label className="text-sm text-gray-700">Other Info (JSON)</label>
            <textarea className="border rounded-md w-full px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200" rows={6} value={otherInfo} onChange={(e)=>setOtherInfo(e.target.value)} />
            <button className="border rounded-md px-3 py-2 bg-blue-600 text-white hover:bg-blue-700" onClick={saveExtras} disabled={saving}>Save</button>
          </section>
        </div>
      </div>
    </div>
  );
}

function safeJson(s: string) {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}


