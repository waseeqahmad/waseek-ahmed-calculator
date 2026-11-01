# Bill Split Tracker

> **Status: v1 complete.** Stories S-1 to S-8 are built and checked by hand (Implemented). S-9 to S-13 are Not implemented.

## What it is and who it's for

When a group goes out, one friend pays the whole bill. In Pakistan the usual next step is a WhatsApp group: the payer posts their account number, everyone sends their share by bank transfer or Easypaisa/JazzCash, and drops a screenshot. Nobody wants to install an app for this.

This app is for **the person who paid**. They enter the total and who was there. The app works out each person's share and writes a ready-made WhatsApp message. As the money comes in, they tick people off until everyone has paid. Their friends never open the app. They only read the message.

**Why this calculator:** splitting a bill is a real, frequent problem with real edge cases (rounding, validation, editing after people have paid), and it can be built in a few hours without a backend.

## Product documents

- [App roles](docs/app-roles.md): Bill Payer and Group Member
- [Jobs to be done](docs/jobs-to-be-done.md): J-1 to J-3
- [User stories with acceptance criteria](docs/user-stories.md): S-1 to S-8 Implemented, S-9 to S-13 Not implemented (next up)
- [UI and UX plan](docs/ui-plan.md): the Setup and Track screens, how you move between them, and every state (locked)

## Key decisions

- **Equal split in PKR, whole rupees.** The payer counts as one of the people.
- **Friends' shares round up and the payer takes the remainder**, so friends all send one number and the shares always add up to the total (1000 split 3 ways is 334, 334 and 332).
- **Money is stored as integers, never floats.**
- **Paid is a simple tick.** Once anyone is ticked, changing the total or the people needs a confirmation and clears the ticks.
- **One bill, saved in the browser** (localStorage), on the same device only. There's no backend and no accounts.
- **The message is copied or opened in WhatsApp** (`wa.me`). It shows one amount and lists no names.
- **Two screens: Setup and Track.** Setup is for the table (total, people, message). Sending the message moves you to Track, which shows only who has paid. The app reopens where you left off.

## Running the app

**Prerequisites:** Node.js 20.19+ (`.nvmrc` says 20; `nvm use` picks it up)

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # unit tests (Vitest)
npm run build    # type-check and build to dist/
```

The code is four files in `src/`: `split.ts` (pure maths, validation, message text and the saved-data check), `split.test.ts`, `App.tsx` (both screens) and `index.css`.

## Build order

| # | Stage | Status |
|---|---|---|
| 1 | Set up Vite + React + TS + Vitest, `.nvmrc`, `.gitignore` | Done |
| 2 | `src/split.ts` + tests (rounding, too-small guard, validation, shares-add-up property test) | Done |
| 3 | Plain working UI for S-1 to S-8 | Done |
| 4 | Visual design (user-led) | Done: brutalist style, see `docs/ui-plan.md` → Look |
| 5 | Hand-check every acceptance criterion, then update the story statuses | Done: S-1 to S-8 Implemented |
| 6 | Final README, export transcripts, public GitHub repo, optional Vercel deploy | In progress: README and transcripts done |

## AI tool and model

- Claude Code, model Claude Opus 5.5 (`claude-opus-5-5`)
- Transcripts are in `transcripts/`, exported with Claude Code's `/export` and left unchanged:
  - Session 01: planning interview and product docs (`transcripts/session-01.txt`)
  - Session 02: UI and UX plan (`transcripts/session-02.txt`)
  - Session 03: build stages 1 to 3: project setup, `split.ts` with tests, working UI (`transcripts/session-03.txt`)
  - Session 04: visual design, brutalist style (`transcripts/session-04.txt`)
  - Session 05: final story statuses, README and packaging (`transcripts/session-05.txt`)

## Code changed by hand

- None. All code was written by Claude Code.

## Assumptions

- Currency is PKR, whole rupees only. The users are Pakistani friend groups paying each other back by bank or mobile wallet.
- Bills are split equally. Custom amounts per person come later (S-9).
- Data lives only in the payer's browser on one device.
- The message is plain text, so Copy works with any chat app, not only WhatsApp.
- The 10,000,000 PKR cap and the 50-person limit are well beyond any real group bill.
- Friends can't be renamed. To fix a typo, remove the person and add them again (only the payer's own name can be edited).
- Commas are accepted anywhere between digits in the total, so both `1,500` and the Pakistani-style `1,00,000` work. Malformed input such as `1,,5` is rejected as `Enter a number in whole rupees`.
- A total ending in a decimal point (`1500.` or `.5`) gets `Enter whole rupees (no paisa)`.
- The 30-character name limit counts characters as people see them (Unicode code points), so `🍕` counts as one.
- Adding an empty name always shows `Enter a name`, even when the bill already has 50 people.
- With exactly one tick, the warning reads `This will clear 1 payment tick. Continue?` (singular).
- After **Yes** on the "Change total or people" warning, the button that opened it is gone, so focus goes to **Bill total**.
- A reloaded total shows as plain digits (`1,500` comes back as `1500`), because only the integer is saved.
- On Setup, "Bill total", "People" and "Message for the group" are `<h2>` headings, so "focus moves to the first heading" lands on Bill total. On Track the heading is the bill line.
- Saved data with a valid shape that breaks a rule (duplicate friends, a fractional or out-of-range total, payment details over 200 characters) counts as damaged and opens an empty bill.
