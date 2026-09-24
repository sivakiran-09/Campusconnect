// Exact mirror of frontend/src/lib/trust.js — kept in perfect sync so a Trust Score computed
// server-side after a real return always matches what the client showed the person.
const WEIGHTS = { transactions: 0.3, onTime: 0.25, condition: 0.2, rating: 0.15, verification: 0.05, cancellations: 0.05 };
const K = 2;
const PRIOR = { onTime: 0.75, condition: 0.75, rating: 0.8, cancellations: 1 };
const SATURATE_AT = 15;
const smooth = (obs, n, prior) => (obs * n + prior * K) / (n + K);

export function trustScore(s = {}) {
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
  return Math.round(Object.keys(WEIGHTS).reduce((a, k) => a + f[k] * WEIGHTS[k], 0) * 100);
}
