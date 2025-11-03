"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CameraOff } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/public/gallery");

        if (!response.ok) {
          throw new Error("Could not load the gallery. Please try again later.");
        }

        const data: GalleryImage[] = await response.json();
        setImages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  // 3. Render Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Loading Gallery...</h2>
      </div>
    );
  }

  // 4. Render Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700">An Error Occurred</h2>
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  // 5. Render Main Content (Gallery or Empty State)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tournament Gallery
          </h1>
          <p className="text-lg text-gray-600">
            Moments captured from the field.
          </p>
        </div>

        {/* 6. Render Empty State (if no images) */}
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
            <CameraOff className="w-16 h-16 text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-700">No Photos Yet</h3>
            <p className="text-gray-500 mt-2">
              Check back later! Photos from live games will appear here.
            </p>
          </div>
        ) : (
          /* 7. Render the Image Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg shadow-lg"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Overlay with alt text */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-medium">{image.alt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}