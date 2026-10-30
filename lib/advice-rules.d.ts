// Type declarations for lib/advice-rules.js (refs ISSUE-15).
export interface AdviceRuleSeed {
  name: string;
  conditionCategory: string | null;
  conditionFitTag: string | null;
  avoidTag?: string;
  action: 'prefer' | 'avoid' | 'require';
  weight: number;
  reason: string;
  source: string;
  enabled: boolean;
}
export const STARTING_ADVICE_RULES: AdviceRuleSeed[];
export function getStartingRules(): AdviceRuleSeed[];
export function enabledRules(rules: AdviceRuleSeed[]): AdviceRuleSeed[];
export function scoreFromEnabledRulesOnly(rules: AdviceRuleSeed[]): number;
