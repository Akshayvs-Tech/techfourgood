"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.session) {
        setError(authError?.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Check if user is an admin
      const { data: adminData } = await supabase
        .from("admins")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (adminData) {
        // Redirect to admin dashboard
        router.push("/admin/dashboard");
        return;
      }

      // Check if user is a player
      const { data: playerData } = await supabase
        .from("players")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (playerData) {
        // Redirect to player dashboard
        router.push("/public/player/dashboard");
        return;
      }

      // Check if user is a coach (for future use)
      const { data: coachData } = await supabase
        .from("coaches")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (coachData) {
        // For now, redirect to a placeholder or show message
        // TODO: Implement coach dashboard
        setError("Coach login is not yet available. Please contact an administrator.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // User exists in auth but not in any role table
      setError("Your account is not associated with any role. Please contact support.");
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login</h1>
        <p className="text-sm text-gray-600 mb-6">
          Login as Admin or Player. Your account type will be determined automatically.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Login"}
          </Button>
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a
                href="/public/upcoming"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Register for a tournament
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}



