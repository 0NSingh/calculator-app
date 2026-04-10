"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userApi } from "../../../../lib/api";

interface User {
  id: number;
  email: string;
  username: string | null;
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const userData = await userApi.getMe();
      setUser(userData);
      setEmail(userData.email);
      setUsername(userData.username || "");
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      router.push("/user/signin");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    setMessage({ type: "", text: "" });
    
    try {
      const updateData: { email: string; username: string; password?: string } = { email, username };
      if (password) updateData.password = password;
      
      const updatedUser = await userApi.updateProfile(String(user.id), updateData);
      setUser(updatedUser);
      setPassword("");
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/user/signin");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#ff9f0a]">Loading...</div>;
  }

  const displayName = username || email?.split("@")[0] || "User";
  const initial = displayName[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">User Profile</h1>
          <Link 
            href="/"
            className="text-[#ff9f0a] hover:underline flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Back to Calculator
          </Link>
        </div>

        <div className="bg-[#1c1c1c] rounded-2xl p-8 border border-[#333] space-y-8">
          <div className="flex items-center gap-6 pb-8 border-b border-[#333]">
            <div className="w-24 h-24 rounded-full bg-[#ff9f0a] flex items-center justify-center text-4xl font-bold">
              {initial}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{displayName}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-auto bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
            >
              Logout
            </button>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {message.text && (
              <div className={`px-4 py-3 rounded-xl text-sm text-center border ${
                message.type === "success" 
                  ? "bg-green-500/10 border-green-500/20 text-green-500" 
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}>
                {message.text}
              </div>
            )}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Account Settings</h3>
              
              <div className="space-y-2">
                <label className="text-xs text-gray-500 ml-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#2c2c2c] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff9f0a] transition-colors"
                  placeholder="YourUsername"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#2c2c2c] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff9f0a] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 ml-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#2c2c2c] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff9f0a] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-[#ff9f0a] hover:bg-[#ffb447] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </section>

            <section className="pt-8 border-t border-[#333]">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Danger Zone</h3>
              <button 
                type="button"
                className="w-full text-left p-4 bg-[#2c2c2c] rounded-lg border border-red-900/30 text-red-500 hover:bg-red-900/10 transition-colors flex items-center justify-between"
              >
                <span>Delete Account</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
