---
name: create-trd
description: >-
  Teaches the agent how to create, structure, and update a Technical Requirements Document (TRD)
  following the agent-driven development workflow. Every update to the TRD must append a timestamped
  changelog entry at the top of the Update History section — the document body is then modified
  accordingly. Use this skill whenever creating a new TRD or updating an existing one.
---

# TRD (Technical Requirements Document) Skill

## Purpose
A Technical Requirements Document (TRD) is the **single source of truth** for a project's
requirements before architecture or implementation begins. In an agent-driven development model,
this document is the reference that every subsequent artifact (TDS, task plans, test suites)
is derived from.

---

## When to Activate
- User asks to **create a TRD** for a project.
- User asks to **update, revise, or extend** an existing TRD.
- User asks to **add, modify, or remove** any requirement, constraint, or test scenario.
- Agent is about to derive a Technical Design Spec (TDS) and needs a reference document.

---

## File Location Convention
All TRDs for a project live at:
```
<project-root>/docs/TRD.md
```
If a `docs/` directory does not exist, create it. Never create TRDs in the project root itself.

---

## TRD Document Structure
Every TRD MUST contain the following top-level sections in exactly this order:

```
1. Document Header          — name, version, status, owner, timestamps
2. Update History           — reverse-chronological changelog (newest first)
3. Executive Summary        — 2-3 paragraph description of the product and its purpose
4. Business Context         — the problem being solved, target users, and business value
5. Scope                    — what is IN scope and OUT of scope
6. Functional Requirements  — FR-001..FR-NNN, categorized
7. Non-Functional Requirements — NFR-001..NFR-NNN (performance, security, reliability, etc.)
8. Technical Constraints    — tech stack mandates, service constraints, cost constraints
9. Data Requirements        — data models at a conceptual level (no DDL yet)
10. Integration Points      — external services, APIs, webhooks
11. Test Scenarios          — TS-001..TS-NNN covering happy path, edge cases, isolation, security
12. Open Questions          — unresolved decisions and assumptions
13. Glossary                — project-specific terms
```

---

## Document Header Template
```markdown
# Technical Requirements Document
## <Project Name>

| Field         | Value                          |
| :------------ | :----------------------------- |
| **Version**   | 1.0.0                          |
| **Status**    | Draft / In Review / Approved   |
| **Owner**     | <Author Name>                  |
| **Created**   | YYYY-MM-DD HH:MM IST           |
| **Updated**   | YYYY-MM-DD HH:MM IST           |
| **Project**   | <Repository or Project Name>   |
```

---

## Update History Format (CRITICAL RULE)
This is the most important section to maintain correctly.

### Rules:
1. **Every time the TRD is modified**, a new entry MUST be prepended (added at the top) of the
   Update History table — newest entry always appears first.
2. The timestamp MUST use the local system time at the moment of the update, formatted as:
   `YYYY-MM-DD HH:MM <timezone>` (e.g., `2026-09-29 15:30 IST`)
3. The summary MUST be a concise, specific description of exactly what changed.
4. The version number MUST be incremented following SemVer logic:
   - **PATCH** (x.x.1): Minor copy edits, clarifications, typo fixes
   - **MINOR** (x.1.0): New requirements added, sections extended, test scenarios added
   - **MAJOR** (1.0.0 -> 2.0.0): Fundamental scope change, major re-architecture, or breaking constraint changes

### Template:
```markdown
## Update History

| Version | Date & Time          | Summary of Changes                              |
| :------ | :------------------- | :---------------------------------------------- |
| 1.1.0   | 2026-09-29 16:00 IST | Added FR-012 (streaming chat), 3 new test cases |
| 1.0.0   | 2026-09-29 15:30 IST | Initial TRD created                             |
```

---

## Functional Requirements Format
Each requirement MUST be written in the following format:

```markdown
### FR-001: <Short Title>
- **Category**: <Core / Auth / Ingestion / RAG / Tool Calling / Dashboard / Security>
- **Priority**: <P0-Critical / P1-High / P2-Medium / P3-Low>
- **Description**: Clear description of what the system must do, written from the user's perspective.
- **Acceptance Criteria**:
  - [ ] Criterion 1 (verifiable, testable statement)
  - [ ] Criterion 2
- **Dependencies**: FR-XXX (or "None")
```

---

## Non-Functional Requirements Format
```markdown
### NFR-001: <Short Title>
- **Category**: <Performance / Security / Reliability / Scalability / Usability / Compliance>
- **Priority**: <P0-Critical / P1-High / P2-Medium>
- **Description**: Measurable, specific constraint the system must satisfy.
- **Acceptance Criteria**:
  - [ ] Measurable metric or threshold
```

---

## Test Scenario Format
```markdown
### TS-001: <Short Title>
- **Type**: <Happy Path / Edge Case / Security / Isolation / Failure>
- **Related Requirements**: FR-XXX, NFR-XXX
- **Pre-conditions**: What must be true before this test runs.
- **Steps**:
  1. Step one
  2. Step two
- **Expected Result**: What the system must do (observable outcome).
- **Pass Criteria**: Exactly what constitutes a pass (binary).
```

---

## Agent Workflow: Creating a New TRD
1. Confirm project name, owner, and current timestamp with user (or infer from context).
2. Create `<project-root>/docs/TRD.md` using the full document structure above.
3. Populate all sections from available project specifications.
4. Set **Version: 1.0.0**, **Status: Draft**, **Created & Updated** to current local timestamp.
5. Add an initial entry to Update History: "Initial TRD created".
6. Present the TRD to the user as a rendered artifact.

## Agent Workflow: Updating an Existing TRD
1. Read the existing `docs/TRD.md`.
2. Identify the current version from the Document Header.
3. Determine the version bump type (PATCH / MINOR / MAJOR) based on the nature of the change.
4. Calculate the new version number.
5. Make all content changes to the appropriate sections.
6. **Prepend** a new row to the Update History table with: new version, current local timestamp, and a precise summary of all changes made.
7. Update the `**Updated**` field in the Document Header to the current local timestamp.
8. Save the file and confirm the update to the user, citing the new version and timestamp.

---

## Quality Rules
- Every FR and NFR must have at least one corresponding TS (Test Scenario).
- Requirements must be **testable** — avoid vague language like "fast" or "good UX".
- Use "MUST", "SHOULD", "MAY" (RFC 2119) for clarity of obligation.
- No duplicate IDs. If requirements are removed, their IDs are retired, not reused.
- The Update History section is NEVER edited retroactively — only new entries are prepended.
