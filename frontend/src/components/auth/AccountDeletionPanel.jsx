"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCurrentAccount } from "@/lib/authApi";
import { clearSession } from "@/lib/authStorage";

const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

export default function AccountDeletionPanel({ actorLabel }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmation !== CONFIRMATION_TEXT || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await deleteCurrentAccount(confirmation);
      clearSession();
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/30 p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-red-700">Delete Account</h2>
      <p className="mt-1 text-sm text-gray-600">
        Permanently delete your {actorLabel} account and all associated platform data.
      </p>
      <p className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs leading-5 text-red-800">
        This removes your profile, documents, messages, and related records. This action cannot be undone.
      </p>
      <div className="mt-5 max-w-md space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500" htmlFor={`${actorLabel}-delete-confirmation`}>
          Type <span className="text-red-600">{CONFIRMATION_TEXT}</span> to confirm
        </label>
        <input
          id={`${actorLabel}-delete-confirmation`}
          type="text"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
          placeholder={CONFIRMATION_TEXT}
        />
        {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
        <button
          type="button"
          onClick={handleDelete}
          disabled={confirmation !== CONFIRMATION_TEXT || deleting}
          className="inline-flex items-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? "Deleting Account..." : "Permanently Delete Account"}
        </button>
      </div>
    </section>
  );
}
