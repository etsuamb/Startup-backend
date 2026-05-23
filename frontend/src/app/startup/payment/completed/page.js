"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/startup/Sidebar";
import { verifyChapaPayment } from "@/lib/startupApi";

function formatCurrency(value, currency = "ETB") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function PaymentCompletedContent() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(Boolean(txRef));
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function verifyPayment() {
      if (!txRef) {
        setError("No Chapa transaction reference was provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await verifyChapaPayment(txRef);
        if (!ignore) setResult(data);
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to verify payment.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    verifyPayment();
    return () => {
      ignore = true;
    };
  }, [txRef]);

  const payment = result?.payment;
  const isCompleted = payment?.status === "completed";

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans text-gray-900 flex">
      <Sidebar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm text-center">
          <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${isCompleted ? "bg-[#dcfce7] text-[#166534]" : "bg-amber-100 text-amber-700"}`}>
            {loading ? "…" : isCompleted ? "✓" : "!"}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? "Verifying payment" : isCompleted ? "Payment successful" : "Payment pending"}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {error || (isCompleted ? "Your mentorship payment was verified." : "We are still waiting for Chapa to confirm this transaction.")}
          </p>
          {payment && (
            <div className="mt-6 rounded-2xl bg-[#f8fafc] p-5 text-left text-sm space-y-2">
              <p><span className="text-gray-500">Amount:</span> <strong>{formatCurrency(payment.amount, payment.currency || "ETB")}</strong></p>
              <p><span className="text-gray-500">Reference:</span> <strong className="break-all">{txRef}</strong></p>
              <p><span className="text-gray-500">Status:</span> <strong>{payment.status}</strong></p>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => window.location.reload()} className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700">
              Refresh status
            </button>
            <Link href="/startup/payment" className="rounded-full bg-[#0f3d32] px-6 py-3 text-sm font-semibold text-white">
              Back to payments
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StartupPaymentCompletedPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCompletedContent />
    </Suspense>
  );
}
