"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // ✅ Auto redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/bookmarks");
      }
    };

    checkUser();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/bookmarks`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4">Welcome to Smart Bookmark</h1>

        <p className="text-gray-600 mb-8">
          Save, organize and access your bookmarks securely from anywhere.
        </p>

        <button
          onClick={signIn}
          className="w-full bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg cursor-pointer transition duration-200 shadow"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
