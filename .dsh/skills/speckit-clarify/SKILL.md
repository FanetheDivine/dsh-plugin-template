---
name: "speckit-clarify"
description: "Clarify the active feature spec through exploration-first batch interviews and require full-spec review before planning."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/clarify.md"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

Check `.specify/extensions.yml` for enabled `hooks.before_clarify` entries.

- A YAML parser error must be reported and cannot be treated as an empty hook list.
- Hooks without `enabled` are enabled by default; filter only explicit `false`.
- Do not evaluate `condition` here; non-empty conditions are left to the HookExecutor.
- Optional hooks are reported. Mandatory hooks must actually be invoked and awaited.

## Outline

Goal: eliminate material ambiguity before planning, then obtain the user's decision on the complete specification. This stage is mandatory for every change, regardless of whether `spec.md` already contains unresolved markers.

### 1. Resolve context

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from the repository root once.
2. Parse `FEATURE_DIR` and `FEATURE_SPEC`.
3. If resolution fails, stop and instruct the user to run `/speckit-specify`.
4. Load the active spec, checklist, and `.specify/memory/constitution.md` when present.

### 2. Complete exploration before questioning

Before asking any user question, inspect the repository and existing project guidance:

- Relevant source modules, tests, scripts, templates, and generated files.
- Current README, `AGENTS.md`, developer docs, and constitution.
- Existing interfaces, dependencies, constraints, and conventions.
- Paths or examples provided by the user.
- The behavior represented by the spec draft.

Resolve questions that the codebase or project documentation answers reliably. Do not ask the user to repeat facts that can be confirmed locally. Exploration findings become assumptions or decisions and must be traceable in the spec.

### 3. Build the full decision inventory

Scan the specification and exploration results using these categories:

- Functional scope, behavior, priorities, and explicit exclusions.
- User roles, journeys, error states, and empty states.
- Data entities, identity, state, relationships, and scale.
- Non-functional quality, compatibility, and delivery constraints.
- Integration surfaces, dependency behavior, and failure modes.
- Edge cases, concurrency, conflicts, and recovery.
- Terminology and canonical names.
- Acceptance criteria and measurable success signals.

For every material decision, record in `## Open Decisions`:

- stable id;
- exact question;
- recommended answer;
- rationale;
- dependencies on other ids;
- status: `not asked`, `asked`, `answered`, `skipped`, or `waived`.

The inventory has no fixed maximum. Questions answerable from the repository are removed from it and recorded as exploration findings.

### 4. Ask dependency-resolved batches

Repeat until every material decision is answered or the user explicitly waives the interview:

1. Select all open decisions whose dependencies are resolved.
2. Ask every such question in one response. Each item must include:

   ```text
   Q[stable id]: [full question]?
   Recommended: [answer] — [reason]
   Options: [relevant choices]
   ```

3. Accept batch answers by stable id.
4. Treat the recommendation as accepted only when the user explicitly chooses it.
5. If an answer is ambiguous, ask one disambiguation for the same id; it does not become a new question.
6. Keep `skipped` items visible in `Open Decisions`.
7. After each accepted batch, update affected questions, recommendations, and dependencies, then calculate the next batch.
8. Do not ask a question whose correct wording or options depend on an unanswered predecessor.
9. Do not impose a question cap or stop because a nominal count was reached.

The interview ends when:

- every material decision has an answer;
- the user explicitly waives the interview, and all unresolved items and risks are recorded; or
- no question can be answered without first receiving an answer that remains unavailable.

### 5. Integrate answers incrementally

After each accepted answer or batch:

1. Append the final question and answer to `## Clarifications` under the current session heading.
2. Remove the answered item from `## Open Decisions`.
3. Update the most appropriate functional requirements, user scenarios, entities, success criteria, edge cases, assumptions, and terminology.
4. Replace any statement invalidated by the new answer.
5. Preserve heading hierarchy and unrelated content.
6. Save the spec promptly.

Use the exact decision ids in the clarification record so interrupted sessions can resume from `Open Decisions`.

### 6. Revalidate quality

Re-evaluate `FEATURE_DIR/checklists/requirements.md` after each spec save. Toggle only checklist items whose state changes and preserve all other content. A requirement that remains unresolved must appear in `Open Decisions`; it does not count as a hidden assumption.

### 7. Require full-spec review

When the interview ends, set the spec status to `Draft` and present:

- a link to the complete spec;
- the checklist result;
- the number of accepted decisions;
- the remaining open items, if any;
- a concise summary of scope, behavior, acceptance, and risks.

Ask for exactly one decision:

- **Approve** the current complete spec.
- **Waive** the review after the user explicitly accepts all open items and risks.
- **Request changes** to any part of the current complete spec.

Rules:

- Partial approval is not approval. Resolve the remaining feedback and request review again.
- Silence or opening the file is not approval.
- An approval record contains date, decision, current full-document scope, open items, and risks.
- A waiver record contains date, decision, all unresolved items, and risks.
- Substantive edits invalidate the previous approval and return the status to `Draft`.
- Pure formatting corrections may preserve `Approved` or `Waived`.
- Only `Approved` or `Waived` authorizes `/speckit-plan`.

### 8. Update the document

Record the decision in `## Review Record` only after the user responds with approval, waiver, or changes. A change request keeps the spec at `Draft`; update it and request another full review.

## Mandatory Post-Execution Hooks

Complete enabled `hooks.after_clarify` entries. Mandatory hooks must be invoked and awaited before reporting.

## Completion Report

Report:

- accepted decision count and skipped/waived count;
- updated spec path;
- checklist before/after result;
- sections touched;
- review decision: `Approved`, `Waived`, `Changes requested`, or `Pending`;
- next command: `/speckit-plan` only after `Approved` or `Waived`.

## Done When

- [ ] Repository exploration happened before user questions.
- [ ] Every material decision is answered or explicitly waived.
- [ ] Dependent questions are batched after their prerequisites are resolved.
- [ ] The complete spec quality checklist is revalidated.
- [ ] The user approved or explicitly waived review of the current complete spec.
- [ ] Downstream planning is allowed only by `Approved` or `Waived`.
