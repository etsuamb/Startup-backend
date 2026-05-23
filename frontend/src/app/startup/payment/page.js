"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/startup/Sidebar";
import { createMentorshipChapaPayment, getMentorshipPaymentItems } from "@/lib/startupApi";

function formatCurrency(value, currency = "ETB") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusClass(status = "pending") {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "completed") return "bg-emerald-50 text-emerald-700";
  if (normalized === "failed") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

export default function StartupMentorshipPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const currency = "ETB";

  useEffect(() => {
    let ignore = false;

    async function loadPayments() {
      try {
        setLoading(true);
        setError("");
        const data = await getMentorshipPaymentItems();
        const items = Array.isArray(data.payments) ? data.payments : [];
        if (!ignore) {
          setPayments(items);
          setSelectedId(
            items.find((item) => item.payment_status !== "completed")?.mentorship_request_id ||
              items[0]?.mentorship_request_id ||
              null,
          );
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load mentorship payments.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPayments();
    return () => {
      ignore = true;
    };
  }, []);

  const selected = useMemo(
    () => payments.find((item) => item.mentorship_request_id === selectedId) || null,
    [payments, selectedId],
  );

  const platformFee = selected ? Number(selected.payable_amount || 0) * 0.02 : 0;
  const total = selected ? Number(selected.payable_amount || 0) + platformFee : 0;

  async function handleStartCheckout() {
    if (!selected) return;

    try {
      setStarting(true);
      setError("");
      const data = await createMentorshipChapaPayment({
        mentorship_request_id: selected.mentorship_request_id,
      });
      if (!data.form_action || !data.form_fields) {
        throw new Error("Chapa hosted checkout details were not returned.");
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.form_action;
      form.style.display = "none";

      Object.entries(data.form_fields).forEach(([name, value]) => {
        if (value === undefined || value === null || value === "") return;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err.message || "Unable to start Chapa checkout.");
      setStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex flex-col overflow-y-auto">
        <header className="px-4 sm:px-8 py-8 bg-gradient-to-r from-[#0f3d32] via-[#115b4c] to-[#184f45] text-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-sm uppercase tracking-[0.32em] text-[#b8f0d9]">Mentor payments</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Pay your mentor</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#d2f8e3]">
              Pay accepted mentorship offers through Chapa. Investment funding is handled by investors separately.
            </p>
          </div>
        </header>

        <div className="px-4 sm:px-10 py-10 w-full max-w-[1200px] mx-auto pb-24">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <section className="rounded-[28px] border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Accepted mentorship offers</h2>
                <span className="rounded-lg bg-[#f0faf5] px-3 py-1 text-xs font-bold text-[#0f3d32]">Chapa · ETB</span>
              </div>

              {loading ? (
                <p className="p-10 text-center text-gray-500">Loading payable offers...</p>
              ) : payments.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="text-lg font-bold text-gray-900">No accepted mentorship offers yet</h3>
                  <p className="mt-2 text-sm text-gray-500">Accept a mentor proposal first, then return here to pay.</p>
                  <Link href="/startup/offers" className="mt-5 inline-flex rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white">
                    View offers
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payments.map((item) => {
                    const isSelected = item.mentorship_request_id === selectedId;
                    return (
                      <button
                        key={item.mentorship_request_id}
                        type="button"
                        onClick={() => setSelectedId(item.mentorship_request_id)}
                        className={`w-full px-6 py-5 text-left transition ${isSelected ? "bg-[#f0faf5]" : "hover:bg-gray-50"}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-gray-900">{item.mentor_name || "Mentor"}</p>
                            <p className="mt-1 text-sm text-gray-500">{item.subject || "Mentorship offer"}</p>
                            <p className="mt-2 text-xs text-gray-400">Accepted {formatDate(item.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#0f3d32]">{formatCurrency(item.payable_amount, currency)}</p>
                            <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(item.payment_status)}`}>
                              {item.payment_status || "pending"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-gray-900">Payment summary</h3>
              {selected ? (
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mentor</span>
                    <span className="font-semibold text-gray-900">{selected.mentor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Session fee</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selected.payable_amount, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform fee (2%)</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(platformFee, currency)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Total</span>
                    <span className="text-2xl font-black text-[#0f3d32]">{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">Select an accepted mentorship offer.</p>
              )}

              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={!selected || starting || selected?.payment_status === "completed"}
                className="mt-8 w-full rounded-2xl bg-[#0f3d32] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#0b2a1d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {starting ? "Opening Chapa..." : selected?.payment_status === "completed" ? "Already paid" : "Pay with Chapa"}
              </button>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
