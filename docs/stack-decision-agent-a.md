# Agent A stack decision

- Date: 2026-10-30
- Source: Update from Aryan, for Agent A only, passed through Agent D.
- Decision: Agent A's tech stack is fixed as Tailwind CSS, shadcn/ui, React, Next.js with TypeScript.
- Explicitly out for Agent A: Vue, and any other UI framework.
- Spec basis: This matches spec Section 16.2, with React now made explicit.
- Scope of change: Agent A issues and repo docs only.
- Not changed: Agent B, Agent C, and Agent D roles. Workflow, branch naming, commit, PR file, and merge rules are unchanged.
- Enforcement: Agent A branches must use exactly this stack. If an Agent A branch introduces Vue or another UI framework, Agent D must reject it at review and route it back to Agent A. Agent A must report any stack mismatch to Agent D, not silently substitute a framework.
- Where recorded: README.md, WORKFLOW.md, and every Agent A issue file listed below.
- Agent A issues updated: ISSUE-03, ISSUE-04, ISSUE-09, ISSUE-11, ISSUE-12, ISSUE-16, ISSUE-17, ISSUE-18, ISSUE-19, ISSUE-20, ISSUE-22, ISSUE-27, plus EPIC-03 and EPIC-04.
