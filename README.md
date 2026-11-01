# Bill Split Tracker

> **Status: planned, not built yet.** See the build order below.

## What it is and who it's for

When a group goes out, one friend pays the whole bill. In Pakistan the usual next step is a WhatsApp group: the payer posts their account number, everyone sends their share by bank transfer or Easypaisa/JazzCash, and drops a screenshot. Nobody wants to install an app for this.

This app is for **the person who paid**. They enter the total and who was there. The app works out each person's share and writes a ready-made WhatsApp message. As the money comes in, they tick people off until everyone has paid. Their friends never open the app. They only read the message.

**Why this calculator:** splitting a bill is a real, frequent problem with real edge cases (rounding, validation, editing after people have paid), and it can be built in a few hours without a backend.

## Product documents

- [App roles](docs/app-roles.md): Bill Payer and Group Member
- [Jobs to be done](docs/jobs-to-be-done.md): J-1 to J-3
- [User stories with acceptance criteria](docs/user-stories.md): S-1 to S-8 planned for v1, S-9 to S-13 for later

## Key decisions

- **Equal split in PKR, whole rupees.** The payer counts as one of the people.
- **Friends' shares round up and the payer takes the remainder**, so friends all send one number and the shares always add up to the total (1000 split 3 ways is 334, 334 and 332).
- **Money is stored as integers, never floats.**
- **Paid is a simple tick.** Once anyone is ticked, changing the total or the people needs a confirmation and clears the ticks.
- **One bill, saved in the browser** (localStorage), on the same device only. There's no backend and no accounts.
- **The message is copied or opened in WhatsApp** (`wa.me`). It shows one amount and lists no names.

## Running the app

*(Planned. Confirm once the project is set up.)*

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # unit tests
```

## Build order

| # | Stage | Status |
|---|---|---|
| 1 | Set up Vite + React + TS + Vitest, `.nvmrc`, `.gitignore` | Not started |
| 2 | `src/split.ts` + tests (rounding, too-small guard, validation, shares-add-up property test) | Not started |
| 3 | Plain working UI for S-1 to S-8 | Not started |
| 4 | Visual design (user-led) | Not started |
| 5 | Hand-check every acceptance criterion, then update the story statuses | Not started |
| 6 | Final README, export transcripts, public GitHub repo, optional Vercel deploy | Not started |

## AI tool and model

- Claude Code, model Claude Opus 5.5 (`claude-opus-5-5`)
- Session 01: planning interview and docs (`transcripts/session-01.md`)

## Code changed by hand

- None yet.

## Assumptions

- Currency is PKR, whole rupees only. The users are Pakistani friend groups paying each other back by bank or mobile wallet.
- Bills are split equally. Custom amounts per person come later (S-9).
- Data lives only in the payer's browser on one device.
- The message is plain text, so Copy works with any chat app, not only WhatsApp.
- The 10,000,000 PKR cap and the 50-person limit are well beyond any real group bill.
- Friends can't be renamed. To fix a typo, remove the person and add them again (only the payer's own name can be edited).
