"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function BookmarksPage() {
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // =========================
  // Fetch Bookmarks (Ordered)
  // =========================
  const fetchBookmarks = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
    setLoading(false);
  };

  // =========================
  // Realtime Setup (FIXED)
  // =========================
  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      fetchBookmarks();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel("realtime-bookmarks")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Always refresh for INSERT + DELETE
            fetchBookmarks();
          },
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // =========================
  // Add Bookmark
  // =========================
  const addBookmark = async () => {
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Title is required");
      return;
    }

    if (!url.trim()) {
      setErrorMessage("URL is required");
      return;
    }

    try {
      new URL(url);
    } catch {
      setErrorMessage("Please enter a valid URL (include https://)");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id,
    });

    if (error) {
      console.error(error);
      return;
    }

    setTitle("");
    setUrl("");
    fetchBookmarks();
  };

  // =========================
  // Delete Bookmark
  // =========================
  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    fetchBookmarks();
  };

  // =========================
  // Logout
  // =========================
  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">📌 My Bookmarks</h1>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer transition duration-200 shadow"
          >
            Logout
          </button>
        </div>

        {/* Add bookmark */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bookmark title"
          />
          <input
            className="flex-1 border rounded px-3 py-2"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <button
            onClick={addBookmark}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg cursor-pointer transition duration-200"
          >
            Add
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && bookmarks.length === 0 && (
          <p className="text-gray-500 text-center">No bookmarks yet</p>
        )}

        {/* Bookmark list */}
        {!loading && (
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li
                key={b.id}
                className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded"
              >
                <a
                  href={b.url}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  {b.title}
                </a>

                <button
                  onClick={() => setConfirmId(b.id)}
                  className="text-red-500 cursor-pointer"
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-80 shadow-lg">
            <h2 className="text-lg font-semibold mb-3">Delete bookmark?</h2>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this bookmark?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 border rounded cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  deleteBookmark(confirmId);
                  setConfirmId(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded cursor-pointer transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
