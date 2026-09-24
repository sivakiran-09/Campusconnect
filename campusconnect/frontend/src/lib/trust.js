// Campus Trust Score — the single source of truth for the formula.
// The backend (backend/src/services/trust.js) implements exactly the same maths.
//
//   score = 100 × Σ weight × factor
//   Sample-based factors are Bayesian-smoothed toward a neutral prior, so one
//   lucky transaction can't inflate a new account and one slip can't sink a veteran.

export const WEIGHTS = { transactions: 0.3, onTime: 0.25, condition: 0.2, rating: 0.15, verification: 0.05, cancellations: 0.05 };
const K = 2; // prior strength (pseudo-observations)
const PRIOR = { onTime: 0.75, condition: 0.75, rating: 0.8, cancellations: 1 };
const SATURATE_AT = 15; // successful transactions needed for full marks

const smooth = (obs, n, prior) => (obs * n + prior * K) / (n + K);

export function trustBreakdown(s = {}) {
  const successful = s.successful || 0;
  const returns = s.returnsTotal || 0;
  const ratingCount = s.ratingCount || 0;
  const requests = s.requests || 0;
  const f = {
    transactions: Math.min(1, successful / SATURATE_AT),
    onTime: smooth(returns ? (s.onTimeReturns || 0) / returns : 0, returns, PRIOR.onTime),
    condition: smooth(s.conditionAvg ?? 0, returns, PRIOR.condition),
    rating: smooth((s.ratingAvg || 0) / 5, ratingCount, PRIOR.rating),
    verification: s.verified ? 1 : 0,
    cancellations: smooth(requests ? 1 - (s.cancellations || 0) / requests : 1, requests, PRIOR.cancellations),
  };
  const labels = {
    transactions: ["Successful transactions", `${successful} completed`],
    onTime: ["On-time returns", returns ? `${s.onTimeReturns || 0} of ${returns} on time` : "No returns yet"],
    condition: ["Item condition", returns ? `${Math.round((s.conditionAvg || 0) * 100)}% returned as found` : "No checks yet"],
    rating: ["Peer ratings", ratingCount ? `${(s.ratingAvg || 0).toFixed(1)} from ${ratingCount} reviews` : "No reviews yet"],
    verification: ["Verification", s.verified ? "College email verified" : "Not verified"],
    cancellations: ["Cancellation history", `${s.cancellations || 0} cancelled of ${requests}`],
  };
  const factors = Object.keys(WEIGHTS).map((k) => ({
    key: k,
    label: labels[k][0],
    detail: labels[k][1],
    value: f[k],
    weight: WEIGHTS[k],
    points: Math.round(f[k] * WEIGHTS[k] * 1000) / 10,
    max: WEIGHTS[k] * 100,
  }));
  const score = Math.round(factors.reduce((a, x) => a + x.value * x.weight, 0) * 100);
  return { score, factors, tier: tierOf(score) };
}

export function tierOf(score) {
  if (score >= 95) return { name: "Campus Champion", tone: "green" };
  if (score >= 85) return { name: "Highly trusted", tone: "green" };
  if (score >= 70) return { name: "Trusted", tone: "" };
  if (score >= 50) return { name: "Building trust", tone: "amber" };
  return { name: "New here", tone: "gray" };
}

export const trustOf = (user) => trustBreakdown(user?.stats).score;
