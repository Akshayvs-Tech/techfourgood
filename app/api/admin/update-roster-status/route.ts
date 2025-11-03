import { NextResponse } from "next/server";
import { Pool } from "pg";

// Initialize the database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Define the expected structure of the incoming request body
interface UpdateStatusRequest {
  teamId: string;
  status: "Approved" | "Rejected";
}

// 1. Define the POST handler
export async function POST(request: Request) {
  let client;
  try {
    // 2. Parse the incoming request body
    const body = (await request.json()) as UpdateStatusRequest;
    const { teamId, status } = body;

    // 3. Validate the incoming data
    if (!teamId || !status) {
      return NextResponse.json(
        { message: "Missing teamId or status" },
        { status: 400 }
      );
    }

    if (status !== "Approved" && status !== "Rejected") {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    // 4. Get a client from the pool and run the SQL query
    client = await pool.connect();
    
    const sqlQuery = `
      UPDATE teams 
      SET status = $1 
      WHERE id = $2;
    `;
    
    // We pass the status and teamId as parameters to prevent SQL injection
    await client.query(sqlQuery, [status, teamId]);

    // 5. Send a success response
    return NextResponse.json({
      message: `Team successfully ${status.toLowerCase()}`,
    });

  } catch (error) {
    console.error("Failed to update team status:", error);
    // 6. Send an error response
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // 7. Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
}