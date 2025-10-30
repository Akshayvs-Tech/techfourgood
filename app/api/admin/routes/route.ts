// Simple POST handler for creating a tournament.
// Returns JSON: { tournamentId: string }
// Minimal validation: expects a JSON body. If tournamentId is provided it will be returned,
// otherwise a new id is generated.

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation: require at least a tournamentName or fields so user can't send empty body
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
      return new Response(JSON.stringify({ message: 'Empty request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use provided tournamentId if available, otherwise generate one
    let tournamentId: string;
    try {
      tournamentId =
        body.tournamentId ||
        (typeof globalThis?.crypto?.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : `T-${Date.now()}`);
    } catch (e) {
      tournamentId = `T-${Date.now()}`;
    }

    // Here you'd normally persist the tournament to a database.
    // We return the created ID so the client can redirect to team setup.
    return new Response(JSON.stringify({ tournamentId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // If parsing JSON failed or any other error occurred, return a readable error
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return new Response(JSON.stringify({ message: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
