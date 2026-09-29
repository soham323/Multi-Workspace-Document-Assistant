---
name: stage-tracker
description: >-
  Teaches the agent how to create, structure, and continuously update a Stage Tracker document
  (STAGES.md) that divides project work into ordered delivery stages, tracks the status of every
  task (To Do / In Progress / Testing / Done / Blocked), and maintains a timestamped Update History
  so the full evolution of the plan is always visible. Use this skill whenever creating, updating,
  or querying the project stage plan.
---

# Stage Tracker Skill

## Purpose
The Stage Tracker (`docs/STAGES.md`) is the **living execution plan** for the project. It breaks
all work identified in the TRD into ordered, discrete delivery stages. Each stage groups related
tasks, tracks their status, and provides a clear picture of what is done, what is in flight, and
what is upcoming at any given moment.

In an agent-driven development workflow, this document is the agent's task board. Every code change,
infrastructure setup, or documentation update MUST be reflected here with a status update and a
new Update History entry.

---

## When to Activate
- User asks to **create** a stage plan or delivery roadmap for the project.
- User asks to **update the status** of any task or stage (starting work, completing, blocking).
- User asks to **add new tasks** discovered during implementation.
- User asks to **review progress** or asks "what's next?".
- Agent completes a significant piece of work and needs to mark it done.
- Agent is about to start a new task and should mark it "In Progress".

---

## File Location Convention
```
<project-root>/docs/STAGES.md
```
Never create STAGES.md in the project root. Always use `docs/`.

---

## Document Structure
Every STAGES.md MUST contain the following top-level sections in this order:

```
1. Document Header       — name, version, status, owner, timestamps
2. Update History        — reverse-chronological changelog (newest first)
3. Progress Summary      — at-a-glance counters: total tasks, done, in-progress, blocked, to-do
4. Stage Definitions     — ordered list of stages, each with tasks and statuses
5. Blocked Items Log     — tasks currently blocked with reason and unblocking condition
6. Scalability & Future  — architectural notes for future scaling (kept here so they are not lost)
```

---

## Document Header Template
```markdown
# Stage Tracker
## <Project Name>

| Field         | Value                          |
| :------------ | :----------------------------- |
| **Version**   | 1.0.0                          |
| **Status**    | Active                         |
| **Owner**     | <Author Name>                  |
| **Created**   | YYYY-MM-DD HH:MM IST           |
| **Updated**   | YYYY-MM-DD HH:MM IST           |
| **Project**   | <Repository or Project Name>   |
```

---

## Update History Format (CRITICAL RULE)
Identical rule as the TRD skill — MUST be enforced on every update.

### Rules:
1. **Every time STAGES.md is modified**, a new entry MUST be prepended (at the top) of the
   Update History table. The newest entry is always first.
2. Timestamp uses local system time: `YYYY-MM-DD HH:MM <timezone>` (e.g., `2026-09-29 18:40 IST`).
3. Summary MUST be specific — list exactly which tasks changed status or were added.
4. Version bumps follow SemVer:
   - **PATCH** (x.x.1): Minor clarification, description fix, typo.
   - **MINOR** (x.1.0): Status change(s) on existing tasks, new tasks added within a stage.
   - **MAJOR** (1.0.0 -> 2.0.0): New stage added, stage order changes, major scope change.

### Template:
```markdown
## Update History

| Version | Date & Time          | Summary of Changes                                             |
| :------ | :------------------- | :------------------------------------------------------------- |
| 1.2.0   | 2026-09-29 20:00 IST | ST-0-3 Done, ST-1-1 In Progress, ST-1-2 added (new task)     |
| 1.1.0   | 2026-09-29 18:40 IST | ST-0-1 Done, ST-0-2 In Progress                               |
| 1.0.0   | 2026-09-29 18:36 IST | Initial STAGES.md created — all stages and tasks drafted      |
```

---

## Task ID Format
Every task MUST have a unique, stable ID in the format:

```
ST-<stage-number>-<task-number>
```

Examples:
- `ST-0-1` — Stage 0, Task 1 (Project Setup)
- `ST-3-2` — Stage 3, Task 2 (RAG Pipeline)

IDs are **never reused**. If a task is removed, its ID is retired. New tasks appended to a stage
continue from the highest existing task number in that stage.

