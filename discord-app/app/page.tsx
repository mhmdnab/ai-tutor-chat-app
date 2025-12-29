"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { matrixClient } from "@/lib/matrix-client";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    homeserver: "https://matrix.org",
    username: "",
    password: "",
  });

  useEffect(() => {
    // Apply saved theme on page load
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'auto' | null;
    const theme = savedTheme || 'dark';

    document.documentElement.classList.remove('dark', 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      // Auto mode - use system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.add('light');
      }
    }

    // Check if already logged in
    const savedToken = localStorage.getItem("matrix_access_token");
    const savedUserId = localStorage.getItem("matrix_user_id");
    const savedHomeserver = localStorage.getItem("matrix_homeserver");

    if (savedToken && savedUserId && savedHomeserver) {
      router.push("/chat");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await matrixClient.login(
        formData.homeserver,
        formData.username,
        formData.password
      );

      // Save credentials
      localStorage.setItem("matrix_access_token", response.accessToken);
      localStorage.setItem("matrix_user_id", response.userId);
      localStorage.setItem("matrix_homeserver", formData.homeserver);

      router.push("/chat");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-gray-400">Login to your Matrix account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="homeserver"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Homeserver
            </label>
            <input
              id="homeserver"
              type="text"
              value={formData.homeserver}
              onChange={(e) =>
                setFormData({ ...formData, homeserver: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://matrix.org"
              required
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your-username"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>
            Don&apos;t have an account?{" "}
            <a
              href="https://app.element.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Create one on Element
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
