import { NextResponse } from "next/server";
import { Pool } from "pg";

// 1. Initialize the database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 2. Define the POST handler (to create a new program)
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    // 3. Parse the request body
    const body = await request.json();
    const { name, startDate, isActive } = body;

    // 4. Validate the incoming data
    if (!name || !startDate) {
      return NextResponse.json(
        { message: "Missing required fields: name and startDate" },
        { status: 400 }
      );
    }

    // 5. Start a transaction
    await client.query("BEGIN");

    // 6. Execute the SQL query to insert the new program
    const sqlQuery = `
      INSERT INTO programs (name, start_date, is_active)
      VALUES ($1, $2, $3)
      RETURNING id, name, start_date, is_active; 
    `;
    
    const result = await client.query(sqlQuery, [
      name,
      startDate,
      isActive ?? true,
    ]);
    
    const newProgram = result.rows[0];

    // 7. Commit the transaction
    await client.query("COMMIT");

    // 8. Return the newly created program
    return NextResponse.json(newProgram, { status: 201 });

  } catch (error) {
    // 9. If an error occurs, roll back the transaction
    await client.query("ROLLBACK");
    
    console.error("Failed to create coaching program:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // 10. Always release the client back to the pool
    client.release();
  }
}

// TODO: Add a GET handler to retrieve programs
// export async function GET(request: Request) { ... }