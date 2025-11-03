import { NextRequest, NextResponse } from "next/server";

interface AssignRequest {
  tournamentId: string;
  matches: Array<{
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    fieldId: string;
    duration?: number;
  }>;
}

interface ConflictCheck {
  fieldId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AssignRequest = await request.json();
    const { tournamentId, matches } = body;

    // Validation
    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json(
        { error: "No matches to assign" },
        { status: 400 }
      );
    }

    // Validate all matches have required fields
    const incompleteMatches = matches.filter(
      (m) => !m.scheduledDate || !m.scheduledTime || !m.fieldId
    );

    if (incompleteMatches.length > 0) {
      return NextResponse.json(
        {
          error: "All matches must have date, time, and field assigned",
          incompleteCount: incompleteMatches.length,
        },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const conflicts = checkSchedulingConflicts(matches);

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Scheduling conflicts detected",
          conflicts,
        },
        { status: 409 }
      );
    }

    // TODO: Update matches in database
    // await db.matches.updateMany({
    //   where: {
    //     tournamentId,
    //     id: { in: matches.map(m => m.id) },
    //   },
    //   data: matches.map(match => ({
    //     scheduledDate: new Date(match.scheduledDate),
    //     scheduledTime: match.scheduledTime,
    //     fieldId: match.fieldId,
    //     duration: match.duration || 75,
    //     status: 'scheduled',
    //   })),
    // });

    // TODO: Update tournament status to 'published'
    // await db.tournaments.update({
    //   where: { id: tournamentId },
    //   data: {
    //     status: 'published',
    //     publishedAt: new Date(),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: "Schedule published successfully",
      assignedMatches: matches.length,
      tournamentId,
    });
  } catch (error) {
    console.error("Error assigning matches:", error);
    return NextResponse.json(
      { error: "Failed to save schedule assignments" },
      { status: 500 }
    );
  }
}

function checkSchedulingConflicts(
  matches: AssignRequest["matches"]
): Array<{ matchIds: string[]; reason: string }> {
  const conflicts: Array<{ matchIds: string[]; reason: string }> = [];
  const scheduleMap = new Map<string, string[]>();

  matches.forEach((match) => {
    const key = `${match.fieldId}-${match.scheduledDate}-${match.scheduledTime}`;

    if (!scheduleMap.has(key)) {
      scheduleMap.set(key, []);
    }
    scheduleMap.get(key)!.push(match.id);
  });

  // Check for duplicate bookings
  scheduleMap.forEach((matchIds, key) => {
    if (matchIds.length > 1) {
      const [fieldId, date, time] = key.split("-");
      conflicts.push({
        matchIds,
        reason: `Multiple matches scheduled on ${fieldId} at ${date} ${time}`,
      });
    }
  });

  // TODO: Add more sophisticated conflict checking
  // - Check for overlapping time slots based on match duration
  // - Check field availability windows
  // - Check minimum gap between matches on same field

  return conflicts;
}

// Helper function to parse time and add duration
function addMinutesToTime(time: string, minutes: number): string {
  const [timePart, period] = time.split(" ");
  const [hours, mins] = timePart.split(":").map(Number);

  let hour24 =
    period === "PM" && hours !== 12
      ? hours + 12
      : hours === 12 && period === "AM"
      ? 0
      : hours;

  let totalMinutes = hour24 * 60 + mins + minutes;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;

  const h = newHour % 12 || 12;
  const ampm = newHour < 12 ? "AM" : "PM";

  return `${h}:${newMinute.toString().padStart(2, "0")} ${ampm}`;
}
