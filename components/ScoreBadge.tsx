// Colour blind friendly score badge (refs ISSUE-11, spec section 10).
// Always shows the number plus the verdict text, never colour alone.
// Uses shadcn Badge, with the variant chosen from the verdict.
// No em dashes are used in this file.
'use client';
import type { Verdict } from '../lib/types';
import { Badge } from './ui/badge';

export default function ScoreBadge({ score, verdict }: { score: number | null | undefined; verdict: Verdict | null | undefined }) {
  if (score === null || score === undefined) {
    return <Badge variant="outline">Manual, not auto rated</Badge>;
  }
  const label = verdict || (score >= 90 ? 'Perfect' : score >= 70 ? 'Strong' : score >= 50 ? 'Works' : 'Avoid');
  const variant = label === 'Avoid' ? 'destructive' : label === 'Works' ? 'outline' : 'secondary';
  return (
    <Badge variant={variant}>
      {Math.round(score)}: {label}
    </Badge>
  );
}
