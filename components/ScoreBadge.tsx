// Colour blind friendly score badge (refs ISSUE-11, spec section 10).
// Always shows the number plus the verdict text, never colour alone.
// No em dashes are used in this file.
'use client';
import type { Verdict } from '../lib/types';

export default function ScoreBadge({ score, verdict }: { score: number | null | undefined; verdict: Verdict | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="inline-block rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium">Manual, not auto rated</span>;
  }
  const label = verdict || (score >= 90 ? 'Perfect' : score >= 70 ? 'Strong' : score >= 50 ? 'Works' : 'Avoid');
  return (
    <span className="inline-block rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium">
      {Math.round(score)}: {label}
    </span>
  );
}
