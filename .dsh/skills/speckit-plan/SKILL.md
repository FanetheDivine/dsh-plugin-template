---
name: "speckit-plan"
description: "Execute implementation planning, exploration-first batch interviews, and full-plan review before task generation."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/plan.md"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

Check `.specify/extensions.yml` for enabled `hooks.before_plan` entries.

- A YAML parser error must be reported and cannot be treated as an empty hook list.
- Hooks without `enabled` are enabled by default; filter only explicit `false`.
- Do not evaluate `condition` here; non-empty conditions are left to the HookExecutor.
- Optional hooks are reported. Mandatory hooks must actually be invoked and awaited.

## Outline

### 1. Specification gate

Before running setup, read the active spec and its review state.

- The spec status MUST be `Approved` or `Waived`.
- Every item in `Open Decisions` MUST be answered or covered by an explicit user waiver.
- The latest `Review Record` MUST apply to the current complete spec.
- Partial approval, a missing decision, or substantive changes after review keep the spec at `Draft`.
- When this gate fails, stop and return to `/speckit-clarify` without running `setup-plan.sh`.

### 2. Setup

Run `.specify/scripts/bash/setup-plan.sh --json` from the repository root and parse `FEATURE_SPEC`, `IMPL_PLAN`, `FEATURE_DIR`, and `BRANCH`.

For single quotes in arguments, use valid shell escaping or double quotes.

### 3. Load context

Read `FEATURE_SPEC`, `.specify/memory/constitution.md`, and the copied `IMPL_PLAN` template. The template includes `Open Decisions`, `Clarifications`, and `Review Record` sections that must be populated.

### 4. Execute the planning workflow

Follow the structure in the plan template:

1. Fill Technical Context. Put unresolved material choices into `Open Decisions` rather than hiding them as assumptions.
2. Complete every Constitution Check gate before continuing.
3. Phase 0: generate `research.md` and resolve researchable unknowns.
4. Phase 1: generate `data-model.md`, relevant `contracts/`, and `quickstart.md`.
5. Re-evaluate the Constitution Check after design.

### 5. Complete technical exploration before implementation questions

Before interviewing the user, inspect all relevant implementation facts:

- Source modules, tests, scripts, build configuration, and generated artifacts.
- Existing APIs, dependency versions, integration points, and data conventions.
- Project documentation, known risks, and constraints.
- Current research, data model, contracts, and validation guide.

Resolve questions that can be answered reliably from these sources. Dispatch focused research agents when useful and consolidate their findings before presenting a batch.

### 6. Build the implementation decision inventory

For each material implementation choice, record in the plan's `## Open Decisions`:

- stable id;
- exact question;
- recommended answer;
- rationale;
- dependencies on other ids;
- status: `not asked`, `asked`, `answered`, `skipped`, or `waived`.

Cover architecture, data, interfaces, dependency choices, failure handling, testing, rollout, documentation, and delivery risks. The inventory has no fixed maximum.

### 7. Ask dependency-resolved batches

Repeat until every implementation decision is answered or the user explicitly waives the interview:

1. Select all open decisions whose dependencies are resolved.
2. Ask every such question in one response, with its id, full question, recommended answer, reason, and relevant options.
3. Accept batch answers by stable id. Recommendations require explicit user acceptance.
4. Keep skipped items visible and unresolved.
5. After each batch, record answers in `Clarifications`, remove answered items from `Open Decisions`, and update the plan and all affected design documents.
6. Recalculate dependent questions after answers. Do not ask conditional questions whose wording depends on an unanswered predecessor.
7. Do not stop because a fixed number of questions was reached.

If an answer changes requirements or acceptance behavior, set the spec status to `Draft`, update its open decisions, and return to `/speckit-clarify` before continuing planning.

### 8. Resolve all pre-implementation unknowns

Before plan review:

- Every non-waived `Open Decisions` item is answered.
- `research.md` contains no unresolved research markers.
- Plan, data model, contracts, and quickstart are consistent with the answers.
- Constitution Check passes again.
- Tasks and implementation must not receive unresolved assumptions or `NEEDS CLARIFICATION` items.

A user waiver must explicitly list the unresolved decisions and their risks.

### 9. Require full-plan review

Set the plan status to `Draft` and present:

- a link to the complete plan;
- links to generated research and design artifacts;
- Constitution Check results;
- remaining open items, if any;
- a concise summary of implementation choices, verification, and risks.

Ask for exactly one decision:

- **Approve** the current complete plan.
- **Waive** the review after the user explicitly accepts all open items and risks.
- **Request changes** to any part of the plan.

Rules:

- Partial approval is not approval. Resolve feedback and request full review again.
- Silence or opening the file is not approval.
- Append the date, decision, current full-plan scope, open items, and risks to `Review Record`.
- A waiver records every unresolved decision and its risk.
- Substantive edits invalidate the current approval and return the status to `Draft`.
- Pure formatting corrections may preserve `Approved` or `Waived`.
- Only `Approved` or `Waived` authorizes `/speckit-tasks`.

## Phase 0: Outline & Research

1. Extract each researchable unknown from Technical Context and the implementation inventory.
2. Research dependencies, integration patterns, and existing project practices.
3. Consolidate findings in `research.md` with Decision, Rationale, and Alternatives Considered.
4. Resolve researchable unknowns before user questioning. User choices remain in `Open Decisions`.

## Phase 1: Design & Contracts

Prerequisite: research is complete enough to distinguish repository facts from user choices.

1. Extract entities, fields, relationships, validation rules, and state transitions into `data-model.md`.
2. Define relevant external interface contracts in `contracts/`; skip this directory for purely internal work.
3. Create `quickstart.md` with prerequisites, validation commands, scenarios, and expected outcomes.
4. Reference contracts and data model details instead of duplicating them.
5. Keep implementation code and complete task lists out of this phase.

## Mandatory Post-Execution Hooks

Complete enabled `hooks.after_plan` entries after the user approves or explicitly waives the current complete plan. Mandatory hooks must be invoked and awaited before reporting.

## Completion Report

Report:

- branch and plan path;
- generated artifacts;
- accepted implementation decisions and waived count;
- Constitution Check result;
- review decision: `Approved`, `Waived`, `Changes requested`, or `Pending`;
- next command: `/speckit-tasks` only after `Approved` or `Waived`.

## Key Rules

- Use absolute paths for filesystem operations and project-relative paths in documents.
- Fail Constitution Check violations and unresolved non-waived decisions.
- Perform exploration before user questions.
- Ask all currently independent questions in each batch.
- Preserve stable ids in decision and clarification records.

## Done When

- [ ] The current spec passed its review gate.
- [ ] Plan, research, data model, contracts, and quickstart are complete as applicable.
- [ ] Every implementation decision is answered or explicitly waived.
- [ ] The user approved or explicitly waived review of the current complete plan.
- [ ] Constitution Check passes after all updates.
- [ ] Extension hooks are dispatched or skipped.
- [ ] Completion report points to `speckit-tasks` only after approval or waiver.
