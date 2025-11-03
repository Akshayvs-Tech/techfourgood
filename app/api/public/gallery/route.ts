// Save this file at: app/api/public/gallery/route.ts

import { NextResponse } from "next/server";

// 1. Define the structure for an image (must match the gallery page)
interface GalleryImage {
  id: string;
  url: string; // The URL to the image
  alt: string; // Alt text, maybe the team name or "Photo from Match 5"
}

// 2. Create the GET handler
export async function GET() {
  try {
    // --- MOCK DATA ---
    // In a real app, you would fetch this from your database:
    // const { rows } = await pool.query("SELECT id, url, alt FROM gallery_images");
    // const images: GalleryImage[] = rows;

    // For now, we use a hardcoded list.
    const mockImages: GalleryImage[] = [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1517466787928-c292f3942001?q=80&w=800",
        alt: "Team A warming up on the field",
      },
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1549472300-88d0095f6c44?q=80&w=800",
        alt: "A great catch during the finals",
      },
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800",
        alt: "Players shaking hands after the game",
      },
      {
        id: "4",
        url: "https://images.unsplash.com/photo-1551950475-5246835252b4?q=80&w=800",
        alt: "The crowd cheering from the sidelines",
      },
      {
        id: "5",
        url: "https://images.unsplash.com/photo-1612872087720-bb8f6e210283?q=80&w=800",
        alt: "Action shot from Match 3",
      },
      {
        id: "6",
        url: "https://images.unsplash.com/photo-1521503716946-b6e82a6E80ea?q=80&w=800",
        alt: "Team huddle before the match",
      },
      {
        id: "7",
        url: "https://images.unsplash.com/photo-1574629810360-17b1658c4883?q=80&w=800",
        alt: "Sunset over the fields",
      },
      {
        id: "8",
        url: "https://images.unsplash.com/photo-1515557808269-703b8c62c237?q=80&w=800",
        alt: "Final trophy presentation",
      },
    ];

    // Simulate a short network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3. Return the list as a JSON response
    return NextResponse.json(mockImages);

  } catch (error) {
    console.error("Failed to fetch gallery images:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}