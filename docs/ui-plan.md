# UI and UX Plan (locked)

**Status: locked plan, built in stage 3 and waiting for the hand-check.** The behaviour and every message string come from `docs/user-stories.md`. This file decides where things go and how they behave on screen. If the two disagree, the user stories win.

## Why two screens

The payer uses the app at two different moments, and each needs different things in focus:

| Moment | How often | What matters | Screen |
|---|---|---|---|
| At the table | Once, about 1 minute | Total, who was there, where to send, the message | **Setup** |
| Over the next days | Many short visits | Who has paid, how much is still owed | **Track** |

Setup stays on one screen rather than a step-by-step wizard. The total, the people and the message affect each other, so seeing the shares and the message update live is the point. Splitting them into steps would add taps at the table and hide that feedback.

## How you move between them

```
          (first run, or New bill → Yes)
                       │
                       ▼
   ┌──────────────────────────────────┐
   │              SETUP               │
   └──────────────────────────────────┘
     │ Open in WhatsApp       ▲     ▲
     │ or Copy message        │     │
     │ (needs a valid split)  │     │ New bill → Yes
     ▼                        │     │
   ┌──────────────────────────┴─────┴─┐
   │              TRACK               │
   └──────────────────────────────────┘
     Edit bill goes back to Setup.
     Back to payments returns to Track.
```

- **Setup → Track:** pressing **Open in WhatsApp**, or pressing **Copy message** when the copy works. Sending the message is the moment you start waiting for money. If the copy fails, you stay on Setup so you can select the text.
- **Track → Setup:** **Edit bill**. There's no warning, and the ticks stay. If anyone is ticked, Setup locks the total and people (see Locked Setup).
- **Setup → Track without resending:** a **Back to payments** link at the top of Setup. It's shown only when the bill has been sent before and the split is still valid.
- **Reopening the app:** it opens on the screen you were last on. If the saved bill has no valid split, it opens on Setup.
- **Changing screens:** the new screen starts scrolled to the top, and focus moves to its first heading. On Setup that is **Bill total** (its label sits inside an `<h2>`, alongside the `People` and `Message for the group` headings). On Track it is the bill line.

Saved state: `view: "setup" | "track"` and `sent: boolean` are saved with the bill. New bill resets both.

## Principles

- **Familiar patterns, so nothing needs a tooltip:** a price field with `PKR` in front, a guest list with you at the top, a to-do checklist for who paid, the message shown as a chat bubble, and "Edit" next to a summary, as on a checkout page.
- **Phone first.** A single column, at most 32rem wide and centred on desktop. Tap targets are at least 44px.
- **Hints, not shouting.** When something is empty, the message is a grey hint. Red is only for real mistakes.
- **Explain only where you'd be confused:** the lock note on Setup and `(optional)` on payment details.

## Header (both screens)

```
Bill Split                      [New bill]
```
- **New bill** is hidden while the bill is completely empty.
- Its confirmation replaces the header bar in place (see Inline confirmations).
- If storage is blocked, a grey notice that can't be dismissed sits under the header: `This bill can't be saved in this browser`.

## Setup screen

```
┌────────────────────────────────────────┐
│ Bill Split                  [New bill] │
├────────────────────────────────────────┤
│ ← Back to payments                     │  only once sent and still valid
│                                        │
│ Bill total                             │
│ ┌────┬───────────────────────────────┐ │
│ │PKR │ 1000                          │ │
│ └────┴───────────────────────────────┘ │
│ hint / error / lock note               │
│                                        │
│ People                                 │
│ Your name                              │
│ [Waseek                 ]    332 PKR   │  your row, always first
│ Ali                          334 PKR ✕ │
│ Sara                         334 PKR ✕ │
│ Add a friend                           │
│ [                       ]  [ Add ]     │
│                                        │
│ Where should friends send the money?   │
│ (optional)                             │
│ ┌────────────────────────────────────┐ │
│ │ e.g. Meezan · Waseek Ahmed ·       │ │
│ │ 0123456789                         │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Message for the group                  │
│ [ Open in WhatsApp ] [ Copy message ]  │
│ copy error goes here                   │
│ ╭────────────────────────────────────╮ │
│ │ Bill split: 1,000 PKR between 3    │ │
│ │ people                             │ │
│ │ Please send 334 PKR each to Waseek:│ │
│ │ Meezan · Waseek Ahmed · 0123456789 │ │
│ │ Send a screenshot here once done 🙏│ │
│ ╰────────────────────────────────────╯ │
└────────────────────────────────────────┘
```

### Bill total
- `type="text" inputmode="numeric"`, labelled `Bill total`, with a fixed `PKR` block inside the field on the left.
- What you type stays as typed. Shares and the message update on every keystroke.
- Only the integer is saved, so after a reload the total shows as plain digits (`1,500` comes back as `1500`).
- The line under the field shows one of: the grey hint `Enter the bill total`, a red S-1 error, or the lock note.
- Focus starts here on an empty bill.

### People
- **Your row is first:** a `Your name` input (`autocomplete="name"`) and your share. The grey hint `Enter your name` shows when it's empty. Name errors such as `Ali is already in the list` show in red in the same place.
- **Friend rows:** `Name ......... 334 PKR  ✕`. Amounts are right-aligned with tabular numbers. `✕` is a real `<button>` with `aria-label="Remove Ali"`, and removing happens instantly with no confirm. There are no checkboxes on Setup, because ticking happens on Track.
- Shares show `—` while there's no valid split.
- **Add a friend:** visible label, a text field and an **Add** button. Enter also adds. After adding, the field clears and keeps focus. Errors show under the field and clear as soon as you type again. New friends go to the bottom.

### Payment details
- A textarea labelled `Where should friends send the money? (optional)`, with example text in the placeholder.
- Native `maxLength={200}`. A `180/200` counter appears only from 180 characters.

### Message
- **Open in WhatsApp** is the primary button and **Copy message** is secondary. They sit **above** the bubble, because the copy-failure message says "select the text below".
- If the copy fails, the red line `Couldn't copy, select the text below` shows and you stay on Setup.
- The bubble is a plain chat-message shape with no WhatsApp branding. It uses `white-space: pre-wrap`, and the text can be selected.
- With no valid split, the bubble is replaced by the grey text `Add your name, a total and at least one friend to create the message` and both buttons are disabled.

