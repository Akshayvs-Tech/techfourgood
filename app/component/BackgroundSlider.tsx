"use client";
import { useState, useEffect } from "react";

const images = [
    "/image/bg1.jpg",
    "/image/bg2.jpg",
    "/image/bg3.jpg",
    "/image/bg4.jpg",
];

export default function BackgroundSlider() {
  const [currentImage, setCurrentImage] = useState(0);

  // Change image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // 5000ms = 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative h-[600px] w-full max-w-6xl overflow-hidden rounded-lg">
        {images.map((img, index) => (
        <div
          key={index}
          className={`absolute top-0 left-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}

      {/* Optional: Content inside the background */}
      <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold">
        Welcome to ArenaX
      </div>
      </div>
    </div>
  );
}