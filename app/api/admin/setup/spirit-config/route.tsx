import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const configData = await request.json();

    
    if (!configData.categories || configData.categories.length !== 5) {
      return NextResponse.json(
        { message: "Exactly 5 categories are required" },
        { status: 400 }
      );
    }

   
    const hasEmptyCategory = configData.categories.some(
      (cat: string) => !cat || cat.trim() === ""
    );
    if (hasEmptyCategory) {
      return NextResponse.json(
        { message: "All category names must be filled" },
        { status: 400 }
      );
    }

   
    if (
      !configData.submissionWindowHours ||
      configData.submissionWindowHours < 1
    ) {
      return NextResponse.json(
        { message: "Valid submission window is required" },
        { status: 400 }
      );
    }

    // // TODO: Save to database
    // console.log("Spirit Score Configuration saved:", configData);

    return NextResponse.json(
      {
        message: "Spirit score configuration saved successfully",
        config: configData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving spirit score configuration:", error);
    return NextResponse.json(
      { message: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
