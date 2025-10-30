// Minimal POST handler for saving registration form configuration.
// Returns JSON to the client so response.json() succeeds.

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return new Response(JSON.stringify({ message: 'Empty request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { tournamentId, fields } = body as { tournamentId?: string; fields?: any };
    if (!tournamentId) {
      return new Response(JSON.stringify({ message: 'tournamentId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic validation for fields shape
    if (!Array.isArray(fields)) {
      return new Response(JSON.stringify({ message: 'fields must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: persist the form config to a database. For now, echo success.
    return new Response(JSON.stringify({ tournamentId, saved: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return new Response(JSON.stringify({ message: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