---

## Status Values
Use exactly these four status values (plus Blocked):

| Status | Emoji | Meaning |
| :--- | :--- | :--- |
| `To Do` | ⬜ | Not yet started. |
| `In Progress` | 🟡 | Actively being worked on. |
| `Testing` | 🔵 | Implementation complete; being verified. |
| `Done` | ✅ | Verified and complete. |
| `Blocked` | 🔴 | Cannot proceed; reason logged in Blocked Items Log. |

---

## Stage Definition Format
Each stage uses this template:

```markdown
### Stage N: <Stage Name>
**Goal**: One-sentence description of what this stage achieves.
**Depends On**: Stage X (or "None")
**Scalability Note**: How this stage's work is designed with future scale in mind (optional but encouraged).

| Task ID  | Task Description                          | Status       | Related FRs / NFRs    | Notes                         |
| :------- | :---------------------------------------- | :----------- | :-------------------- | :---------------------------- |
| ST-N-1   | Description of task 1                     | ⬜ To Do     | FR-001                |                               |
| ST-N-2   | Description of task 2                     | 🟡 In Progress | FR-002, NFR-001      | Started 2026-09-29            |
| ST-N-3   | Description of task 3                     | ✅ Done      | FR-003                | Completed 2026-09-29          |
```

---

## Progress Summary Format
```markdown
## Progress Summary

| Metric         | Count |
| :------------- | :---- |
| Total Tasks    | NN    |
| ✅ Done        | NN    |
| 🟡 In Progress | NN    |
| 🔵 Testing     | NN    |
| 🔴 Blocked     | NN    |
| ⬜ To Do       | NN    |
```

> **This section MUST be recalculated and updated every time any task status changes.**

---

## Blocked Items Log Format
```markdown
## Blocked Items Log

| Task ID | Description         | Blocked Reason                          | Unblocking Condition              | Since       |
| :------ | :------------------ | :-------------------------------------- | :-------------------------------- | :---------- |
| ST-2-3  | Discord Webhook Setup | Webhook URL not yet created by user    | User provides DISCORD_WEBHOOK_URL | 2026-09-29  |
```

---

## Scalability & Future Section
This section captures architectural scalability notes that should influence current implementation
decisions — even if full scale is not needed now. These notes are derived from the TRD's scope
and the team's forward-looking architectural choices.

```markdown
## Scalability & Future Architecture Notes

> These notes capture decisions made today with future scale in mind. They do NOT change current
> implementation scope but MUST be considered when making implementation choices.

- **Note 1**: ...
- **Note 2**: ...
```

---

## Agent Workflow: Creating a New STAGES.md
1. Read the current TRD (`docs/TRD.md`) to identify all functional requirements.
2. Group FRs and technical tasks into logical, ordered delivery stages.
3. Create `docs/STAGES.md` with all sections populated.
4. Set **Version: 1.0.0**, **Status: Active**, and **Created & Updated** to current local timestamp.
5. Set all tasks to `⬜ To Do` (unless work is already underway).
6. Calculate the initial Progress Summary counts.
7. Add an initial Update History entry: `"Initial STAGES.md created"`.
8. Add relevant scalability notes based on the TRD's architectural decisions.

## Agent Workflow: Updating an Existing STAGES.md
1. Read the current `docs/STAGES.md` and identify the current version.
2. Make all required changes:
   - Update task statuses.
   - Add new tasks (with new IDs) if discovered.
   - Add or update notes on changed tasks.
3. **Recalculate the Progress Summary** counts.
4. If a task is now blocked, add an entry to the Blocked Items Log.
5. **Prepend** a new row to Update History with: new version, current local timestamp, specific summary.
6. Update the `**Updated**` field in the Document Header.
7. Determine version bump: PATCH / MINOR / MAJOR.
8. Save and confirm to the user with the new version and timestamp.

---

## Quality Rules
- Progress Summary MUST always reflect the actual current state — recount every time.
- Task IDs are immutable once assigned.
- Update History is append-only (prepend new rows — never edit existing rows).
- Stages must remain in dependency order (a stage that depends on another comes after it).
- Every task MUST reference at least one FR, NFR, or TC from the TRD.
- The Scalability & Future section should be updated whenever new architectural decisions are made.
