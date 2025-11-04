import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

interface UpdateStatusRequest {
  teamId: string;
  status: "approved" | "rejected";
  rejectionReason?: string;
}

interface TeamData {
  id: string;
  teamName: string;
  status: string;
  rejectionReason: string | null;
  reviewedAt: string;
  captainEmail: string;
  captainName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateStatusRequest = await request.json();
    const { teamId, status, rejectionReason } = body;

    // Validation
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting a team" },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();
    
    // Get team info first to find tournament_id
    const { data: teamInfo } = await db
      .from("teams")
      .select("id, name, tournament_id, captain_email, captain_name")
      .eq("id", teamId)
      .single();

    if (!teamInfo) {
      throw new Error("Team not found");
    }

    // Update team status
    const { data: teamRow, error: teamErr } = await db
      .from("teams")
      .update({
        status,
        rejection_reason: status === "rejected" ? rejectionReason || null : null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", teamId)
      .select("id,name,captain_email,captain_name")
      .maybeSingle();
    
    if (teamErr || !teamRow) {
      throw teamErr || new Error("Failed to update team");
    }

    // Update team_rosters status to match team status
    // Map team status (approved/rejected) to roster status (Approved/Rejected)
    const rosterStatus = status === "approved" ? "Approved" : "Rejected";
    
    const { error: rosterErr } = await db
      .from("team_rosters")
      .update({
        status: rosterStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("tournament_id", teamInfo.tournament_id);

    if (rosterErr) {
      console.warn("Failed to update team_rosters status:", rosterErr);
      // Don't fail the whole operation if roster update fails
    }

    const mockUpdatedTeam: TeamData = {
      id: teamRow.id,
      teamName: teamRow.name,
      status,
      rejectionReason: status === "rejected" ? rejectionReason! : null,
      reviewedAt: new Date().toISOString(),
      captainEmail: teamRow.captain_email || "",
      captainName: teamRow.captain_name || "",
    };

    // Send email notification to team captain
    if (status === "approved") {
      await sendApprovalEmail(mockUpdatedTeam);
    } else if (status === "rejected") {
      await sendRejectionEmail(mockUpdatedTeam, rejectionReason!);
    }

    return NextResponse.json({
      success: true,
      message: `Team ${
        status === "approved" ? "approved" : "rejected"
      } successfully`,
      team: mockUpdatedTeam,
    });
  } catch (error) {
    console.error("Error updating team status:", error);
    return NextResponse.json(
      {
        error: "Failed to update team status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Send approval email notification
async function sendApprovalEmail(team: TeamData) {
  console.log("=================================");
  console.log("📧 APPROVAL EMAIL NOTIFICATION");
  console.log("=================================");
  console.log(`To: ${team.captainEmail}`);
  console.log(`Subject: Team Approved - ${team.teamName}`);
  console.log("");
  console.log(`Dear ${team.captainName},`);
  console.log("");
  console.log(
    `Congratulations! Your team "${team.teamName}" has been approved for the tournament.`
  );
  console.log("");
  console.log("What's Next:");
  console.log(
    "1. You will receive the tournament schedule once it's published"
  );
  console.log("2. Check your email for additional tournament information");
  console.log("3. Make sure all team members are prepared for the event");
  console.log("");
  console.log("We look forward to seeing your team compete!");
  console.log("");
  console.log("Best regards,");
  console.log("Tournament Organizing Committee");
  console.log("=================================");

  // TODO: Implement actual email sending
  // await emailService.send({
  //   to: team.captainEmail,
  //   subject: `Team Approved - ${team.teamName}`,
  //   template: 'team-approved',
  //   data: {
  //     captainName: team.captainName,
  //     teamName: team.teamName,
  //     tournamentName: 'Tournament Name',
  //   },
  // });
}

// Send rejection email notification
async function sendRejectionEmail(team: TeamData, reason: string) {
  console.log("=================================");
  console.log("📧 REJECTION EMAIL NOTIFICATION");
  console.log("=================================");
  console.log(`To: ${team.captainEmail}`);
  console.log(`Subject: Team Registration Update - ${team.teamName}`);
  console.log("");
  console.log(`Dear ${team.captainName},`);
  console.log("");
  console.log(
    `Thank you for your interest in registering "${team.teamName}" for the tournament.`
  );
  console.log("");
  console.log(
    "Unfortunately, we are unable to approve your team registration at this time."
  );
  console.log("");
  console.log("Reason:");
  console.log(`${reason}`);
  console.log("");
  console.log(
    "If you have any questions or would like to address the issue, please contact us."
  );
  console.log("");
  console.log("Best regards,");
  console.log("Tournament Organizing Committee");
  console.log("=================================");

  // TODO: Implement actual email sending
  // await emailService.send({
  //   to: team.captainEmail,
  //   subject: `Team Registration Update - ${team.teamName}`,
  //   template: 'team-rejected',
  //   data: {
  //     captainName: team.captainName,
  //     teamName: team.teamName,
  //     rejectionReason: reason,
  //   },
  // });
}
