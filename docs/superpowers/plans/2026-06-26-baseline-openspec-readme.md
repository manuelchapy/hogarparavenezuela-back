# Baseline OpenSpec And README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the baseline OpenSpec specs from existing `docs/` and add a bilingual institutional README for collaborators.

**Architecture:** Keep existing frontend-facing documentation unchanged and add OpenSpec as the formal baseline under `openspec/specs/`. Add a root `README.md` with side-by-side English and Spanish content for public collaborators.

**Tech Stack:** Markdown, OpenSpec `spec-driven` schema, existing Node.js/Express backend documentation.

---

### Task 1: Create Documentation Artifacts

**Files:**
- Create: `README.md`
- Create: `openspec/specs/platform-overview/spec.md`
- Create: `openspec/specs/api-contract/spec.md`
- Create: `openspec/specs/authentication-and-users/spec.md`
- Create: `openspec/specs/nna-traceability/spec.md`
- Create: `openspec/specs/catalog/spec.md`
- Create: `openspec/specs/geo/spec.md`
- Create: `openspec/specs/lopnna-compliance/spec.md`
- Create: `openspec/specs/infrastructure/spec.md`

- [x] **Step 1: Create OpenSpec directories**

Run: `mkdir -p openspec/specs/{platform-overview,api-contract,authentication-and-users,nna-traceability,catalog,geo,lopnna-compliance,infrastructure}`

- [x] **Step 2: Create bilingual root README**

Create `README.md` with English/Spanish columns, institutional nonprofit tone, emergency context, links to original docs and OpenSpec specs.

- [x] **Step 3: Create baseline OpenSpec specs**

Create one `spec.md` per capability using `Requirement` and `Scenario` sections derived from the existing `docs/` files.

- [ ] **Step 4: Verify docs-only change**

Run: `git status --short`

Expected: only `README.md`, `docs/superpowers/plans/...`, and `openspec/specs/...` are new or modified.
