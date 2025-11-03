"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Mail,
  Calendar,
  Users,
  ArrowRight,
  Home,
} from "lucide-react";

export default function RegistrationConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  const teamName = searchParams.get("teamName") || "Your Team";
  const playerCount = searchParams.get("playerCount") || "0";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Registration Successful! 🎉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your team roster has been submitted for review
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* Team Details */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Team Name
                </h3>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {teamName}
                </p>
              </div>
            </div>

            {/* Player Count */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Players Registered
                </h3>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {playerCount} Players
                </p>
              </div>
            </div>

            {/* Email Confirmation */}
            {email && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Confirmation Email Sent To
                  </h3>
                  <p className="text-lg font-medium text-gray-900 dark:text-white break-all">
                    {email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              What Happens Next?
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Our team will review your roster within 24-48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  You will receive an email notification once your roster is
                  approved
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Check your email for tournament updates and schedule
                  information
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Keep your contact information up to date for important
                  announcements
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            size="lg"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            Return to Home
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/public/register/player")}
            className="w-full sm:w-auto"
          >
            Register Another Team
          </Button>
        </div>

        {/* Auto Redirect Notice */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You will be automatically redirected to the home page in{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {countdown} seconds
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
