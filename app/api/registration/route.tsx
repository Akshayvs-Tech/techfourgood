export async function POST(req: Request) {
	// Minimal placeholder API: echo back the body or return a helpful error
	try {
		const body = await req.json();
		return new Response(JSON.stringify({ received: true, body }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid request";
		return new Response(JSON.stringify({ message: msg }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
