"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import BackgroundSlider from "./component/BackgroundSlider";
import LiveScoreTable from "./component/LivescoreTable";

import { Zap, Users, Star } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleUpcomingClick = () => {
    router.push('/public/upcoming');
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handlePublicClick = () => {
    router.push('/public/schedule');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">

      <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
        
        <div className="absolute inset-0 z-0">
          <BackgroundSlider />
        </div>
        
  <div className="absolute inset-0 bg-black/50 z-10" />

  <div className="z-20 p-8 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-shadow-lg">
            Welcome to the Championship
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-gray-200 text-shadow-md max-w-2xl mx-auto">
            Live scores, real-time brackets, and team spirit, all in one place.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              onClick={handlePublicClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-6 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
              View Live Schedule
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleUpcomingClick}
              className="bg-white/90 text-blue-700 hover:bg-white font-bold text-lg py-6 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
              Upcoming Tournaments
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleLoginClick}
              className="bg-white/90 text-blue-700 hover:bg-white font-bold text-lg py-6 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
              Login
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Live Scores
            </h2>
            <p className="text-lg text-gray-400 mt-4">
              Follow the action as it happens.
            </p>
          </div>
          <div className="max-w-6xl mx-auto  rounded-xl shadow-2xl overflow-hidden">
            <LiveScoreTable />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              The All-in-One Tournament Platform
            </h2>
            <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
              From initial setup to the final match, we provide the tools you need to run a successful event.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature Card 1 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center shadow-lg transform transition-transform hover:-translate-y-2">
              <div className="inline-block p-4 bg-blue-100 text-blue-600 rounded-full mb-6">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Live Scoring
              </h3>
              <p className="text-gray-600">
                Officials and volunteers can input scores live from the field, instantly updating leaderboards.
              </p>
            </div>
            
            {/* Feature Card 2 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center shadow-lg transform transition-transform hover:-translate-y-2">
              <div className="inline-block p-4 bg-green-100 text-green-600 rounded-full mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Easy Registration
              </h3>
              <p className="text-gray-600">
                A simple, multi-step public registration form for players and team captains.
              </p>
            </div>
            
            {/* Feature Card 3 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center shadow-lg transform transition-transform hover:-translate-y-2">
              <div className="inline-block p-4 bg-yellow-100 text-yellow-600 rounded-full mb-6">
                <Star size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Spirit Scoring
              </h3>
              <p className="text-gray-600">
                Promote sportsmanship with configurable post-match spirit scoring and leaderboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Admin Call to Action */}
      <section className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold">
            Build Your League, Make New Champions.
          </h2>
          <p className="text-lg text-blue-100 mt-4 max-w-2xl mx-auto">
            Ready to run your best tournament yet? Our admin panel makes setup, scheduling, and live operations simple.
          </p>
          <div className="mt-12">
            <Button
              size="lg"
              onClick={handleUpcomingClick}
              className="bg-white text-blue-700 hover:bg-gray-100 font-bold text-lg py-6 px-10 rounded-full shadow-xl transition-transform transform hover:scale-105"
            >
              Upcoming Tournaments
            </Button>
          </div>
        </div>
      </section>

      {/* Section 5: Footer */}
      <footer className="bg-black text-gray-400 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} TechForGood. All rights reserved.
          </p>
          <nav className="flex gap-6 mt-4 md:mt-0">
            <a href="/public/schedule" className="hover:text-white transition-colors">Schedule</a>
            <a href="/public/leaderboard" className="hover:text-white transition-colors">Leaderboard</a>
            <a href="/login" className="hover:text-white transition-colors">Admin Login</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}