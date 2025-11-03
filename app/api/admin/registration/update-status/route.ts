import { NextRequest, NextResponse } from "next/server";

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

    console.log(`Updating team ${teamId} status to ${status}`);

    // TODO: Update team status in database
    // const updatedTeam = await db.teams.update({
    //   where: { id: teamId },
    //   data: {
    //     status,
    //     rejectionReason: status === 'rejected' ? rejectionReason : null,
    //     reviewedAt: new Date(),
    //   },
    //   include: {
    //     captain: true,
    //   },
    // });

    // Mock database update
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUpdatedTeam: TeamData = {
      id: teamId,
      teamName: "Thunder Bolts",
      status,
      rejectionReason: status === "rejected" ? rejectionReason! : null,
      reviewedAt: new Date().toISOString(),
      captainEmail: "captain@team.com",
      captainName: "John Smith",
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