### Locked Setup (S-7)
This happens only when you come back to Setup with at least one friend ticked.
- The total field is `disabled`. The `✕` buttons and the **Add a friend** row are hidden. Ticked friends show `paid` next to their name.
- Under the total: `Locked because someone is ticked as paid.` followed by **Change total or people**.
- Your name and payment details stay editable. Changing them doesn't touch the ticks.

## Track screen

```
┌────────────────────────────────────────┐
│ Bill Split                  [New bill] │
├────────────────────────────────────────┤
│ Copied ✓ Now paste it in your WhatsApp │  only right after Copy on Setup
│ group.                                 │
│                                        │
│ 1,000 PKR between 3 people [Edit bill] │
│                                        │
│ 1 of 3 paid · 668 PKR still to collect │  big status line
│                                        │
│ ☑  Waseek            332 PKR           │
│    paid (you)                          │
│ ☐  Ali               334 PKR           │
│ ☐  Sara              334 PKR           │
│                                        │
│ ▸ Message for the group                │  native <details>, closed
└────────────────────────────────────────┘
```

- **Bill line:** `1,000 PKR between 3 people`, with **Edit bill** next to it, as on a checkout summary.
- **Status line:** the S-5 summary, large and `aria-live="polite"`. It becomes a green `Everyone has paid ✓`.
- **Checklist:**
  - Your row has a checked, disabled checkbox and `paid (you)`.
  - Each friend row is `<label>` + checkbox + name + share, and the whole row is the tap target. Accessible name: `Ali paid`.
  - Ticked rows keep their text, with no strike-through. The checked box is the signal.
- **Message for the group:** a native `<details>`, closed by default. Inside are the same two buttons and the bubble, for chasing someone or sending it to a friend who joined late.
  - Pressing **Copy message** here keeps you on Track. The button reads `Copied ✓` for about 2 seconds.
  - If the copy fails, the details open and `Couldn't copy, select the text below` shows above the bubble.
- **Copied notice:** `Copied ✓ Now paste it in your WhatsApp group.` shows only when you arrive from Setup by copying. It's `aria-live="polite"` and isn't saved, so a reload hides it.

## Inline confirmations (S-7, S-8)

Each one replaces the button that triggered it, **in the same spot**:

```
This will clear 2 payment ticks. Continue?        (Setup, under the total)
[ Yes ]  [ Cancel ]

Start a new bill? This clears everything.         (header bar)
[ Yes ]  [ Cancel ]
```
- Focus moves to **Cancel**, and `Esc` also cancels. Afterwards, focus returns to the button that opened the confirmation.
- The question has `role="alert"`. **Yes** has a neutral, solid style, not red.
- New bill → **Yes** opens an empty Setup with focus in **Bill total**.
- Change total or people → **Yes** removes the lock, and with it the button that opened the confirmation, so focus goes to **Bill total**.
- With exactly one tick, the question is singular: `This will clear 1 payment tick. Continue?`

## All states

| State | Screen | What's different |
|---|---|---|
| First run / empty | Setup | Grey hints. Shares show `—`. The message area shows what's missing and its buttons are disabled. No New bill, no Back to payments. |
| Ready | Setup | Shares and the bubble show. The send buttons are enabled. |
| Invalid total | Setup | A red error under the total. Shares show `—`. The send buttons are disabled. |
| Just sent | Track | Nobody is ticked. `1 of N paid · … still to collect`. The copied notice shows if you copied. |
| Collecting | Track | Some friends are ticked. |
| All paid | Track | Green `Everyone has paid ✓`. |
| Editing after ticks | Setup (locked) | Lock note + **Change total or people**. |
| Storage blocked | Both | Grey notice under the header. |

## Accessibility checklist
- Every input has a visible `<label>`. Placeholders are never used as labels.
- Hints and errors are linked with `aria-describedby`, and real errors also set `aria-invalid="true"`.
- Real `<button>`, `<input type="checkbox">` and `<details>` elements. Tap targets are at least 44px. The focus ring is always visible.
- On a screen change, focus goes to the new screen's first heading.
- Contrast meets WCAG AA in both light and dark mode.

## Look (minimal, no dependencies)
- System font stack (`system-ui`). Amounts use tabular numbers.
- Neutral greys plus **one green accent**, used for the primary button, the ticks and `Everyone has paid ✓`. Red is used only for error text.
- One 8px corner radius for every input, button, card and the bubble.
- Light and dark mode come from `prefers-color-scheme`, using CSS variables.
- No animation apart from the `Copied ✓` text swap.

## Deliberately left out
A step-by-step wizard, a router, toasts, modals, tooltips, an icon library, onboarding, undo for remove, and reordering people.
