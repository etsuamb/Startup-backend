export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatTicketRange(contact, kind) {
  if (kind === "investor") {
    if (contact.investment_range) return String(contact.investment_range);
    const budget = Number(contact.investment_budget);
    if (budget > 0) {
      const low = Number(contact.investment_budget_min ?? Math.round(budget * 0.2));
      const high = budget;
      return `${formatMoney(low) || "$0"} - ${formatMoney(high) || "$0"} per startup`;
    }
  }
  if (kind === "mentor" && contact.session_pricing) {
    const high = formatMoney(contact.session_pricing) || `$${contact.session_pricing}`;
    const low = formatMoney(contact.session_pricing_min);
    return `${low ? `${low} - ` : ""}${high} per session`;
  }
  return null;
}

export function parseTagList(value) {
  if (!value) return [];
  return String(value)
    .split(/[,;|/]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function parseMentoredList(value) {
  if (!value) return [];
  return String(value)
    .split(/[\n,;|]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((name) => ({
      name,
      subtitle: "MENTORSHIP",
      description: "Mentored through Startup Hub",
    }));
}

export function findInvestorRecommendation(recommendations, investorId) {
  const id = Number(investorId);
  return (
    recommendations.find((r) => Number(r.investor?.investor_id) === id) ||
    recommendations.find((r) => Number(r.investor_id) === id) ||
    null
  );
}

export function findMentorRecommendation(recommendations, mentorId) {
  const id = Number(mentorId);
  return recommendations.find((r) => Number(r.mentor?.mentor_id) === id) || null;
}

export function buildInvestorMatchChecks(investor, startupProfile, recommendation) {
  const checks = [];
  const industry = startupProfile?.industry || startupProfile?.project_industry;
  const stage = startupProfile?.stage || startupProfile?.lifecycle_stage;
  const funding = Number(startupProfile?.funding_need || startupProfile?.funding_goal || 0);
  const budget = Number(investor?.investment_budget || 0);

  if (
    investor?.preferred_industry &&
    industry &&
    (String(investor.preferred_industry).toLowerCase().includes(String(industry).toLowerCase()) ||
      String(industry).toLowerCase().includes(String(investor.preferred_industry).toLowerCase()))
  ) {
    checks.push({ label: `Industry: ${industry}`, matched: true });
  } else if (industry) {
    checks.push({ label: `Industry: ${industry}`, matched: false });
  }

  if (budget > 0 && funding > 0) {
    checks.push({
      label: `Funding range: ${formatMoney(budget) || budget}`,
      matched: funding <= budget * 1.5,
    });
  } else if (budget > 0) {
    checks.push({ label: `Typical budget: ${formatMoney(budget)}`, matched: true });
  }

  if (investor?.investment_stage && stage) {
    checks.push({
      label: `Stage: ${stage}`,
      matched:
        String(investor.investment_stage).toLowerCase().includes(String(stage).toLowerCase()) ||
        String(stage).toLowerCase().includes(String(investor.investment_stage).toLowerCase()),
    });
  }

  if (investor?.country || investor?.location_preference) {
    const loc = investor.country || investor.location_preference;
    checks.push({ label: `Location: ${loc}`, matched: true });
  }

  if (recommendation?.reasons?.length) {
    return recommendation.reasons.slice(0, 4).map((r) => ({ label: r, matched: true }));
  }

  return checks.length ? checks : [{ label: "Profile aligned with your startup", matched: true }];
}

export function buildMentorMatchChecks(mentor, startupProfile, recommendation) {
  const industry = startupProfile?.industry;
  const checks = [];

  if (mentor?.primary_industry && industry) {
    checks.push({
      label: `Industry: ${industry}`,
      matched:
        String(mentor.primary_industry).toLowerCase().includes(String(industry).toLowerCase()) ||
        String(industry).toLowerCase().includes(String(mentor.primary_industry).toLowerCase()),
    });
  } else if (mentor?.expertise && industry) {
    checks.push({
      label: `Expertise in ${industry}`,
      matched: String(mentor.expertise).toLowerCase().includes(String(industry).toLowerCase()),
    });
  }

  if (mentor?.years_experience) {
    checks.push({ label: `${mentor.years_experience}+ years experience`, matched: true });
  }

  if (mentor?.mentoring_style) {
    checks.push({ label: mentor.mentoring_style, matched: true });
  }

  if (recommendation?.reason) {
    checks.push({ label: recommendation.reason, matched: true });
  }

  return checks.length ? checks.slice(0, 4) : [{ label: "Mentor profile matches your sector", matched: true }];
}
