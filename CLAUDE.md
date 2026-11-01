# CLAUDE.md

A bill-split tracker for the person who paid. It's a take-home assignment (the brief is in `BRIEF.local.md`, which is git-ignored and must never be committed).

## Read first
- `docs/user-stories.md` is **the spec**. Every behaviour and error message is in its acceptance criteria. Build to the criteria exactly, using the exact message strings.
- `docs/app-roles.md`, `docs/jobs-to-be-done.md`: who the app is for and why.
- `README.md`: overview, the build-order status, and the run commands.

## Stack
Vite + React + TypeScript, plain CSS, Vitest. No state library, no router, no UI kit. Ask before adding any dependency.

## Commands
- `npm install`, `npm run dev`, `npm test`, `npm run build`

## Rules
- **Money is integer rupees, never floats.** Parse to an integer at the input. State and localStorage hold integers only. Round with `q = Math.trunc(total / n)`, `r = total - q*n`, `share = r > 0 ? q + 1 : q`.
- **`src/split.ts` is pure:** the split maths and input validation live there, with no React imports. `src/split.test.ts` must include a property test that the shares always add up exactly to the total.
- The total input is `type="text" inputmode="numeric"`, never `type="number"`.
- localStorage is a trust boundary. Saved data can be missing, damaged or blocked. Never crash; fall back to an empty bill.
- No browser `alert`/`confirm`/`prompt`. Confirmations are shown inline on the page.
- Accessibility basics: labelled inputs, real `<button>` and checkbox elements, errors linked to their field via `aria-describedby`.
- **Visual design is user-led.** Build plain, working UI. Don't invent a visual style unless asked.

## Process
- Keep the stories marked **Not implemented** until each acceptance criterion has been checked by hand in the running app, and only then change the status in `docs/user-stories.md`.
- When the user edits code by hand, add it to "Code changed by hand" in the README.
- Update the build-order table in the README as each stage lands.
- If the built behaviour changes, update the docs in the same change. The docs must describe what was actually built.
