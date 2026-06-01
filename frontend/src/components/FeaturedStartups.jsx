"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CardGridSkeleton } from "@/components/loading/PageSkeletons";

const IMAGE_MAP = {
  agritech: "/agritech-startup.png",
  edtech: "/edtech-startup.png",
  fintech: "/fintech-startup.png",
  default: "/agritech-startup.png",
};

function resolveStartupImage(industry) {
  if (!industry || typeof industry !== "string") {
    return IMAGE_MAP.default;
  }

  const key = industry.toLowerCase();
  if (key.includes("agri")) return IMAGE_MAP.agritech;
  if (key.includes("edu") || key.includes("learn")) return IMAGE_MAP.edtech;
  if (key.includes("fin") || key.includes("pay")) return IMAGE_MAP.fintech;
  return IMAGE_MAP.default;
}

export default function FeaturedStartups() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    async function loadStartups() {
      try {
        const res = await fetch("/api-backend/startups/featured?limit=3", {
          signal: abortController.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to load startups: ${res.statusText}`);
        }
        const data = await res.json();
        setStartups(Array.isArray(data.startups) ? data.startups : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load featured startups.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadStartups();
    return () => abortController.abort();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
        Featured Startups
      </h2>

      {loading ? (
        <CardGridSkeleton />
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : startups.length === 0 ? (
        <p className="text-center text-gray-600">
          No featured startups are available right now.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {startups.map((startup) => (
            <div
              key={startup.startup_id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition"
            >
              <div className="h-48 bg-gray-200 w-full relative">
                <Image
                  src={resolveStartupImage(startup.industry)}
                  alt={startup.startup_name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-green-50 text-primary text-xs font-medium rounded">
                    {startup.industry || "Startup"}
                  </span>
                  <span className="px-2 py-1 bg-green-50 text-primary text-xs font-medium rounded">
                    {startup.business_stage || "Early stage"}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {startup.startup_name}
                </h3>
                <p className="text-sm text-gray-600 mb-6 flex-grow">
                  {startup.description ||
                    "A growing startup building impact across Ethiopia."}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  {startup.location ? `${startup.location} • ` : ""}
                  {startup.team_size
                    ? `${startup.team_size} team members`
                    : "Team details available after sign up."}
                </div>
                <Link
                  href="/register"
                  className="self-start px-4 py-2 border border-primary text-primary text-sm font-medium rounded hover:bg-green-50 transition"
                >
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
