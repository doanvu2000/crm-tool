---
name: code-index
description: Maintain this project's .code_index architecture map whenever a project update changes source files, public exports, routes, stores, business rules, design tokens, data flow, or deployment behavior.
metadata:
  short-description: Keep crm-tool's code index synchronized with project changes
---

# Code index maintenance

Use this skill for any task that updates the project. It is especially important when a change adds, removes, renames, or changes the responsibility of a source file, public export, route, store field, feature, business rule, design token, data-flow edge, or deployment configuration.

## Before editing

Read the existing index in this order:

1. `.code_index/README.md`
2. `.code_index/overview.md`
3. The relevant feature document in `.code_index/features/`
4. Relevant graph/design documents when the change affects dependencies, data flow, or UI

For any UI change, read `.code_index/design.md` and apply the project-local UI skill at `.agents/skills/ui-ux/SKILL.md` before making design decisions. If the project or affected feature has no defined style, use both `/frontend-design:frontend-design` and `/ui-ux-pro-max:ui-ux-pro-max` (the latter is available at `C:\Users\dungn\.codex\skills\ui-ux-pro-max\SKILL.md` in this environment). If a requested skill is unavailable, state that limitation and use the existing project style as the fallback. Treat the existing web style as the source of truth: reuse its tokens, typography, spacing, layout, dark-mode behavior, component patterns, and interaction patterns. Do not introduce a new visual direction unless the user explicitly requests a redesign.

Frontend defaults when no existing style is defined:

- Use Tailwind CSS utilities and semantic tokens; avoid scattered custom CSS.
- Use Google Sans for UI text and Google Sans Code for code/SKU/numeric content when appropriate.
- Support dark/light mode with a theme toggle in the header, using the project's existing theme mechanism.
- Build responsive layouts with clearly separated content blocks/sections and clean, simple, readable content.
- Avoid horizontal overflow unless the requirement needs it; follow the existing table/data overflow pattern for wide data.
- When there are multiple sections, provide navigation with a horizontal top menu preferred, and keep it sticky while scrolling.

Use the index to locate the correct feature boundary and existing public API. Preserve the architecture rules documented there:

- `pages` → `features/*` → `features/analysis` → `shared`.
- A feature imports another feature only through its `index.ts` public API.
- `shared/` must not import `features/`.
- `features/analysis/engine/` is framework-free TypeScript.

## After editing

Inspect the changed files and update only the affected existing index documents in the same change. Keep entries concise and descriptive; record paths, responsibilities, exports, and relationships, not copied implementation code.

Use this routing table:

| Change | Update |
|---|---|
| Add/remove/rename a file or public export | Relevant `.code_index/features/<name>.md`; also `overview.md` or `graph/modules.md` when the tree/API/dependency map changes |
| Add a feature | New `features/<name>.md` following existing feature docs, plus `overview.md` and `graph/modules.md` |
| Add/change a route or store field | Relevant feature doc and `overview.md`; update `graph/modules.md` when dependencies change |
| Change thresholds, action rules, or business behavior | `features/analysis.md`, especially its Rules section |
| Change imports, module ownership, or cross-feature dependency | `graph/modules.md` |
| Change how data moves from import to analysis/UI | `graph/data-flow.md` |
| Change colors, tokens, typography, layout, or dark-mode behavior | `design.md` |
| Change build/deploy behavior | `features/deploy.md` and `overview.md` |

If the code change has no architectural/index impact, verify that conclusion and leave the index untouched. Update the `Cập nhật lần cuối` date in `.code_index/README.md` when index content changes, using the current project date.

For UI changes, ensure the implementation remains visually consistent with the existing web and that the applicable design skills cover responsive behavior, accessibility, focus/keyboard interaction, theme switching, and loading/error states.

## Verification

Before finishing, check that:

- every changed source file that affects the map is represented in the appropriate index document;
- feature names, paths, exports, routes, and dependency directions are accurate;
- no implementation code was copied into the index;
- new feature documents are linked from the existing index README or overview where appropriate.

For normal code changes, the project-level checks remain `npm run build:check` and `npm test` as required by `AGENTS.md`.
