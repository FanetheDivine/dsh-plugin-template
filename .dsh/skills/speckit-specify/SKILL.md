---
name: "speckit-specify"
description: "Create or update the feature specification from a natural language feature description."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/specify.md"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before specification)**:

- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_specify` key.
- If the YAML cannot be parsed or is invalid, do not skip silently: tell the user that `.specify/extensions.yml` could not be read, include the parser error, state that no hooks were checked, including mandatory `optional: false` hooks, then continue normally.
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do not attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable.
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation.
- When constructing command invocations from hook command names, replace dots (`.`) with hyphens (`-`).
- For each executable hook, do not interpret an optional hook automatically. Output the command, description, and prompt.
- For each mandatory hook, output the command, actually invoke it, and wait for its result before proceeding.
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently.

## Outline

The text the user typed after `/speckit-specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Generate the specification draft. Formal requirement questions are owned by the mandatory `speckit-clarify` stage; do not conduct the interview here.

1. **Generate a concise short name** (2-4 words) for the feature:

   - Analyze the feature description and extract the most meaningful keywords.
   - Create a 2-4 word short name that captures the essence of the feature.
   - Use action-noun format when possible.
   - Preserve technical terms and acronyms.
   - Keep the name concise but descriptive.

2. **Branch creation** (optional, via hook):

   If a `before_specify` hook ran successfully, note its `BRANCH_NAME` and `FEATURE_NUM`. The branch name does not dictate the spec directory name. If the user explicitly provided `GIT_BRANCH_NAME`, pass it through to the hook.

3. **Create the spec feature directory**:

   Specs live under `specs/` unless the user explicitly provides `SPECIFY_FEATURE_DIRECTORY`.

   Resolution order:

   1. Use an explicitly provided `SPECIFY_FEATURE_DIRECTORY`.
   2. Otherwise read `.specify/init-options.json` for `feature_numbering`, with `branch_numbering` accepted only as a deprecated fallback:
      - `timestamp`: prefix the short name with `YYYYMMDD-HHMMSS` using the current timestamp.
      - `sequential` or absent: scan existing directories under `specs/`, select the next sequential three-digit feature number, and prefix the short name with it.
      - When only deprecated `branch_numbering` is used, warn: "`branch_numbering` in init-options.json is deprecated. Rename to `feature_numbering`."
   3. Construct `SPECIFY_FEATURE_DIRECTORY` as `specs/<prefix>-<short-name>`.

   Create the directory and initial spec:

   - Run `.specify/scripts/bash/resolve-template.sh spec-template --json` from the repository root and parse `TEMPLATE_CONTENT` as the active spec template.
   - If the resolver fails, stop and report the resolution error. Do not continue with only one contributing template layer.
   - Create the feature directory.
   - Write `TEMPLATE_CONTENT` to `SPECIFY_FEATURE_DIRECTORY/spec.md`.
   - Set `SPEC_FILE` to `SPECIFY_FEATURE_DIRECTORY/spec.md`.
   - Persist the actual resolved directory path to `.specify/feature.json`:

     ```json
     {
       "feature_directory": "<resolved feature dir>"
     }
     ```

   Create only one feature per invocation. The spec directory and file are created by this command, never by a hook.

4. Use `TEMPLATE_CONTENT` to understand required sections, including `Open Decisions`, `Clarifications`, and `Review Record`.

5. **IF EXISTS**: Load `.specify/memory/constitution.md` for project principles and governance constraints.

6. Build the draft:

   1. Parse the feature description. If it is empty, report: `No feature description provided`.
   2. Extract actors, actions, data, constraints, goals, and acceptance intent.
   3. Record each material unanswered requirement as a stable `Open Decisions` item with its recommendation, rationale, and dependencies.
   4. Fill in assumptions only when a reasonable default does not materially affect scope or acceptance.
   5. Populate User Scenarios, Functional Requirements, Success Criteria, and Key Entities using the template structure.
   6. Set the document status to `Draft`.

7. Write the specification to `SPEC_FILE` while preserving section order and headings. Do not ask the user clarification questions in this command.

8. **Specification Quality Validation**:

   1. Create `SPECIFY_FEATURE_DIRECTORY/checklists/requirements.md` from the active checklist template.
   2. Validate the draft against every checklist item.
   3. If quality items fail, revise the draft until they pass or the remaining ambiguity is represented as an open decision.
   4. Unanswered requirements do not block draft completion; they remain visible in `Open Decisions` and block planning until mandatory clarification resolves or explicitly waives them.
   5. Update the checklist with current pass/fail status after each revision.

## Mandatory Post-Execution Hooks

You MUST complete this section before reporting completion.

Check `.specify/extensions.yml` for enabled `hooks.after_specify` entries. Report executable optional hooks. For each mandatory hook, output the command, actually invoke it, and wait for its result. A parser error must be reported and must not be treated as an empty hook list.

## Completion Report

Report:

- `SPECIFY_FEATURE_DIRECTORY`
- `SPEC_FILE`
- Checklist results
- Open decision count
- Review status: `Draft`

The next stage is always mandatory:

```text
/speckit-clarify
```

Do not proceed to `/speckit-plan` from this command.

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement; no technology stack, APIs, or code structure.
- Written for business stakeholders and developers.
- Do not embed implementation checklists in the spec.
- Material gaps belong to `Open Decisions`, not silent guesses.
- Each requirement remains testable and each success criterion remains measurable.
- Preserve command names, code identifiers, API field names, and established product names in their original spelling.

## Done When

- [ ] Specification draft is written to `SPEC_FILE`.
- [ ] Material gaps are recorded in `Open Decisions`.
- [ ] The requirements checklist is created and validated.
- [ ] Extension hooks are dispatched or skipped.
- [ ] Completion report points to mandatory `speckit-clarify`.
