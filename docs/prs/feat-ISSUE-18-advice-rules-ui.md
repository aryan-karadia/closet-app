# PR: feat/ISSUE-18-advice-rules-ui

- Issue closed: ISSUE-18 (Advice Rules editor UI)
- Branch: feat/ISSUE-18-advice-rules-ui
- Based on: feat/ISSUE-17-outfit-builder. Merge order position: 9 of 12. Agent D must merge in this order: ISSUE-20, ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-22, ISSUE-27.

## What changed

- Added app/advice-rules/page.tsx: list rules with enabled toggle, reason, source, action, weight, condition category and fit tag, edit (name, reason, source, weight), add (name, condition category, condition fit tag, action, weight, reason, source), and delete with confirmation. The enabled toggle patches the rule through the frozen API immediately.
- Added a Load starting rules button calling the frozen seed endpoint, which is idempotent: if rules already exist it returns them with seeded false and nothing is duplicated. The starting rules are therefore editable records from the API, not code constants in the UI. The UI states that a disabled rule never affects scoring, and the ISSUE-16 engine enforces that by reading only enabled rules.
- Added app/outfits/page.tsx as a placeholder only; the full saved outfits screen lands on the ISSUE-19 branch.

## How to test

- Sign in, open /advice-rules, use Load starting rules, and check the 10 spec 6.5 rules appear. Toggle one off, build an outfit on /, and check that rule no longer affects scoring. Edit a rule reason, add a new rule, delete a rule, and check each change persists after reload.
- Run sh scripts/check-tests.sh and npm run build.

## Test results

- npm run build: passed after fixing an action union type error in the add form. Compiled successfully.
- sh scripts/check-tests.sh (non-live): total 135, pass 121, fail 0, skipped 14. No gated test covers the rules UI directly, so no count change was expected here. The advice rules gated tests already pass via lib/advice-rules.js from the backend.

## Contract change

No contract change.

## Mismatch or blocked items

- None. Note: the API advice rule shape has no avoidTag field (see the backend merge notes), so a rule with both a prefer tag and an avoid tag cannot be stored in full fidelity through the API. The UI stores the single conditionFitTag the contract supports. Full fidelity avoid tags live only in lib/advice-rules.js for the engine. If Agent D wants avoidTag in the API, that is a contract change through Agent D.
- No em dashes. No secrets committed.
